import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {profileIdForOwner,emailForProfileId} from './lib/profile-id.ts';
const require=createRequire(import.meta.url);
const runtime=createRequire(require.resolve('wrangler/package.json'));
const {Miniflare}=await import(pathToFileURL(runtime.resolve('miniflare')).href);
const mf=new Miniflare({script:'export default {fetch(){return new Response("test")}}',modules:true,d1Databases:['DB'],compatibilityDate:'2026-05-15'});
try{
 const db=await mf.getD1Database('DB');
 for(const f of (await readdir('drizzle')).filter(f=>f.endsWith('.sql')).sort())await db.exec((await readFile('drizzle/'+f,'utf8')).replaceAll('--> statement-breakpoint','').replaceAll('\n',' '));
 const add=async(id:string,email:string)=>db.prepare("INSERT INTO platform_users(id,name,email,status,created,last_seen,preferences) VALUES(?,?,?,'active',?,?,?)").bind(id,id,email,new Date().toISOString(),new Date().toISOString(),'{}').run();
 await add('u1','first@example.test');await add('u2','second@example.test');
 assert.equal(await profileIdForOwner(db,'u1'),'7050');
 assert.equal(await profileIdForOwner(db,'u1'),'7050');
 assert.equal(await profileIdForOwner(db,'u2'),'7051');
 assert.equal(await emailForProfileId(db,'7050'),'first@example.test');
 assert.equal(await emailForProfileId(db,'7051'),'second@example.test');
 assert.equal(await emailForProfileId(db,'7052'),null);
 await db.prepare("UPDATE platform_users SET status='banned' WHERE id='u2'").run();
 assert.equal(await emailForProfileId(db,'7051'),null);
 await add('u3','third@example.test');
 assert.equal(await profileIdForOwner(db,'u3'),'7052');
 console.log('Personal user IDs start at 7050 and are stable, unique and non-recycled.');
}finally{await mf.dispose()}
