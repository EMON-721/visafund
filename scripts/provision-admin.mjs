// Trusted operator only. No HTTP endpoint and no password input/output.
import {createClient} from '@supabase/supabase-js';
const {SUPABASE_URL,SUPABASE_SECRET_KEY,ADMIN_SUBJECT,ADMIN_EXPECTED_EMAIL}=process.env;
if(!SUPABASE_URL||!SUPABASE_SECRET_KEY||!ADMIN_SUBJECT||!ADMIN_EXPECTED_EMAIL)throw Error('Set operator-only environment values using your secret manager.');
if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(SUPABASE_URL)||! /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(ADMIN_SUBJECT))throw Error('Invalid project URL or subject');
const client=createClient(SUPABASE_URL,SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const {data,error}=await client.auth.admin.getUserById(ADMIN_SUBJECT);
if(error||!data.user?.email_confirmed_at||data.user.email?.toLowerCase()!==ADMIN_EXPECTED_EMAIL.toLowerCase())throw Error('Verified provider identity does not match. No role assigned.');
const q=s=>"'"+s.replaceAll("'","''")+"'";
const subject=q(data.user.id),email=q(data.user.email),issuer=q(SUPABASE_URL+'/auth/v1');
// Execute the reviewed SQL ONLY through authenticated D1 operator tooling.
// Existing linked owner takes precedence. Never rewrite financial ownership.
console.log(`BEGIN TRANSACTION;\nINSERT INTO platform_roles(owner,role,provisioned_by,created) SELECT p.id,'SUPER_ADMIN','trusted-operator',datetime('now') FROM platform_users p WHERE p.status='active' AND lower(p.email)=lower(${email}) AND p.id=COALESCE((SELECT owner FROM auth_identities WHERE issuer=${issuer} AND subject=${subject}),'supabase:'||${subject}) ON CONFLICT(owner) DO UPDATE SET role='SUPER_ADMIN',provisioned_by='trusted-operator';\nINSERT INTO platform_audit(id,actor,target,action,reason,created) SELECT lower(hex(randomblob(16))),'trusted-operator',owner,'role.provision','Verified provider identity; operator grant',datetime('now') FROM platform_roles WHERE owner=COALESCE((SELECT owner FROM auth_identities WHERE issuer=${issuer} AND subject=${subject}),'supabase:'||${subject}) AND role='SUPER_ADMIN';\nCOMMIT;\nSELECT owner,role FROM platform_roles WHERE owner=COALESCE((SELECT owner FROM auth_identities WHERE issuer=${issuer} AND subject=${subject}),'supabase:'||${subject});`);
