import {workspaceModules} from '@/lib/module-policy';
import {moduleSettings} from '@/lib/module-service';
import {activeDestinations,publishedPages} from '@/lib/platform-catalog';
import {redirect} from 'next/navigation';
import {publicRules} from '@/lib/public-rules';
import App from '@/app/workspace';
import PublicSite from '@/app/public-site';
import AdminSite from '@/app/admin-site';
import Registration from '@/app/registration';
import {getAppUser as getChatGPTUser,authConfigured,verifiedAdminMFA,nativeIdentityEnabled} from '@/lib/supabase-auth';
import {activeMember,isProvisionedAdmin,memberFor} from '@/lib/platform';
import {profileIdForOwner} from '@/lib/profile-id';
import {db} from '@/lib/server';
import {wasAutomaticallyBanned} from '@/lib/inactivity';
export const dynamic='force-dynamic';
async function restrictedProps(user:NonNullable<Awaited<ReturnType<typeof getChatGPTUser>>>){
 const member=await memberFor(user);
 return {restricted:!!member,inactivityBanned:member?.status==='banned'&&await wasAutomaticallyBanned(db(),user.userId)};
}
export default async function Page({params,searchParams}:{params:Promise<{slug?:string[]}>;searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const p=await params;const route=p.slug?.join('/')||'dashboard';const query=await searchParams;const modules=workspaceModules.some(([r])=>r===route)||['expenses','notifications','settings'].includes(route)?await moduleSettings():[];const currentModule=modules.find(m=>m.route===route);if(currentModule&&!currentModule.enabled)return <div className="public-shell"><main className="public-main"><section className="panel settings-panel"><h1>{currentModule.label} is temporarily unavailable</h1><p>The platform administrator has disabled this section. Existing financial records are preserved.</p><a className="secondary" href="/home">Return to VisaFund</a></section></main></div>;if(query.demo==='1'&&['dashboard','accounts','transactions','calendar','analytics','countries','targets','readiness','comparison','sponsors','documents','goals','expenses','currency','history','reports','notifications','settings'].includes(route))return <App initialModules={modules} route={route} user={null} initialDemo initialDemoRules={await publicRules()}/>;const user=await getChatGPTUser();const role=user&&await isProvisionedAdmin(user.userId)?'SUPER_ADMIN':'USER';
 if(route==='login'&&query.step==='mfa'&&!user)redirect('/login');
 if(route==='admin/login')redirect('/login'+(query.step==='mfa'?'?step=mfa':''));
 if(!authConfigured()&&user&&['login','register','admin/login'].includes(route)){try{await activeMember(user)}catch{return <Registration nativeIdentity={nativeIdentityEnabled()} role={role} mode="register" signedIn name={user.displayName} {...(await restrictedProps(user))} configured={false}/>;}redirect('/dashboard');}
 if(route==='login'&&authConfigured()&&user){try{await activeMember(user)}catch{return <Registration nativeIdentity={nativeIdentityEnabled()} role={role} mode="register" signedIn name={user.displayName} {...(await restrictedProps(user))} configured/>}if(await isProvisionedAdmin(user.userId)){if(await verifiedAdminMFA())redirect('/admin/dashboard');return <Registration nativeIdentity={nativeIdentityEnabled()} role={role} mode="login/mfa" signedIn name={user.displayName} configured/>}redirect('/dashboard')}
 if(['register','login','admin/login','forgot-password','auth/reset-password','auth/link'].includes(route))return <Registration nativeIdentity={nativeIdentityEnabled()} role={role} mode={route==='login'&&query.step==='mfa'?'login/mfa':route} signedIn={!!user} name={user?.displayName||''} configured={authConfigured()}/>;
 if(route==='admin'||route.startsWith('admin/')){let allowed=false;if(user&&await isProvisionedAdmin(user.userId)){try{await activeMember(user);allowed=true}catch{}}if(allowed&&(!authConfigured()||!await verifiedAdminMFA())){if(authConfigured())redirect('/login?step=mfa');allowed=false}return <AdminSite route={route} authorized={allowed}/>;}
 const publicPages=['home','features','how-it-works','supported-countries','requirements','public-comparison','calculator','about','help','faq','contact','privacy','terms'];
 if(publicPages.includes(route))return <PublicSite destinations={await activeDestinations()} pages={await publishedPages()} role={role} route={route} signedIn={!!user} rules={['supported-countries','requirements','public-comparison'].includes(route)?await publicRules():[]}/>;
 if(!user)redirect('/login');
 try{await activeMember(user)}catch{return <Registration nativeIdentity={nativeIdentityEnabled()} role={role} mode="register" signedIn name={user.displayName} {...(await restrictedProps(user))} configured={authConfigured()}/>}
 return <App route={route} user={{name:user.displayName,email:user.email,admin:await isProvisionedAdmin(user.userId),profileId:await profileIdForOwner(db(),user.userId)}}/>;
}
