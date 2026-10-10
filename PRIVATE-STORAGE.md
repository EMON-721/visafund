# Private document storage and administrative access

External Cloudflare builds use Supabase Storage; original Sites builds retain R2. Existing D1 owner identifiers and document keys are preserved. No production files or financial rows were migrated or deleted by this update.

All uploads/downloads pass through `/api/documents`. Verified identity, active D1 account status, request rate limits (upload), and owner-scoped D1 lookup run before Storage access. Files download as attachments with no-store and nosniff; no public URLs or reusable signed links are returned. File content signatures and UTF-8 CSV validation remain enforced.

The `visafund_backend_only` restrictive policy denies direct document operations to `anon` and `authenticated`, including authenticated administrators. The Worker uses a privileged server credential after its own authorization checks. This prevents a suspended user from bypassing D1 checks with a Supabase access token. Do not add permissive frontend upload policies.

## Secure setup still required

In Cloudflare Worker Settings → Variables and Secrets, add **encrypted Secret** `SUPABASE_STORAGE_SECRET_KEY` from Supabase Settings → API Keys → Secret keys (`sb_secret_...`). Enter it directly in the provider dashboard, never chat or source. This key must stay in the server runtime. `SUPABASE_STORAGE_BUCKET=visafund-documents` and the actual Supabase URL are runtime variables. Never prefix the secret with NEXT_PUBLIC or VITE. Rotate it if exposed. Keep AUTH_PROVIDER_ENABLED false until real auth setup is tested.

This key has project-level privileged infrastructure access and bypasses RLS; it is not a bucket-scoped credential. Cloudflare secret administrators and Supabase infrastructure operators can therefore access stored data. The platform admin application exposes only account/content metadata and deletion controls, not users' document contents or finances. Server code is the authorization boundary. A dedicated storage broker with narrower infrastructure credentials is a possible later hardening, not implemented here.

The bucket is private, with maximum 10 MB per object and PDF/PNG/JPEG/CSV MIME types. Migration: `supabase/migrations/20261010143904_visafund_private_documents_backend_only.sql` (already applied to the existing Auth project). Do not modify Supabase's storage metadata with SQL to migrate actual files; use supported Storage APIs. Native R2 objects require separately verified copying and ownership/account linking before external cutover.

## Admin dashboard

User search/status filters, account selection, suspend/ban/reactivate/unban, exact-ID deletion confirmation, retention queue, content management, registration analytics, audit logs and database health are backed by existing MFA-protected APIs. SUPER_ADMIN is provisioned by the trusted operator script, never frontend email matching. Totals count registered account records; active means account status, not online presence.

Deletion requires your approved DATA_RETENTION_DAYS and DATA_RETENTION_POLICY_VERSION. Neither has been invented. Pending accounts immediately lose protected application access. Eligible deletion removes app data and private objects, with an audit record, and cannot target protected admin accounts. Provider identity removal remains a separate trusted-operator step; the API reports `providerIdentityDeleted:false`. Deleting files during retention execution does not expose their content to the Admin UI.

No paid service was activated. End-to-end upload, Google callback, actual admin provisioning/MFA, email verification/recovery, production-data restore and private browser preview remain deployment checks. Mock tests are not evidence of real provider delivery.
