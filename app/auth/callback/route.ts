import {authOrigin,authConfigured,supabaseClient,clearLogoutMarker} from '@/lib/supabase-auth';
import {enrollVerifiedProvider} from '@/lib/auth-actions';
import {isProvisionedAdmin} from '@/lib/platform';
import {fail,HttpError} from '@/lib/server';
export const dynamic='force-dynamic';
export async function GET(request:Request){try{if(!authConfigured())throw new HttpError(503,'Authentication provider is not configured');const p=new URL(request.url).searchParams,code=p.get('code');if(!code||code.length>2048)throw new HttpError(400,'Invalid callback');const client=await supabaseClient(true);const {error}=await client.auth.exchangeCodeForSession(code);if(error)throw new HttpError(400,'Authentication link expired. Request a new link.');await clearLogoutMarker();const owner=await enrollVerifiedProvider();return Response.redirect(authOrigin()+(owner?(await isProvisionedAdmin(owner)?'/login?step=mfa':'/dashboard'):'/register?complete=1'),303)}catch(e){return fail(e)}}
