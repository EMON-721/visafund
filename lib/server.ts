import {createPrivateStorage,StorageUnavailable,type PrivateStorage,type StorageSettings} from '@/lib/private-storage';
import {PlatformOperationError} from '@/lib/admin-service';
import type {TableRows} from '@/lib/models';
import { env } from 'cloudflare:workers';
import { getAppUser as getChatGPTUser } from '@/lib/supabase-auth';
export const db=()=> (env as {DB:D1Database}).DB as D1Database;
export const bucket=():PrivateStorage=> (env as {EXTERNAL_HOSTING?:string}).EXTERNAL_HOSTING==='true'?createPrivateStorage(env as StorageSettings):(env as {BUCKET:R2Bucket}).BUCKET;
export async function identity(){const u=await getChatGPTUser();if(!u)throw new HttpError(401,'Sign in to access your financial workspace');const {activeMember}=await import('@/lib/platform');await activeMember(u);return u}
export class HttpError extends Error{constructor(public status:number,message:string){super(message)}}
export function guard(r:Request){if(r.headers.get('sec-fetch-site')==='cross-site')throw new HttpError(403,'Cross-site requests are not allowed');const origin=r.headers.get('origin');if(origin&&origin!==new URL(r.url).origin)throw new HttpError(403,'Cross-origin requests are not allowed')}
export function fail(e:unknown){if(e instanceof HttpError||e instanceof PlatformOperationError||e instanceof StorageUnavailable)return Response.json({error:e.message},{status:e.status});if(e instanceof RangeError)return Response.json({error:e.message},{status:400});if(e instanceof Error&&e.name==='ZodError')return Response.json({error:'Please check the form values'},{status:400});console.error(e instanceof Error?{name:e.name,message:e.message}:"Unexpected request failure");return Response.json({error:'Unable to save or load your data. Try again.'},{status:500})}
export const now=()=>new Date().toISOString();
export const uid=()=>crypto.randomUUID();
export function log(owner:string,entity:string,action:string,before:unknown,after:unknown){return db().prepare('INSERT INTO audit (id,owner,entity,action,before,after,created) VALUES (?,?,?,?,?,?,?)').bind(uid(),owner,entity,action,before?JSON.stringify(before):null,after?JSON.stringify(after):null,now())}
export async function own<T extends keyof TableRows>(table:T,id:string,owner:string){const r=await db().prepare(`SELECT * FROM ${table} WHERE id=? AND owner=?`).bind(id,owner).first<TableRows[T]>();if(!r)throw new HttpError(404,'Record not found');return r}
export async function admin(){const {superAdmin,requireAdminMFA}=await import('@/lib/platform');const u=await superAdmin();await requireAdminMFA();return u}
export async function rateLimit(owner:string,action:string,max=120){const stamp=Math.floor(Date.now()/60000);const row=await db().prepare('INSERT INTO limits (id,stamp,count) VALUES (?,?,1) ON CONFLICT(id) DO UPDATE SET count=CASE WHEN stamp<>? THEN 1 ELSE count+1 END,stamp=? WHERE stamp<>? OR count<? RETURNING count').bind(owner+':'+action,stamp,stamp,stamp,stamp,max).first();if(!row)throw new HttpError(429,'Too many requests. Try again in a minute.')}

export const dhakaToday=()=>new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Dhaka'});

export async function readJson(request:Request,maxBytes=200000):Promise<unknown>{
 if(!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))throw new HttpError(415,'Use application/json');
 const reader=request.body?.getReader();if(!reader)throw new HttpError(400,'Missing request body');
 let size=0;const chunks:Uint8Array[]=[];while(true){const next=await reader.read();if(next.done)break;size+=next.value.byteLength;if(size>maxBytes){await reader.cancel();throw new HttpError(413,'Request too large')}chunks.push(next.value)}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length}
 try{return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes))}catch{throw new HttpError(400,'Invalid JSON request')}
}

