INSERT INTO platform_roles(owner,role,provisioned_by,created)
SELECT p.id,'SUPER_ADMIN','trusted-operator',datetime('now')
FROM platform_users p
WHERE p.status='active'
AND lower(p.email)='emonhossain5081@gmail.com'
AND p.id=COALESCE(
 (SELECT owner FROM auth_identities WHERE issuer='https://xtimiytiuyeetgnzlftg.supabase.co/auth/v1' AND subject='04c88899-99da-4661-b5bf-73ef17b9b1b0'),
 'supabase:04c88899-99da-4661-b5bf-73ef17b9b1b0')
ON CONFLICT(owner) DO UPDATE SET role='SUPER_ADMIN',provisioned_by='trusted-operator';
INSERT INTO platform_audit(id,actor,target,action,reason,created)
SELECT lower(hex(randomblob(16))),'trusted-operator',owner,'role.provision','Provider UID and confirmed email verified by operator',datetime('now')
FROM platform_roles
WHERE owner=COALESCE(
 (SELECT owner FROM auth_identities WHERE issuer='https://xtimiytiuyeetgnzlftg.supabase.co/auth/v1' AND subject='04c88899-99da-4661-b5bf-73ef17b9b1b0'),
 'supabase:04c88899-99da-4661-b5bf-73ef17b9b1b0')
AND role='SUPER_ADMIN';
SELECT owner,role FROM platform_roles WHERE owner=COALESCE(
 (SELECT owner FROM auth_identities WHERE issuer='https://xtimiytiuyeetgnzlftg.supabase.co/auth/v1' AND subject='04c88899-99da-4661-b5bf-73ef17b9b1b0'),
 'supabase:04c88899-99da-4661-b5bf-73ef17b9b1b0');
