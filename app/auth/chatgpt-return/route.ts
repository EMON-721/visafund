import {getChatGPTUser} from '@/app/chatgpt-auth';
import {clearLogoutMarker} from '@/lib/supabase-auth';
export async function GET(request:Request){const u=await getChatGPTUser();if(!u)return new Response('Complete ChatGPT sign-in first',{status:401});await clearLogoutMarker();const next=new URL(request.url).searchParams.get('next');return Response.redirect(new URL(['/dashboard','/register','/settings','/auth/link'].includes(next||'')?next!:'/dashboard',request.url),303)}
