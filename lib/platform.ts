import type {ChatGPTUser} from '@/app/chatgpt-auth';
import {getAppUser as getChatGPTUser,authConfigured,verifiedAdminMFA} from '@/lib/supabase-auth';
import { db,HttpError,now,uid } from '@/lib/server';
import {banInactiveMember} from '@/lib/inactivity';
export type Member={id:string;name:string;email:string;status:'active'|'suspended'|'banned'|'deletion_pending'|'deleted';created:string;last_seen:string;terms_version:string|null;preferences:string};
export async function isProvisionedAdmin(id:string){const r=await db().prepare("SELECT r.role FROM platform_roles r JOIN platform_users p ON p.id=r.owner WHERE r.owner=? AND p.status='active'").bind(id).first<{role:string}>();return r?.role==='SUPER_ADMIN'}
export function restrictionMessage(status:string){return status==='suspended'?'This account is suspended. Contact support.':status==='banned'?'This account has been banned. Contact support.':'This account is restricted. Contact support.'}
export async function memberFor(user:ChatGPTUser):Promise<Member|null>{return db().prepare('SELECT * FROM platform_users WHERE id=?').bind(user.userId).first<Member>()}
export async function activeMember(user:ChatGPTUser){let member=await memberFor(user);if(!member){const legacy=await db().prepare('SELECT id FROM accounts WHERE owner=? UNION ALL SELECT id FROM records WHERE owner=? UNION ALL SELECT id FROM documents WHERE owner=? LIMIT 1').bind(user.userId,user.userId,user.userId).first();if(legacy){await db().prepare("INSERT OR IGNORE INTO platform_users(id,name,email,status,created,last_seen,terms_version,preferences) VALUES (?,?,?,'active',?,?,NULL,'{}')").bind(user.userId,user.displayName,user.email,now(),now()).run();member=await memberFor(user)}}if(!member)throw new HttpError(403,'Complete registration to open your private workspace');if(member.status!=='active')throw new HttpError(403,restrictionMessage(member.status));
 if(await banInactiveMember(db(),user.userId))throw new HttpError(403,'This account has been banned after 30 days without use. Contact support to appeal.');
 const t=now();
 const result=await db().prepare("UPDATE platform_users SET last_seen=? WHERE id=? AND status='active' RETURNING id").bind(t,user.userId).first<{id:string}>();
 if(!result)throw new HttpError(403,'Account access is restricted. Contact platform support.');
 return {...member,last_seen:t}}
export async function superAdmin(){const user=await getChatGPTUser();if(!user)throw new HttpError(401,'Sign in first');if(!await isProvisionedAdmin(user.userId))throw new HttpError(403,'Super Admin access required');await activeMember(user);return user}
export async function requireAdminMFA():Promise<void>{if(!authConfigured())throw new HttpError(503,'Admin access is locked: configure a verified MFA provider');if(!await verifiedAdminMFA())throw new HttpError(403,'Complete fresh MFA verification before accessing administration')}
export function adminEvent(actor:string,target:string|null,action:string,reason:string){return db().prepare('INSERT INTO platform_audit(id,actor,target,action,reason,created) VALUES(?,?,?,?,?,?)').bind(uid(),actor,target,action,reason.slice(0,500),now())}
