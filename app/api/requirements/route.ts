import {activeDestinations} from '@/lib/platform-catalog';
import {publicRules} from '@/lib/public-rules';
import {fail} from '@/lib/server';
export const dynamic='force-dynamic';
export async function GET(){try{return Response.json({rules:await publicRules(),destinations:await activeDestinations()},{headers:{'Cache-Control':'private, no-store'}})}catch(e){return fail(e)}}
