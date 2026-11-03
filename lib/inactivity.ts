/**
 * VisaFund inactivity policy.
 * A 30-day rollout grace period prevents retroactively banning existing users.
 * last_seen is updated only by authenticated app requests.
 * This is an access ban, never deletion of financial data.
 */
export const INACTIVITY_DAYS=30;
export const INACTIVITY_POLICY_START='2026-11-03T00:00:00.000Z';
const DAY=24*60*60*1000;
export const INACTIVITY_BAN_REASON='Automatic ban: no authenticated VisaFund use for 30 consecutive days';
export function inactivityCutoff(clock=Date.now()):string|null{
 if(!Number.isFinite(clock)||clock<Date.parse(INACTIVITY_POLICY_START)+INACTIVITY_DAYS*DAY)return null;
 return new Date(clock-INACTIVITY_DAYS*DAY).toISOString();
}
const banSql=`UPDATE platform_users SET status='banned' WHERE status='active' AND last_seen<=? AND id NOT IN (SELECT owner FROM platform_roles WHERE role='SUPER_ADMIN')`;
/**
 * Only the latest status-changing audit action counts. A historical auto-ban
 * must not cause a manually banned account to be mislabelled as inactive.
 */
export async function wasAutomaticallyBanned(database:D1Database,owner:string):Promise<boolean>{
 const action=await database.prepare(
  "SELECT action FROM platform_audit WHERE target=? AND action IN ('account.auto-ban-inactive','account.ban','account.unban','account.reactivate') ORDER BY rowid DESC LIMIT 1"
 ).bind(owner).first<{action:string}>();
 return action?.action==='account.auto-ban-inactive';
}

export async function banInactiveMember(database:D1Database,owner:string,clock=Date.now()):Promise<boolean>{
 const cutoff=inactivityCutoff(clock);
 if(!cutoff)return false;
 const row=await database.prepare(banSql+" AND id=? RETURNING id").bind(cutoff,owner).first<{id:string}>();
 if(!row)return false;
 await database.prepare('INSERT INTO platform_audit(id,actor,target,action,reason,created) VALUES(?,?,?,?,?,?)')
  .bind(crypto.randomUUID(),'system',owner,'account.auto-ban-inactive',INACTIVITY_BAN_REASON,new Date(clock).toISOString()).run();
 return true;
}
export async function banInactiveUsers(database:D1Database,clock=Date.now()):Promise<number>{
 const cutoff=inactivityCutoff(clock);
 if(!cutoff)return 0;
 // A daily Worker cron scans active USER accounts. SUPER_ADMIN roles are excluded.
 const result=await database.prepare(banSql+' RETURNING id').bind(cutoff).all<{id:string}>();
 const ids=result.results.map(r=>r.id);
 // Audit only non-sensitive owner IDs; no private financial records are read or removed.
 for(let start=0;start<ids.length;start+=50){
  await database.batch(ids.slice(start,start+50).map(owner=>
   database.prepare('INSERT INTO platform_audit(id,actor,target,action,reason,created) VALUES(?,?,?,?,?,?)')
    .bind(crypto.randomUUID(),'system',owner,'account.auto-ban-inactive',INACTIVITY_BAN_REASON,new Date(clock).toISOString())
  ));
 }
 return ids.length;
}
