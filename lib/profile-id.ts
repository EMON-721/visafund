// Stable personal ID only. Never use a numeric ID to authorize access.
const missingTable=(error:unknown)=>/no such table:\s*(?:main\.)?platform_profile_ids\b/i.test(String(error));
export async function profileIdForOwner(database:D1Database,owner:string):Promise<string|null>{
 try{
  // Atomic SQLite INSERT + UNIQUE(owner) are safe for simultaneous login callbacks.
  await database.prepare('INSERT OR IGNORE INTO platform_profile_ids(owner,created) SELECT id,created FROM platform_users WHERE id=?').bind(owner).run();
  const row=await database.prepare('SELECT id FROM platform_profile_ids WHERE owner=?').bind(owner).first<{id:number}>();
  return row?String(row.id):null;
 }catch(error){
  // Existing Google and email authentication still work before the migration.
  if(missingTable(error))return null;
  throw error;
 }
}
export async function emailForProfileId(database:D1Database,id:string):Promise<string|null>{
 if(!/^[0-9]{4,12}$/.test(id)||Number(id)<7050||!Number.isSafeInteger(Number(id)))return null;
 try{
  const row=await database.prepare("SELECT p.email FROM platform_profile_ids i JOIN platform_users p ON p.id=i.owner WHERE i.id=? AND p.status='active' LIMIT 1").bind(Number(id)).first<{email:string}>();
  return row?.email||null;
 }catch(error){if(missingTable(error))return null;throw error}
}
