import assert from 'node:assert/strict';
import { readFile,readdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
const dir=(await readdir('node_modules/.pnpm')).find(s=>s.startsWith('miniflare@'));
const {Miniflare}=await import(pathToFileURL(resolve('node_modules/.pnpm',dir,'node_modules/miniflare/dist/src/index.js')).href);
async function modulesAt(path){let files=[];for(const d of await readdir(path,{withFileTypes:true})){const p=resolve(path,d.name);if(d.isDirectory())files.push(...await modulesAt(p));else if(d.name.endsWith('.js')||d.name.endsWith('.mjs'))files.push({type:'ESModule',path:p})}return files}
const modules=await modulesAt('dist/server');modules.sort((a,b)=>a.path===resolve('dist/server/index.js')?-1:b.path===resolve('dist/server/index.js')?1:0);
const mf=new Miniflare({modules,modulesRoot:resolve('dist/server'),compatibilityDate:'2026-05-15',compatibilityFlags:['nodejs_compat'],d1Databases:['DB'],r2Buckets:['BUCKET'],bindings:{}});
let checks=0;
async function api(method,path,body,owner='owner',expected=200){const headers=new Headers();if(owner){headers.set('oai-authenticated-user-id',owner);headers.set('oai-authenticated-user-email',owner+'@example.test')}headers.set('origin','http://site.test');let payload;if(body instanceof FormData){const req=new Request('http://site.test',{method:'POST',body});headers.set('content-type',req.headers.get('content-type'));payload=await req.arrayBuffer();}else if(body){headers.set('content-type','application/json');payload=JSON.stringify(body)}const r=await mf.dispatchFetch('http://site.test'+path,{method,headers,body:payload});const t=await r.text();assert.equal(r.status,expected,`${method} ${path}: ${t.slice(0,500)}`);checks++;try{return JSON.parse(t)}catch{return t}}
try{
const db=await mf.getD1Database('DB');const migrations=(await readdir('drizzle')).filter(f=>f.endsWith('.sql')).sort();for(const f of migrations){if(f==='0002_fresh_tag.sql'){await db.prepare('INSERT INTO accounts(id,owner,name,bank,currency,opening,date,details,created) VALUES(?,?,?,?,?,?,?,?,?)').bind('pre-v2-account','pre-v2','Existing savings','Synthetic bank','BDT',321000,'2026-01-01',JSON.stringify({holder:'Pre migration',ownership:'Self',accessible:true,masked:'1111'}),'2026-01-01').run()}if(f==='0006_robust_wallflower.sql')await db.prepare("INSERT INTO platform_users(id,name,email,status,created,last_seen,preferences) VALUES('legacy-role','Legacy','legacy@example.test','active','2026-01-01','2026-01-01','{}')").run();await db.exec((await readFile('drizzle/'+f,'utf8')).replaceAll('--> statement-breakpoint','').replaceAll('\n',' '))}
assert.equal((await db.prepare("SELECT role FROM platform_roles WHERE owner='legacy-role'").first()).role,'USER');checks++;await assert.rejects(()=>db.prepare("UPDATE platform_roles SET role='OWNER' WHERE owner='legacy-role'").run());checks++;
const preserved=await db.prepare('SELECT * FROM accounts WHERE id=?').bind('pre-v2-account').first();assert.equal(preserved.opening,321000);assert.equal(preserved.owner,'pre-v2');checks+=2;

await api('GET','/api/data',null,'',401);
await api('POST','/api/membership',{name:'Visitor',agree:true},'',401);
await api('GET','/api/data',null,'fresh',403);
await api('POST','/api/membership',{name:'New user',agree:false},'fresh',400);
await api('POST','/api/membership',{name:'New user',agree:true,role:'SUPER_ADMIN'},'fresh',400);
for(const id of ['owner','intruder','superadmin','fresh']){const enrolled=await api('POST','/api/membership',{name:id,agree:true},id,201);assert.equal(enrolled.role,'USER');checks++}
await db.prepare("UPDATE platform_roles SET role='SUPER_ADMIN',provisioned_by='synthetic-operator' WHERE owner='superadmin'").run();
await api('GET','/api/platform',null,'',401);
await api('GET','/api/platform',null,'intruder',403);
await api('GET','/api/platform?mode=transactions',null,'superadmin',400);
await api('GET','/api/platform?mode=users',null,'superadmin',503);
await api('POST','/api/platform',{action:'suspend',target:'owner'},'superadmin',503);
const blockedRegistration=await mf.dispatchFetch('http://site.test/api/membership',{method:'POST',headers:{'oai-authenticated-user-id':'cross','oai-authenticated-user-email':'cross@example.test',origin:'https://evil.test','content-type':'application/json'},body:JSON.stringify({name:'cross',agree:true})});assert.equal(blockedRegistration.status,403);checks++;
const securityHeaders=await mf.dispatchFetch('http://site.test/home');assert.equal(securityHeaders.headers.get('x-content-type-options'),'nosniff');assert.ok(securityHeaders.headers.get('content-security-policy').includes("object-src 'none'"));checks+=2;
const role=await api('GET','/api/membership',null,'fresh');assert.equal(role.role,'USER');assert.equal(role.emailPasswordAvailable,false);checks+=2;
const clean=await api('GET','/api/data',null,'fresh');assert.equal(clean.accounts.length,0);assert.equal(clean.documents.length,0);checks+=2;

for(const [route,label] of [['/','Overview'],['/accounts','Bank accounts'],['/transactions','Transactions'],['/calendar','Transaction calendar'],['/analytics','Financial insights'],['/countries','Country requirements'],['/targets','My destinations'],['/readiness','Financial readiness'],['/comparison','Compare countries'],['/sponsors','Sponsors &amp; sources'],['/documents','Document vault'],['/goals','Savings goals'],['/expenses','Archived education budget'],['/currency','Currency converter'],['/history','Fund history'],['/reports','Financial reports'],['/settings','Settings'],['/notifications','Notifications']]){const s=await api('GET',route,null,'owner');assert.ok(s.includes('<b>'+label+'</b>'),'Wrong route content: '+route);assert.ok(s.includes('href=\"/accounts\"'),'Native account link is missing');assert.ok(s.indexOf("localStorage.getItem('visafund-theme')")<s.indexOf('<body'),'Theme must initialize before body content');checks+=3}
for(const [route,title] of [['home','Plan your study funding'],['features','Your funding workspace'],['how-it-works','How VisaFund works'],['supported-countries','Supported destinations'],['requirements','General financial requirements'],['public-comparison','Country comparison'],['calculator','Public financial calculator'],['about','About VisaFund'],['help','Help &amp; FAQs'],['faq','Frequently asked questions'],['contact','Contact and support'],['privacy','Privacy policy'],['terms','Terms of service'],['login','Welcome Back to VisaFund'],['register','Create Your VisaFund Account']]){const html=await api('GET','/'+route,null,'');assert.ok(html.includes(title),'Public page: '+route);assert.ok(!html.includes('Test savings'));checks+=2}
for(const route of ['/login','/register','/forgot-password','/auth/reset-password','/auth/link']){const html=await api('GET',route,null,'');assert.ok(html.includes('Email/password login is not configured yet.'));assert.ok(!html.includes('href="/admin/login"'));checks+=2}
const loginUI=await api('GET','/login',null,'');for(const label of ['Welcome Back to VisaFund','Email Address','Password','Remember Me','Forgot Password?','Sign In','Sign Up','/visafund-logo.svg']){assert.ok(loginUI.includes(label),label);checks++;}
const signupUI=await api('GET','/register',null,'');for(const label of ['Create Your VisaFund Account','Full Name','Confirm Password','Country','Preferred Currency','Preferred Language','Create Account','password-strength','type=\"email\"']){assert.ok(signupUI.includes(label),label);checks++;}
assert.ok(signupUI.includes('disabled'));checks++;
const guestHeader=await api('GET','/home',null,'');assert.ok(guestHeader.includes('href=\"/login\"'));assert.ok(guestHeader.includes('Sign Up'));assert.ok(!guestHeader.includes('Admin Login'));checks+=3;
const userHeader=await api('GET','/home',null,'owner');assert.ok(userHeader.includes('My Account'));assert.ok(userHeader.includes('Logout'));assert.ok(!userHeader.includes('Sign Up'));checks+=3;
const adminHeader=await api('GET','/home',null,'superadmin');assert.ok(adminHeader.includes('Admin Dashboard'));assert.ok(adminHeader.includes('Logout'));assert.ok(!adminHeader.includes('Admin Login'));checks+=3;
const retiredAdmin=await mf.dispatchFetch('http://site.test/admin/login',{redirect:'manual'});assert.equal(retiredAdmin.status,307);assert.ok(retiredAdmin.headers.get('location').endsWith('/login'));checks+=2;
for(const operation of ['signup','login','forgot','reset','link','mfa-enroll','mfa-factors','mfa-verify'])await api('POST','/api/auth/'+operation,{},'',503);
await api('POST','/api/auth/logout',{},'',200);
const authConfig=await api('GET','/api/auth/config',null,'');assert.equal(authConfig.configured,false);checks++;
for(const route of ['/auth/confirm?token_hash=not-a-real-token&type=signup','/auth/callback?code=not-a-real-code'])await api('GET',route,null,'',503);
const forgedCookie=await mf.dispatchFetch('http://site.test/api/data',{headers:{'oai-authenticated-user-id':'owner','oai-authenticated-user-email':'owner@example.test',cookie:'vf-supabase-auth=forged'}});assert.equal(forgedCookie.status,401);checks++;
const adminDenied=await api('GET','/admin',null,'intruder');assert.ok(adminDenied.includes('Super Admin access required'));checks++;
const adminLocked=await api('GET','/admin/users',null,'superadmin');assert.ok(adminLocked.includes('Super Admin access required')&&!adminLocked.includes('PLATFORM ADMINISTRATION'));checks++;
const a=await api('POST','/api/data',{kind:'account',data:{name:'Test savings',bank:'Test bank',currency:'BDT',opening:'1200000',date:'2026-01-01',holder:'Test owner',ownership:'Self',type:'Savings account',masked:'1234',accessible:true}},'owner',201);
const c=await api('POST','/api/data',{kind:'account',data:{name:'Second account',bank:'Test bank',currency:'BDT',opening:'0',date:'2026-01-01',holder:'Test owner',ownership:'Self',type:'Savings account',masked:'5678',accessible:true}},'owner',201);
const empty=await api('POST','/api/data',{kind:'account',data:{name:'Empty',bank:'Synthetic bank',currency:'BDT',opening:'0',date:'2026-01-01',holder:'Test',ownership:'Self',type:'Savings',masked:''}},'owner',201);
await api('DELETE','/api/data',{kind:'account',id:empty.id},'intruder',404);
await api('DELETE','/api/data',{kind:'account',id:empty.id},'owner');
const transaction={account:a.id,date:'2026-01-02',amount:'45000',direction:'credit',description:'Test salary',category:'Salary',source:'Employment'};
await api('POST','/api/data',{kind:'transaction',data:transaction},'owner',201);
await api('POST','/api/data',{kind:'transaction',data:{...transaction,account:a.id}},'intruder',404);
await api('POST','/api/data',{kind:'transaction',data:{...transaction,date:'2025-12-31'}},'owner',400);
await api('POST','/api/data',{kind:'transaction',data:{...transaction,date:'2099-01-01'}},'owner',400);
await api('POST','/api/data',{kind:'transaction',data:{...transaction,amount:'-2'}},'owner',400);
await api('DELETE','/api/data',{kind:'account',id:a.id},'owner',409);
let rows=await api('GET','/api/data?mode=transactions',null,'owner');assert.equal(rows.transactions.length,1);checks++;
await api('PATCH','/api/data',{id:rows.transactions[0].id,data:{...transaction,amount:'50000'}},'owner');
await api('PATCH','/api/data',{id:rows.transactions[0].id,data:transaction},'intruder',404);
let b=await api('GET','/api/data',null,'owner');assert.equal(b.accounts.length,2);assert.equal(b.totals[0].amount,5000000);checks+=2;
const other=await api('GET','/api/data',null,'intruder');assert.equal(other.accounts.length,0);assert.equal(other.totals.length,0);checks+=2;
await api('POST','/api/data',{kind:'transfer',data:{from:a.id,to:c.id,date:'2026-01-03',amount:'10000',received:'10000',reference:'test'}},'owner',201);
await api('POST','/api/data',{kind:'transfer',data:{from:a.id,to:c.id,date:'2026-01-03',amount:'10000',received:'10001'}},'owner',400);
rows=await api('GET','/api/data?mode=transactions',null,'owner');assert.equal(rows.transactions.filter(t=>t.transfer).length,2);checks++;
const importRow={...transaction,date:'2026-01-04',amount:'1000',reference:'import-test'};
const imported=await api('POST','/api/data',{kind:'import',rows:[importRow,importRow]},'owner',201);assert.equal(imported.created,1);assert.equal(imported.skipped,1);checks+=2;
const repeated=await api('POST','/api/data',{kind:'import',rows:[importRow]},'owner',201);assert.equal(repeated.created,0);checks++;
rows=await api('GET','/api/data?mode=transactions',null,'owner');const immutable=rows.transactions.find(t=>t.imported);await api('DELETE','/api/data',{kind:'transaction',id:immutable.id},'owner',400);
const manual=rows.transactions.find(t=>!t.transfer&&!t.imported);await api('DELETE','/api/data',{kind:'transaction',id:manual.id},'owner');
const aud=await api('GET','/api/data?mode=audit',null,'owner');assert.ok(aud.audit.some(t=>t.action==='transaction.correct'));assert.ok(aud.audit.some(t=>t.action==='transaction.delete'));checks+=2;
await api('POST','/api/data',{kind:'goal',data:{name:'Goal',country:'Italy',amount:'2000000',currency:'BDT',date:'2027-07-01',account:a.id}},'owner',201);
await api('POST','/api/data',{kind:'goal',data:{name:'Goal',country:'Italy',amount:'2',currency:'EUR',date:'2027-07-01',account:a.id}},'owner',400);

await api('GET','/api/data?mode=transactions&page=NaN',null,'owner',400);
await api('GET','/api/data?mode=transactions&page=-2',null,'owner',400);
await api('POST','/api/data',{kind:'transaction',data:{...transaction,amount:'0.001'}},'owner',400);
await api('POST','/api/data',{kind:'transfer',data:{from:a.id,to:a.id,date:'2026-01-03',amount:'1',received:'1'}},'owner',400);
const accountData={name:'Bad account',bank:'Test',currency:'BDT',opening:'-1',date:'2026-01-01',holder:'Test',ownership:'Self',type:'Savings',masked:'1234'};
await api('POST','/api/data',{kind:'account',data:accountData},'owner',400);
await api('POST','/api/data',{kind:'account',data:{...accountData,opening:'1',date:'2099-01-01'}},'owner',400);
await api('POST','/api/data',{kind:'account',data:{...accountData,opening:'1',date:'2026-02-30'}},'owner',400);
await api('POST','/api/data',{kind:'account',data:{...accountData,opening:'1',currency:'FAKE'}},'owner',400);
await api('POST','/api/data',{kind:'account',data:{...accountData,opening:'1.001'}},'owner',400);
for(const [kind,data] of [
 ['sponsor',{name:'Synthetic parent',relationship:'Parent',income:'75000',currency:'BDT',source:'Employment'}],
 ['expense',{name:'Tuition',amount:'1200',currency:'EUR',frequency:'Monthly',months:12,country:'Italy'}],
 ['target',{name:'Italy',intake:'2027',programme:'Synthetic MSc',stage:'Planning'}],
 ['profile',{name:'Test owner',home:'Bangladesh',currency:'BDT',level:'Master’s',language:'bn'}],
 ['scholarship',{name:'Synthetic award',amount:'1000',currency:'EUR',status:'Pending',date:'2026-01-01',notes:''}],
 ['checklist',{name:'Bank evidence',status:'Missing',date:'',notes:''}],
 ['rate',{name:'BDT',to:'EUR',rate:'0.007',date:'2026-01-01',source:'Manual synthetic rate'}]
]){
 const saved=await api('POST','/api/data',{kind,data},'owner',201);
 const state=await api('GET','/api/data',null,'owner');assert.deepEqual(JSON.parse(state.records.find(r=>r.id===saved.id).data).name,data.name);checks++;
 await api('POST','/api/data',{kind,id:saved.id,data:{...data,name:kind==='rate'?'USD':kind==='target'?'Germany':'Updated'}},'owner');
 await api('POST','/api/data',{kind,id:saved.id,data},'intruder',404);
 await api('DELETE','/api/data',{kind:'record',id:saved.id},'intruder',404);
 await api('DELETE','/api/data',{kind:'record',id:saved.id},'owner');
 const stateAfter=await api('GET','/api/data',null,'owner');assert.ok(!stateAfter.records.some(r=>r.id===saved.id));checks++;
}
await api('POST','/api/data',{kind:'expense',data:{name:'Invalid',amount:'-1',currency:'EUR',frequency:'Monthly',months:12,country:'Italy'}},'owner',400);
await api('POST','/api/data',{kind:'rate',data:{name:'BDT',to:'EUR',rate:'0',date:'2026-01-01',source:'Manual'}},'owner',400);
await api('GET','/api/report',null,'',401);
const intruderReport=await api('GET','/api/report?format=json',null,'intruder');assert.equal(intruderReport.accounts.length,0);assert.equal(intruderReport.transactions.length,0);checks+=2;
const badFile=new FormData();badFile.set('file',new File(['fake pdf'],'fake.pdf',{type:'application/pdf'}));await api('POST','/api/documents',badFile,'owner',400);
const textFile=new FormData();textFile.set('file',new File(['text'],'test.txt',{type:'text/plain'}));await api('POST','/api/documents',textFile,'owner',400);
const file=new FormData();file.set('file',new File([new TextEncoder().encode('%PDF-1.4\nOriginal test document\n')],'test.pdf',{type:'application/pdf'}));const upload=await api('POST','/api/documents',file,'owner',201);
const download=await api('GET','/api/documents?id='+upload.id,null,'owner');assert.equal(download,'%PDF-1.4\nOriginal test document\n');checks++;
await api('GET','/api/documents?id='+upload.id,null,'intruder',404);
const csv=await api('GET','/api/report',null,'owner');assert.ok(csv.includes('UNOFFICIAL PERSONAL'));checks++;
const rule={country:'Test country',category:'Student visa',nationality:'Bangladesh',jurisdiction:'Dhaka',currency:'BDT',amount:'10000',months:12,holding:28,history:90,source:'https://example.gov/test',effective:'2026-01-01',verified:'2026-01-01',summary:'Synthetic test rule, not deployed',status:'Draft'};
await api('POST','/api/data',{kind:'rule',data:rule},'intruder',403);
await api('POST','/api/data',{kind:'rule',data:rule},'superadmin',503);
await api('POST','/api/data',{kind:'reconciliation',data:{name:a.id,date:'2026-01-04',currency:'BDT',balance:'1191000',document:upload.id}},'owner',201);
await api('POST','/api/data',{kind:'reconciliation',data:{name:a.id,date:'2026-01-04',currency:'BDT',balance:'1',document:upload.id}},'owner',400);

await api('GET','/api/documents?id='+upload.id,null,'superadmin',404);
const adminData=await api('GET','/api/data',null,'superadmin');assert.equal(adminData.accounts.length,0);assert.equal(adminData.documents.length,0);checks+=2;
await api('PATCH','/api/data',{id:manual.id,data:transaction},'superadmin',404);
await db.prepare("UPDATE platform_users SET status='suspended' WHERE id='owner'").run();
for(const path of ['/api/data','/api/data?mode=transactions','/api/report','/api/documents?id='+upload.id])await api('GET',path,null,'owner',403);
await api('POST','/api/membership',{name:'owner',agree:true},'owner',403);
const suspendedPage=await api('GET','/accounts',null,'owner');assert.ok(suspendedPage.includes('Account access restricted'));checks++;
await db.prepare("UPDATE platform_users SET status='banned' WHERE id='owner'").run();await api('GET','/api/data',null,'owner',403);
await db.prepare("UPDATE platform_users SET status='active' WHERE id='owner'").run();
const retained=await api('GET','/api/data',null,'owner');assert.equal(retained.accounts.length,2);checks++;
const legacyDetails=JSON.stringify({holder:'Legacy',ownership:'Self',type:'Savings',accessible:true,masked:''});
await db.prepare('INSERT INTO accounts(id,owner,name,bank,currency,opening,date,details,created) VALUES(?,?,?,?,?,?,?,?,?)').bind('legacy-account','legacy','Legacy savings','Test','BDT',100,'2026-01-01',legacyDetails,'2026-01-01').run();
const legacyBefore=await api('GET','/api/data',null,'pre-v2');assert.equal(legacyBefore.accounts[0].opening,321000);checks++;
const legacy=await api('GET','/api/data',null,'legacy');assert.equal(legacy.accounts[0].opening,100);checks++;
const raw=await mf.dispatchFetch('http://site.test/api/membership',{method:'POST',headers:{'oai-authenticated-user-id':'oversize','oai-authenticated-user-email':'oversize@example.test','content-type':'application/json',origin:'http://site.test'},body:JSON.stringify({name:'x'.repeat(6000),agree:true})});assert.equal(raw.status,413);checks++;
await api('DELETE','/api/data',{kind:'all',confirm:'DELETE'},'owner');b=await api('GET','/api/data',null,'owner');assert.equal(b.accounts.length,0);assert.equal(b.documents.length,0);checks+=2;
console.log(`API integration: ${checks} checks passed, including ownership isolation, real D1/R2, routes, transfers, imports, corrections, reports, and deletion.`);
}finally{await mf.dispose()}
