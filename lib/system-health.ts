const requiredTables=['accounts','transactions','records','documents','rules','audit','limits','platform_users','platform_roles','platform_audit','platform_content','platform_deletion_jobs','exchange_cache','auth_flows','auth_identities','auth_revoked_sessions'];
export async function inspectSystemHealth(database:D1Database){
 const started=Date.now();await database.prepare('SELECT 1 AS available').first();
 const tables=await database.prepare("SELECT name FROM sqlite_master WHERE type='table'").all<{name:string}>();
 const names=new Set(tables.results.map(t=>t.name));const missing=requiredTables.filter(t=>!names.has(t));
 const missingColumns:string[]=[];
 const columns:Record<string,string[]>={platform_content:['id','kind','title','body','status','updated'],rules:['id','country','data','version','created']};
 for(const [table,required] of Object.entries(columns)){if(!names.has(table))continue;const actual=await database.prepare('PRAGMA table_info('+table+')').all<{name:string}>();const found=new Set(actual.results.map(c=>c.name));for(const column of required)if(!found.has(column))missingColumns.push(table+'.'+column)}
 return {database:'reachable',schema:missing.length||missingColumns.length?'incomplete':'ready',missingTables:missing,missingColumns,latencyMs:Date.now()-started,checkedAt:new Date().toISOString(),financialDataInspected:false};
}
