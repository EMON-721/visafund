import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {readPlatform,moderateAccount,savePlatformContent,removePlatformContent,requestAccountDeletion,executeAccountDeletion} from './lib/admin-service.ts';
const dir=(await readdir('node_modules/.pnpm')).find(s=>s.startsWith('miniflare@'))!;
const {Miniflare}=await import(pathToFileURL(resolve('node_modules/.pnpm',dir,'node_modules/miniflare/dist/src/index.js')).href);
const mf=new Miniflare({script:'export default {fetch(){return new Response("test")}}',modules:true,d1Databases:['DB'],r2Buckets:['BUCKET'],compatibilityDate:'2026-05-15'});
let checks=0;const ok=(value:unknown)=>{assert.ok(value);checks++};
try{const db=await mf.getD1Database('DB'),bucket=await mf.getR2Bucket('BUCKET');for(const f of (await readdir('drizzle')).filter(f=>f.endsWith('.sql')).sort())await db.exec((await readFile('drizzle/'+f,'utf8')).replaceAll('--> statement-breakpoint','').replaceAll('\n',' '));
for(const id of ['admin','a','b'])await db.prepare("INSERT INTO platform_users(id,name,email,status,created,last_seen,preferences) VALUES(?,?,?,'active',?,?,'{}')").bind(id,id,id+'@example.test','2026-10-01','2026-10-01').run();
await db.prepare('INSERT INTO accounts(id,owner,name,bank,currency,opening,date,details,created) VALUES(?,?,?,?,?,?,?,?,?)').bind('a-bank','a','PRIVATE_ACCOUNT_MARKER','bank','BDT',987654321,'2026-01-01','{}','2026-01-01').run();await db.prepare('INSERT INTO documents(id,owner,name,mime,size,hash,details,created) VALUES(?,?,?,?,?,?,?,?)').bind('a-doc','a','PRIVATE_DOCUMENT_MARKER','text/csv',5,'synthetic','{}','2026-01-01').run();await bucket.put('a/a-doc','original private bytes');await bucket.put('b/b-doc','user B original');
for(const mode of ['users','overview','analytics','audit','security','health']){const view=await readPlatform(db,mode);ok(!JSON.stringify(view).includes('PRIVATE_'));ok(!JSON.stringify(view).includes('987654321'))}
const filtered=await readPlatform(db,'users','a@example.test');ok('users' in filtered&&filtered.users?.length===1);
for(const [action,status] of [['suspend','suspended'],['reactivate','active'],['ban','banned'],['unban','active']]){const result=await moderateAccount(db,'admin',{action,target:'a',reason:'Synthetic safety test'},['admin']);ok(result.status===status);ok(result.providerSessionsRevoked===false)}
await assert.rejects(()=>moderateAccount(db,'admin',{action:'suspend',target:'admin',reason:'Synthetic test'},['admin']));checks++;
await assert.rejects(()=>moderateAccount(db,'admin',{action:'suspend',target:'missing',reason:'Synthetic test'},['admin']));checks++;
await assert.rejects(()=>moderateAccount(db,'admin',{action:'reactivate',target:'a',reason:'Synthetic test'},['admin']));checks++;
for(const kind of ['country','official_source','page','notification','setting']){const saved=await savePlatformContent(db,'admin',{kind,title:'Synthetic '+kind,body:kind==='official_source'?'https://example.gov/source':'Synthetic text',status:'draft'});ok(saved.saved);const updated=await savePlatformContent(db,'admin',{id:saved.id,kind,title:'Updated '+kind,body:'https://example.gov/updated',status:'published'});ok(updated.id===saved.id);await removePlatformContent(db,'admin',saved.id);ok(!(await db.prepare('SELECT id FROM platform_content WHERE id=?').bind(saved.id).first()))}
await assert.rejects(()=>savePlatformContent(db,'admin',{kind:'official_source',title:'Bad URL',body:'javascript:alert(1)',status:'published'}));checks++;
await assert.rejects(()=>savePlatformContent(db,'admin',{kind:'financial_rule',title:'Unsafe rule',body:'Invented rule',status:'published'}));checks++;
await assert.rejects(()=>requestAccountDeletion(db,'admin',{target:'a',confirmation:'DELETE a',reason:'Synthetic deletion'},['admin'],null));checks++;
await assert.rejects(()=>requestAccountDeletion(db,'admin',{target:'a',confirmation:'DELETE b',reason:'Synthetic deletion'},['admin'],{version:'synthetic',days:0}));checks++;
const job=await requestAccountDeletion(db,'admin',{target:'a',confirmation:'DELETE a',reason:'Synthetic deletion'},['admin'],{version:'synthetic',days:0});ok(job.status==='pending');ok((await db.prepare('SELECT status FROM platform_users WHERE id=?').bind('a').first())?.status==='deletion_pending');ok(!!await bucket.get('a/a-doc'));
await assert.rejects(()=>executeAccountDeletion(db,bucket,'admin',job.job,{version:'wrong',days:0}));checks++;
const result=await executeAccountDeletion(db,bucket,'admin',job.job,{version:'synthetic',days:0});ok(result.status==='completed');ok(!JSON.stringify(result).includes('PRIVATE_'));ok(!(await bucket.get('a/a-doc')));ok(!!await bucket.get('b/b-doc'));ok(!(await db.prepare('SELECT id FROM accounts WHERE owner=?').bind('a').first()));ok((await db.prepare('SELECT status FROM platform_users WHERE id=?').bind('a').first())?.status==='deleted');ok((await executeAccountDeletion(db,bucket,'admin',job.job,{version:'synthetic',days:0})).status==='completed');
const audit=await readPlatform(db,'audit');ok('events' in audit&&!!audit.events?.length);ok(!JSON.stringify(audit).includes('PRIVATE_'));
console.log(`Admin service: ${checks} checks passed. Service operations only; real MFA/admin authentication remains unconfigured.`);
}finally{await mf.dispose()}
