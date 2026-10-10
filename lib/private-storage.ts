// Server only: never import this module from a client component.
export type PrivateStorage = {
 put(key:string, bytes:ArrayBuffer, options?:{httpMetadata?:{contentType?:string}}):Promise<unknown>;
 get(key:string):Promise<{body:ReadableStream<Uint8Array>|null}|null>;
 delete(keys:string|string[]):Promise<void>;
 list(options:{prefix:string;cursor?:string}):Promise<{objects:{key:string}[];truncated:boolean;cursor?:string}>;
};
export class StorageUnavailable extends Error { status=503; constructor(){super('Private document storage is not configured or temporarily unavailable')} }
export type StorageSettings={SUPABASE_URL?:string;SUPABASE_STORAGE_SECRET_KEY?:string;SUPABASE_STORAGE_BUCKET?:string};
function path(key:string){const parts=key.split('/');if(parts.length!==2||parts.some(p=>!p||p==='.'||p==='..'||!/^[a-zA-Z0-9_-]+$/.test(p)))throw new Error('Invalid private object path');return parts.map(encodeURIComponent).join('/')}
export function createPrivateStorage(e:StorageSettings, transport:typeof fetch=fetch):PrivateStorage {
 if(!e.SUPABASE_URL||!e.SUPABASE_STORAGE_SECRET_KEY?.startsWith('sb_secret_')||e.SUPABASE_STORAGE_BUCKET!=='visafund-documents')throw new StorageUnavailable();
 const origin=new URL(e.SUPABASE_URL);if(origin.protocol!=='https:'||origin.pathname!=='/'||origin.username||origin.password)throw new StorageUnavailable();
 const base=origin.origin+'/storage/v1',bucket=encodeURIComponent(e.SUPABASE_STORAGE_BUCKET);
 async function request(route:string,init:RequestInit={}){let response:Response;try{response=await transport(base+route,{...init,redirect:'error',signal:AbortSignal.timeout(30000),headers:{apikey:e.SUPABASE_STORAGE_SECRET_KEY!,...init.headers}})}catch{throw new StorageUnavailable()}return response}
 const checked=(r:Response)=>{if(!r.ok)throw new StorageUnavailable();return r};
 return {
  async put(key,bytes,options){const mime=options?.httpMetadata?.contentType;if(!['application/pdf','image/png','image/jpeg','text/csv'].includes(mime||'')||!bytes.byteLength||bytes.byteLength>10*1024*1024)throw new Error('Invalid document upload');checked(await request('/object/'+bucket+'/'+path(key),{method:'POST',headers:{'Content-Type':mime!,'x-upsert':'false'},body:bytes}));},
  async get(key){const r=await request('/object/authenticated/'+bucket+'/'+path(key));if(r.status===404)return null;if(!r.ok){if(r.status===400){const body=await r.json().catch(()=>null) as {statusCode?:string}|null;if(body?.statusCode==='404')return null}throw new StorageUnavailable()}return {body:r.body}},
  async delete(keys){const values=typeof keys==='string'?[keys]:keys;if(!values.length)return;values.forEach(path);checked(await request('/object/'+bucket,{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({prefixes:values})}));},
  async list({prefix,cursor}){if(!/^[a-zA-Z0-9_-]+\/$/.test(prefix))throw new Error('Invalid owner prefix');const offset=cursor?Number(cursor):0;if(!Number.isSafeInteger(offset)||offset<0)throw new Error('Invalid storage cursor');const r=checked(await request('/object/list/'+bucket,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prefix,limit:100,offset,sortBy:{column:'name',order:'asc'}})}));const rows=await r.json() as {name:string;id:string|null}[];if(!Array.isArray(rows))throw new StorageUnavailable();const objects=rows.filter(o=>o.id!==null).map(o=>({key:prefix+o.name}));objects.forEach(o=>path(o.key));return {objects,truncated:rows.length===100,cursor:rows.length===100?String(offset+100):undefined};}
 };
}
