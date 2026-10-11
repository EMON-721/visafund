import {destinations} from '@/lib/countries';
import {db} from '@/lib/server';
export async function activeDestinations(){
 const saved=(await db().prepare("SELECT title,body FROM platform_content WHERE kind='country' AND status='published' ORDER BY updated DESC,id DESC").all<{title:string;body:string}>()).results;
 const inactive=new Set<string>();const seen=new Set<string>();
 for(const row of saved){try{const x=JSON.parse(row.body);if(typeof x.code==='string'&&!seen.has(x.code)&&destinations.some(c=>c.code===x.code&&c.name===row.title)){seen.add(x.code);if(x.active===false)inactive.add(x.code)}}catch{}}
 return destinations.filter(c=>!inactive.has(c.code));
}
export async function destinationActive(name:string){return (await activeDestinations()).some(c=>c.name===name)}
export async function publishedPages(){return (await db().prepare("SELECT id,title,body,updated FROM platform_content WHERE kind='page' AND status='published' ORDER BY updated DESC,id DESC").all<{id:string;title:string;body:string;updated:string}>()).results}
