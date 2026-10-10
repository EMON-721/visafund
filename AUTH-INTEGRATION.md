# Unified VisaFund authentication — operator setup

This is a saved development change, not a deployed or configured provider. The financial database remains Cloudflare D1/SQLite, documents remain private R2. Supabase is used only for authentication. No PostgreSQL RLS claim. Existing ChatGPT identities remain supported. Public header has Login and Register; /admin/login only redirects to /login. Password login consults platform_roles and active platform_users. Administrators finish fresh provider TOTP on the same login route before /admin/dashboard. Users go to /dashboard.

## Secure provider setup (not completed)

No connected Supabase project or hosting authentication environment values were found. Create/connect a Supabase project through its secure dashboard. Enable email/password, mandatory email confirmation, asymmetric JWT signing, MFA/TOTP, refresh-token protection, provider rate limits, and appropriate access/session lifetimes. Configure production SMTP, verified sender and SPF/DKIM. Test delivery with disposable accounts. Do not enable CAPTCHA until the matching token UI is implemented and tested.

In the hosting secure environment interface, configure SUPABASE_URL (exact HTTPS project origin), SUPABASE_PUBLISHABLE_KEY (modern sb_publishable_ key), and APP_ORIGIN (exact tested HTTPS origin). Set AUTH_PROVIDER_ENABLED=true only in an independently isolated private staging environment first. The ordinary Worker must never receive a provider secret/service-role key. .env.example contains placeholders only. Supabase is preferred because its SDK has email verification, recovery, server cookies and TOTP; Clerk/Auth0 would require a replacement adapter without resolving the absent account/configuration or hosting gate. Real Sites-provider egress and browser dispatch compatibility still need verification.

Site URL: https://visafund-emon.emonhossain5081.chatgpt.site
Allow exact /auth/callback, /auth/callback?flow=recovery, /auth/confirm, /auth/reset-password URLs at this origin and the separately configured real staging origin. No wildcard. Signup email template must point to /auth/confirm?token_hash={{ .TokenHash }}&type=signup; recovery template must point to /auth/confirm?token_hash={{ .TokenHash }}&type=recovery. A query string alone never authorizes recovery. Recovery uses a hashed single-use, subject/session-bound 15-minute D1 grant. Password reset consumes the grant then requests global provider signout. Existing access JWTs on other devices may remain valid until expiration; only the current session receives an application revocation tombstone. This is an explicit residual limitation, not a global immediate-revocation claim.

## Initial administrator: emonhossain5081@gmail.com

No administrator has been created. No default password exists. Use a NEW password solely in the provider secure interface. Register and verify the designated provider identity and its USER membership first. Email alone never grants privileges.

If preserving an existing ChatGPT financial workspace, authenticate BOTH that original identity and the verified provider identity with a recent provider password, then explicitly confirm /auth/link BEFORE granting admin. The mapping preserves original owner IDs; financial rows are not rewritten. Existing nonempty provider workspaces cannot silently merge. Existing administrators additionally need fresh MFA to link. Check the immutable UUID and original identity as an operator; never transfer an account merely from an email match.

Run scripts/provision-admin.mjs in a trusted operator environment using a secret manager for SUPABASE_URL, SUPABASE_SECRET_KEY, ADMIN_SUBJECT (verified immutable provider UUID), ADMIN_EXPECTED_EMAIL. It verifies confirmed provider ownership and outputs reviewable SQL. Execute that SQL only through authenticated D1 operator tooling against the intended staging database. It promotes only the matching active existing membership/mapping, adds an audit entry, and cannot create/reactivate users. Review that exactly the intended owner has SUPER_ADMIN. No public role-write endpoint exists. Do not save the operator key or any password in this repository, shell history or ordinary hosting runtime.

Log out and log in at /login with the designated identity. Complete the same page's authenticator enrollment and a real TOTP challenge. Admin APIs additionally enforce a signed aal2 claim, verified factor and TOTP within five minutes. Reauthenticate when expired. Repeat this controlled procedure for production only after backups, staging validation and approval.

## Sessions and privacy

Secure, HttpOnly, SameSite=Lax, Path=/ cookies; Remember controls persistence, not authorization. getUser plus signature-verified getClaims validates subject, issuer, audience and expiration. A captured logged-out provider session_id is denied by D1 even if its JWT has not expired. Normal logout affects the current session only, clears auth/recovery cookies and follows top-level ChatGPT signout back to /login. Auth login, logout and successful MFA create metadata-only audit entries. Revocation tombstones currently have no automatic retention cleanup.

Protected API ownership binds owner and record ID, including R2 retrieval. Administration exposes basic account metadata/content/audit only, no private finance joins or impersonation. Status restrictions are enforced on protected calls. D1 is not a per-user encrypted datastore: infrastructure operators with DB/R2 or Worker deployment privileges can access underlying data. Provider/infrastructure encryption and backups need operator verification. The app does not implement end-to-end encryption.

Pagehide/BFCache guards hide protected pages until /api/auth/session validates; logout reloads away from in-memory finance data. Browser back/forward, tab behavior, top-level dispatch logout and mobile cookies are NOT independently tested. Native ChatGPT session revocation depends on the hosting dispatcher; the signed-out marker is not a cryptographic revocation of native identity.

## Backup, migration and rollback gate

0006_robust_wallflower.sql adds platform_roles and auth_revoked_sessions and backfills existing memberships as USER. It changes no financial rows or owner mappings. SQL includes role CHECK protection in addition to the Drizzle snapshot. Test with synthetic data passed; production migration NOT applied. An old environment admin allowlist no longer grants access; all legitimate admins must be explicitly provisioned in DB after the migration.

Before production: authenticated hosting operator must export D1 to encrypted storage (wrangler d1 export <actual DB name/id> --remote --output <secure backup path> where operator access exists), snapshot all private R2 objects and metadata with authenticated object tooling, record checksums and object/row counts securely, and restore both into an isolated staging database/bucket. Verify identity mappings, relationships and sample authorized retrieval there. This environment offers schema inspection but no verified full backup/restore export; backup is BLOCKED, not complete.

Use new staging DB/R2 bindings, never production data copied into an exposed preview. Keep auth disabled until reviewed migration exists. On failure roll back source/runtime settings to live version15 commit fcf349ee6e59499d4bc1ca97e6abd95f7e93a3ac; leave additive tables intact. For data corruption restore the verified D1/R2 pair, not merely source. Pause writes during consistent snapshots/restoration. Do not execute destructive down-migrations or reset the database.

Set reviewed DATA_RETENTION_DAYS and DATA_RETENTION_POLICY_VERSION before account deletion. Deletion blocks access immediately, waits that retention and performs audited owner-scoped D1/R2 removal. Provider identity removal/revocation remains a separate unimplemented privileged operation. Country/requirement/content administration presently stores reviewed platform metadata; it does not automatically publish those drafts into the public destination/rule configuration.

## Review/preview gate

This Site remains owner-private. Its hosting access gate still applies before application auth; visitor signup/demo is not reachable by outsiders until audience approval. No production deployment or migrations have been performed for this change. A saved source version is not a functioning staging URL. Browser QA is unavailable under the supported toolchain. Provision independent private staging with isolated storage and secure provider configuration; perform real email/MFA, browser/mobile, backup restore, dependency review and administrative publishing workflow validation before asking for deployment approval.
