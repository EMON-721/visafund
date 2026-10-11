import assert from 'node:assert/strict';
import {resolveModules,workspaceModules,operationModule} from '../lib/module-policy.ts';
import {inspectSystemHealth} from '../lib/system-health.ts';
const defaults=resolveModules([]);
assert.equal(defaults.length,15);
assert.ok(defaults.every(m=>m.enabled));
for(const [route,label] of workspaceModules){
 const records=[{title:'module:'+route,body:JSON.stringify({enabled:false,label,description:'Temporarily disabled'})}];
 const disabled=resolveModules(records);
 assert.equal(disabled.find(m=>m.route===route).enabled,false);
 assert.equal(disabled.filter(m=>m.enabled).length,14);
 const enabled=resolveModules([{title:'module:'+route,body:JSON.stringify({enabled:true,label:'Updated '+label,description:'Restored'})},...records]);
 assert.equal(enabled.find(m=>m.route===route).enabled,true);
 assert.equal(enabled.find(m=>m.route===route).description,'Restored');
}
assert.deepEqual(resolveModules([{title:'module:unknown',body:'{}'},{title:'module:accounts',body:'invalid'},{title:'module:transactions',body:JSON.stringify({enabled:'false',label:'Broken',description:''})}]),defaults);
assert.equal(operationModule('account'),'accounts');
assert.equal(operationModule('import'),'transactions');
assert.equal(operationModule('sponsor'),'sponsors');
assert.equal(operationModule('goal'),'goals');
assert.equal(operationModule('target'),'targets');
assert.equal(operationModule('role'),undefined);
const names=['accounts','transactions','records','documents','rules','audit','limits','platform_users','platform_roles','platform_audit','platform_content','platform_deletion_jobs','exchange_cache','auth_flows','auth_identities','auth_revoked_sessions'];
function database(tables,fail=false,missingColumn=false){return {prepare(sql){assert.ok(sql.startsWith('PRAGMA table_info(')||sql==='SELECT 1 AS available'||sql==="SELECT name FROM sqlite_master WHERE type='table'");return {async first(){if(fail)throw Error('Database unavailable');return {available:1}},async all(){if(sql.startsWith('PRAGMA'))return {results:(sql.includes('platform_content')?['id','kind','title','body','status','updated']:['id','country','data','version','created']).filter(n=>!missingColumn||n!=='kind').map(name=>({name}))};return {results:tables.map(name=>({name}))}}}}}}
const healthy=await inspectSystemHealth(database(names));
assert.equal(healthy.schema,'ready');assert.equal(healthy.financialDataInspected,false);assert.equal(healthy.missingTables.length,0);
const missing=await inspectSystemHealth(database(names.filter(n=>n!=='platform_content')));
assert.equal(missing.schema,'incomplete');assert.deepEqual(missing.missingTables,['platform_content']);
const missingColumn=await inspectSystemHealth(database(names,false,true));assert.equal(missingColumn.schema,'incomplete');assert.deepEqual(missingColumn.missingColumns,['platform_content.kind']);
await assert.rejects(inspectSystemHealth(database([],true)),/Database unavailable/);
console.log('15 disable/re-enable cases, invalid configuration, 6 operation mappings and 4 health cases passed.');
