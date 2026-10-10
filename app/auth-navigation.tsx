import LogoutButton from '@/app/logout-button';
// Role is supplied by the server's authenticated database lookup, never browser input.
export default function AuthNavigation({signedIn,role='USER'}:{signedIn:boolean;role?:'USER'|'SUPER_ADMIN'}){
 return <nav aria-label="Account navigation">{signedIn?<><a href={role==='SUPER_ADMIN'?'/admin/dashboard':'/dashboard'}>{role==='SUPER_ADMIN'?'Admin Dashboard':'Dashboard'}</a><a href="/settings">{role==='SUPER_ADMIN'?'Account':'My Account'}</a><LogoutButton/></>:<><a href="/login">Login</a><a href="/register">Sign Up</a></>}</nav>;
}
