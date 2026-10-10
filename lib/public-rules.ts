import {db,dhakaToday} from '@/lib/server';
import {isActiveDestination} from '@/lib/countries';
export type PublicRule={id:string;country:string;data:string;version:number;created:string};
export async function publicRules():Promise<PublicRule[]>{const rows=await db().prepare('SELECT id,country,data,version,created FROM rules ORDER BY created DESC').all<PublicRule>();return rows.results.filter(r=>{try{const x=JSON.parse(r.data);return isActiveDestination(r.country)&&x.status==='Verified'&&x.effective<=dhakaToday()&&x.verified<=dhakaToday()&&typeof x.source==='string'&&x.source.startsWith('https://')&&URL.canParse(x.source)}catch{return false}})}
