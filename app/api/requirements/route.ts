import {publicRules} from '@/lib/public-rules';
import {fail} from '@/lib/server';
export const dynamic='force-dynamic';
export async function GET(){try{return Response.json({rules:await publicRules()},{headers:{'Cache-Control':'private, no-store'}})}catch(e){return fail(e)}}
