import {db,dhakaToday} from '@/lib/server';
import {activeDestinations} from '@/lib/platform-catalog';
import {selectCurrentRules} from '@/lib/rule-selection';
export type PublicRule={id:string;country:string;data:string;version:number;created:string};
export async function publicRules():Promise<PublicRule[]>{const rows=await db().prepare('SELECT id,country,data,version,created FROM rules ORDER BY created DESC,version DESC').all<PublicRule>();const active=await activeDestinations();return selectCurrentRules(rows.results,dhakaToday()).filter(r=>active.some(c=>c.name===r.country))}
