import {redirect} from 'next/navigation';
import {publicRules} from '@/lib/public-rules';
import App from '@/app/workspace';
import PublicSite from '@/app/public-site';
import AdminSite from '@/app/admin-site';
import Registration from '@/app/registration';
import {getAppUser as getChatGPTUser,authConfigured,verifiedAdminMFA,nativeIdentityEnabled} from '@/lib/supabase-auth';
import {activeMember,isProvisionedAdmin,memberFor} from '@/lib/platform';
export const dynamic='force-dynamic';
export default async function Page({params,searchParams}:{params:Promise<{slug?:string[]}>;searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const p=await params;const route=p.slug?.join('/')||'dashboard';const query=await searchParams;if(query.demo==='1'&&['dashboard','accounts','transactions','calendar','analytics','countries','targets','readiness','comparison','sponsors','documents','goals','expenses','currency','history','reports','notifications','settings'].includes(route))return <App route={route} user={null} initialDemo initialDemoRules={await publicRules()}/>;const user=await getChatGPTUser();const role=user&&await isProvisionedAdmin(user.userId)?'SUPER_ADMIN':'USER';
 if(route==='admin/login')redirect('/login'+(query.step==='mfa'?'?step=mfa':''));
 if(!authConfigured()&&user&&['login','register','admin/login'].includes(route)){try{await activeMember(user)}catch{return <Registration nativeIdentity={nativeIdentityEnabled()} role={role} mode="register" signedIn name={user.displayName} restricted={!!(await memberFor(user))} configured={false}/>;}redirect('/dashboard');}
 if(route==='login'&&authConfigured()&&user){try{await activeMember(user)}catch{return <Registration nativeIdentity={nativeIdentityEnabled()} role={role} mode="register" signedIn name={user.displayName} restricted={!!(await memberFor(user))} configured/>}if(await isProvisionedAdmin(user.userId)){if(await verifiedAdminMFA())redirect('/admin/dashboard');return <Registration nativeIdentity={nativeIdentityEnabled()} role={role} mode="login/mfa" signedIn name={user.displayName} configured/>}redirect('/dashboard')}
 if(['register','login','admin/login','forgot-password','auth/reset-password','auth/link'].includes(route))return <Registration nativeIdentity={nativeIdentityEnabled()} role={role} mode={route==='login'&&query.step==='mfa'?'login/mfa':route} signedIn={!!user} name={user?.displayName||''} configured={authConfigured()}/>;
 if(route==='admin'||route.startsWith('admin/')){let allowed=false;if(user&&await isProvisionedAdmin(user.userId)){try{await activeMember(user);allowed=true}catch{}}if(allowed&&(!authConfigured()||!await verifiedAdminMFA())){if(authConfigured())redirect('/login?step=mfa');allowed=false}return <AdminSite route={route} authorized={allowed}/>;}
 const publicPages=['home','features','how-it-works','supported-countries','requirements','public-comparison','calculator','about','help','faq','contact','privacy','terms'];
 if(publicPages.includes(route))return <PublicSite role={role} route={route} signedIn={!!user} rules={['supported-countries','requirements','public-comparison'].includes(route)?await publicRules():[]}/>;
 if(!user)redirect('/login');
 try{await activeMember(user)}catch{return <Registration nativeIdentity={nativeIdentityEnabled()} role={role} mode="register" signedIn name={user.displayName} restricted={!!(await memberFor(user))} configured={authConfigured()}/>}
 return <App route={route} user={{name:user.displayName,email:user.email,admin:await isProvisionedAdmin(user.userId)}}/>;
}
