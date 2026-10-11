// SDK contract tests against a synthetic provider, NOT real Supabase/email/MFA tests.
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const runtime=createRequire(require.resolve('wrangler/package.json'));
const {Miniflare,createFetchMock}=await import(pathToFileURL(runtime.resolve('miniflare')).href);
async function modulesAt(path){let files=[];for(const d of await readdir(path,{withFileTypes:true})){const p=resolve(path,d.name);if(d.isDirectory())files.push(...await modulesAt(p));else if(d.name.endsWith('.js')||d.name.endsWith('.mjs'))files.push({type:'ESModule',path:p})}return files}
const modules=await modulesAt('dist/server');modules.sort((a,b)=>a.path===resolve('dist/server/index.js')?-1:b.path===resolve('dist/server/index.js')?1:0);
const subject='11111111-1111-4111-8111-111111111111',sessionId='33333333-3333-4333-8333-333333333333',issuer='https://auth.mock.test/auth/v1';
const key=await crypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},true,['sign','verify']);
const jwk={...await crypto.subtle.exportKey('jwk',key.publicKey),kid:'synthetic-test-key',alg:'ES256',use:'sig'};
const encode=x=>Buffer.from(JSON.stringify(x)).toString('base64url');
const now=Math.floor(Date.now()/1000);
async function token(aal='aal1',sid=sessionId){const input=encode({alg:'ES256',kid:jwk.kid,typ:'JWT'})+'.'+encode({sub:subject,iss:issuer,aud:'authenticated',iat:now,exp:now+3600,aal,session_id:sid,amr:[{method:aal==='aal2'?'totp':'password',timestamp:now}],role:'authenticated'});return input+'.'+Buffer.from(await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},key.privateKey,new TextEncoder().encode(input))).toString('base64url')}
const user={id:subject,aud:'authenticated',role:'authenticated',email:'synthetic@example.test',email_confirmed_at:new Date().toISOString(),created_at:new Date().toISOString(),app_metadata:{provider:'email'},user_metadata:{full_name:'Synthetic user',country:'Bangladesh',currency:'BDT',language:'en',terms_version:'2026-10-v2.2',role:'SUPER_ADMIN'}};
const factorId='44444444-4444-4444-8444-444444444444';user.factors=[{id:factorId,factor_type:'totp',status:'verified',created_at:new Date().toISOString(),updated_at:new Date().toISOString()}];
const access=await token(),session={access_token:access,refresh_token:'synthetic-refresh-not-a-real-credential',token_type:'bearer',expires_in:3600,expires_at:now+3600,user};
const pool=await Promise.all(Array.from({length:20},async()=>{const sid=crypto.randomUUID();return {...session,access_token:await token('aal1',sid),mfa:await token('aal2',sid)}}));let index=0,active=pool[0];const next=options=>{active=pool[index++];return JSON.stringify(active)};
const fetchMock=createFetchMock();fetchMock.disableNetConnect();const provider=fetchMock.get('https://auth.mock.test');
provider.intercept({path:'/auth/v1/token?grant_type=password',method:'POST'}).reply(400,{code:'invalid_credentials',message:'Invalid login credentials'}).times(1);
provider.intercept({path:'/auth/v1/token?grant_type=password',method:'POST'}).reply(200,next).persist();
provider.intercept({path:'/auth/v1/user',method:'GET'}).reply(200,user).persist();
provider.intercept({path:'/auth/v1/.well-known/jwks.json',method:'GET'}).reply(200,{keys:[jwk]}).persist();
provider.intercept({path:'/auth/v1/signup?redirect_to=https%3A%2F%2Fsite.test%2Fauth%2Fcallback',method:'POST'}).reply(200,{user:{...user,email_confirmed_at:null}}).persist();
provider.intercept({path:'/auth/v1/verify',method:'POST'}).reply(200,next).persist();
provider.intercept({path:'/auth/v1/user',method:'PUT'}).reply(200,user).persist();
provider.intercept({path:'/auth/v1/recover?redirect_to=https%3A%2F%2Fsite.test%2Fauth%2Fcallback%3Fflow%3Drecovery',method:'POST'}).reply(200,{}).persist();
provider.intercept({path:'/auth/v1/factors/'+factorId+'/challenge',method:'POST'}).reply(200,{id:'synthetic-challenge',expires_at:now+300}).persist();
provider.intercept({path:'/auth/v1/factors/'+factorId+'/verify',method:'POST'}).reply(200,()=>JSON.stringify({...active,access_token:active.mfa})).persist();
provider.intercept({path:'/auth/v1/logout?scope=global',method:'POST'}).reply(204).persist();
provider.intercept({path:'/auth/v1/logout?scope=local',method:'POST'}).reply(204).persist();
const baseOptions={modules,modulesRoot:resolve('dist/server'),compatibilityDate:'2026-05-15',compatibilityFlags:['nodejs_compat'],d1Databases:['DB'],r2Buckets:['BUCKET'],fetchMock,bindings:{SUPABASE_URL:'https://auth.mock.test',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_synthetic_not_a_real_key',APP_ORIGIN:'https://site.test',AUTH_PROVIDER_ENABLED:'true',EXTERNAL_HOSTING:'true'}};
const mf=new Miniflare(baseOptions);
let checks=0;const jar=new Map();
async function request(method,path,body,expected=200,remember=true){const r=await mf.dispatchFetch('https://site.test'+path,{method,redirect:'manual',headers:{origin:'https://site.test','content-type':'application/json',cookie:[...jar].map(([k,v])=>k+'='+v).join('; ')},...(body?{body:JSON.stringify(body)}:{})});const t=await r.text();assert.equal(r.status,expected,path+': '+t.slice(0,500));checks++;for(const raw of r.headers.getSetCookie()){if(raw.startsWith('vf-supabase-auth')&&raw.split(';')[0].split('=')[1]){assert.ok(raw.includes('HttpOnly'));assert.ok(raw.includes('Secure'));assert.ok(/samesite=lax/i.test(raw));checks+=3;if(!remember){assert.ok(!raw.includes('Max-Age='));checks++}}const [pair]=raw.split(';'),split=pair.indexOf('='),name=pair.slice(0,split),value=pair.slice(split+1);if(!value)jar.delete(name);else jar.set(name,value)}try{return JSON.parse(t)}catch{return t}}
try{let db=await mf.getD1Database('DB');for(const f of (await readdir('drizzle')).filter(f=>f.endsWith('.sql')).sort())await db.exec((await readFile('drizzle/'+f,'utf8')).replaceAll('--> statement-breakpoint','').replaceAll('\n',' '));
const forged=await mf.dispatchFetch('https://site.test/api/data',{headers:{'oai-authenticated-user-id':'other-user','oai-authenticated-user-email':'fake@example.test'}});assert.equal(forged.status,401);checks++;
const anonymousLogin=await request('GET','/login');assert.ok(!anonymousLogin.includes('Continue with ChatGPT'));checks++;
const anonymousRegister=await request('GET','/register');assert.ok(!anonymousRegister.includes('Existing ChatGPT workspace'));checks++;
const google=await request('POST','/api/auth/google',{remember:false});assert.equal(new URL(google.redirect).origin,'https://auth.mock.test');assert.equal(new URL(google.redirect).searchParams.get('provider'),'google');checks+=2;await request('POST','/api/auth/google',{remember:false,role:'SUPER_ADMIN'},400);
const configuration=await request('GET','/api/auth/config');assert.equal(configuration.configured,true);checks++;
await request('POST','/api/auth/signup',{role:'SUPER_ADMIN'},400);
const invalid=await request('POST','/api/auth/login',{email:'wrong@example.test',password:'WrongPassword123',remember:false},401);assert.equal(invalid.error,'Invalid email or password.');checks++;
const logged=await request('POST','/api/auth/login',{email:user.email,password:'SyntheticPassword123',remember:false},200,false);assert.equal(logged.redirect,'/dashboard');checks++;
const membership=await request('GET','/api/membership');assert.equal(membership.role,'USER');assert.equal(membership.member.id,'supabase:'+subject);checks+=2;
const data=await request('GET','/api/data');assert.equal(data.accounts.length,0);checks++;
await request('GET','/api/platform',null,403);
await request('POST','/api/auth/reset',{password:'NewSyntheticPassword123',confirmation:'NewSyntheticPassword123'},403);
await request('POST','/api/auth/link',{confirm:true},403);
await request('POST','/api/auth/mfa-enroll',{},403);
const capturedCookie=[...jar].map(([k,v])=>k+'='+v).join('; ');
const signout=await request('POST','/api/auth/logout',{});assert.equal(signout.redirect,'/login');checks++;
await request('GET','/api/data',null,401);
const replay=await mf.dispatchFetch('https://site.test/api/data',{headers:{cookie:capturedCookie}});assert.equal(replay.status,401);checks++;
await request('POST','/api/auth/login',{email:user.email,password:'SyntheticPassword123',remember:true,admin:true},400);
await request('POST','/api/auth/signup',{name:'Synthetic user',email:user.email,password:'SyntheticPassword123',confirmation:'SyntheticPassword123',country:'Bangladesh',currency:'BDT',language:'en',agree:true},202);
await request('POST','/api/auth/forgot',{email:user.email},202);
await request('GET','/auth/confirm?token_hash=synthetic-recovery-proof&type=recovery',null,303);
const flow=await db.prepare('SELECT hash FROM auth_flows').first();assert.ok(flow);assert.ok(flow.hash!==jar.get('vf-recovery'));checks+=2;
await request('POST','/api/auth/reset',{password:'NewSyntheticPassword123',confirmation:'NewSyntheticPassword123'});
assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM auth_flows').first()).n,0);checks++;
await request('POST','/api/auth/reset',{password:'NewSyntheticPassword123',confirmation:'NewSyntheticPassword123'},401);
await db.prepare("UPDATE platform_roles SET role='SUPER_ADMIN',provisioned_by='synthetic-operator' WHERE owner=?").bind('supabase:'+subject).run();
const adminLogin=await request('POST','/api/auth/login',{email:user.email,password:'SyntheticPassword123',remember:true});assert.equal(adminLogin.redirect,'/login?step=mfa');checks++;
await request('GET','/api/platform',null,403);
const adminBeforeMFA=await mf.dispatchFetch('https://site.test/admin/dashboard',{redirect:'manual',headers:{cookie:[...jar].map(([k,v])=>k+'='+v).join('; ')}});assert.equal(adminBeforeMFA.status,307);assert.ok(adminBeforeMFA.headers.get('location').includes('/login?step=mfa'));checks+=2;
const mfaPage=await request('GET','/login?step=mfa');assert.ok(mfaPage.includes('Multi-Factor Authentication'));assert.ok(!mfaPage.includes('href="/admin/login"'));checks+=2;
const factorList=await request('POST','/api/auth/mfa-factors',{});assert.equal(factorList.factors[0].id,factorId);checks++;
const verified=await request('POST','/api/auth/mfa-verify',{factorId,code:'123456'});assert.equal(verified.redirect,'/admin/dashboard');checks++;
await db.prepare("INSERT INTO accounts(id,owner,name,bank,currency,opening,date,details,created) VALUES('private','other-user','PRIVATE_FINANCE_MARKER','Bank','BDT',987654321,'2026-01-01','{}','2026-01-01')").run();
const adminView=await request('GET','/api/platform?mode=users');assert.ok(!JSON.stringify(adminView).includes('PRIVATE_FINANCE_MARKER'));assert.ok(!JSON.stringify(adminView).includes('987654321'));checks+=2;
const ownData=await request('GET','/api/data');assert.equal(ownData.accounts.length,0);checks++;
await request('GET','/api/platform?mode=transactions',null,400);
const modulesBefore=await request('GET','/api/platform?mode=modules');assert.equal(modulesBefore.modules.length,15);checks++;
await request('POST','/api/platform',{action:'save-module',data:{route:'accounts',enabled:false,label:'Bank accounts',description:'Synthetic maintenance'}});
await request('POST','/api/data',{kind:'account',data:{}},403);
const disabledPage=await request('GET','/accounts');assert.ok(disabledPage.includes('temporarily unavailable'));checks++;
assert.ok(await db.prepare("SELECT id FROM accounts WHERE id='private'").first());checks++;
await request('POST','/api/platform',{action:'save-module',data:{route:'accounts',enabled:true,label:'Bank accounts',description:''}});
const modulesRestored=await request('GET','/api/platform?mode=modules');assert.equal(modulesRestored.modules.find(m=>m.route==='accounts').enabled,true);checks++;
const health=await request('GET','/api/platform?mode=health');assert.equal(health.schema,'ready');assert.equal(health.financialDataInspected,false);checks+=2;


await request('POST','/api/auth/logout',{});await request('GET','/api/platform',null,401);
await db.prepare("UPDATE platform_users SET status='suspended' WHERE id=?").bind('supabase:'+subject).run();
const suspended=await request('POST','/api/auth/login',{email:user.email,password:'SyntheticPassword123',remember:false},403);assert.ok(suspended.error.includes('suspended'));checks++;await request('GET','/api/data',null,401);
await db.prepare("UPDATE platform_users SET status='active' WHERE id=?").bind('supabase:'+subject).run();
await db.prepare("UPDATE platform_roles SET role='USER' WHERE owner=?").bind('supabase:'+subject).run();
const again=await request('POST','/api/auth/login',{email:user.email,password:'SyntheticPassword123',remember:false});assert.equal(again.redirect,'/dashboard');checks++;await request('POST','/api/platform',{action:'save-module',data:{route:'accounts',enabled:false,label:'Bank accounts',description:''}},403);await db.prepare("UPDATE platform_users SET status='banned' WHERE id=?").bind('supabase:'+subject).run();await request('GET','/api/data',null,403);await db.prepare("UPDATE platform_users SET status='active' WHERE id=?").bind('supabase:'+subject).run();await request('POST','/api/auth/logout',{});await request('GET','/api/data',null,401);
console.log(`Supabase SDK contract: ${checks} checks passed against a mocked provider; no real email delivery or MFA claim.`)
}finally{await mf.dispose();await fetchMock.close()}

