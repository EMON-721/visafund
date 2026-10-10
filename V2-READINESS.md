# VisaFund V2 prepared upgrade — launch blocked

This is an additive upgrade of the existing VisaFund project. It is not a completed enterprise SaaS launch. Production remains on the existing private version until authentication, backup, staging/browser security checks, and the owner's final public-access approval are complete.

## Implemented and testable locally

- Real dispatch-owned ChatGPT authentication retained; no custom passwords or fake verification.
- Explicit authenticated enrollment with full name, consent, fixed USER registration behavior, preferred language/currency/country fields; unknown client fields rejected.
- Membership metadata separated from financial accounts, documents and records.
- Existing financial ownership IDs preserved. Legacy users with existing records are lazily adopted without losing data.
- Every financial API checks authenticated identity and active account status; suspended/banned/deletion-pending/deleted users are denied even with an existing upstream login session.
- Owner-scoped APIs do not gain financial access when the user is a provisioned administrator.
- Super Admin provisioning uses trusted server-side Site-scoped user IDs; email alone no longer provisions an admin.
- Public home/features/how-it-works/country information/comparison/planning calculator/about/help/FAQ/contact-status/login/registration/privacy/terms pages.
- Separate 14-section admin shell. Its APIs are intentionally locked before exposing any management data or action while MFA is missing. No impersonation, workspace browsing or financial admin exports.
- Bounded JSON body reads, origin checks, standard security headers and baseline CSP. Inline scripts/styles remain allowed to preserve framework/theme compatibility; this is not a strict nonce CSP.
- Three additive platform tables: platform_users, platform_audit, platform_content. No financial table replaced or erased.

## Essential configuration blockers

Email/password registration, verified email delivery, forgot/reset password, uniqueness handling through a genuine provider, MFA, step-up authentication, provider session revocation, registration bot controls and password abuse protection are NOT implemented. Sites currently exposes ChatGPT SIWC identity, not password/verification/MFA assurance endpoints. No credentials or authentication provider has been supplied.

Use a genuine provider with a verified application integration, such as Supabase Auth, Clerk or Auth0, only after confirming the chosen Site deployment supports its callback and cookie flow. Configure provider issuer/tenant, application client ID, server client secret where required, exact callback/logout origins for this Site, transactional email delivery/domain, reset and verification templates, admin MFA enrollment and policy, JWKS/token validation, fresh-auth timestamp and MFA assurance verification. Map provider identities to existing Site owner IDs through a verified account-linking process; never rewrite financial owners based on an email from a client request.

SUPER_ADMIN_USER_IDS must be provisioned using actual authenticated Site user IDs observed through a trusted path. The ChatGPT account/workspace ID is not automatically the Site-scoped ID. Production has no admin IDs configured. There is no boolean or browser header that can bypass MFA.

The admin shell is a readiness surface. User management tables, suspend/ban/reactivate/delete operations, content management, aggregate analytics, notification management and monitoring are blocked, not working features. Account-status enforcement is implemented, but integration tests set synthetic statuses directly in the isolated test database; they do not claim an admin successfully moderated an account.

Suspension prevents VisaFund access but cannot revoke or prevent the user's overall ChatGPT login. Provider-level session revocation requires the chosen auth provider. Email verification and last-login timestamps are not invented from unverified platform headers.

Public country pages show metadata/unverified state. No official rules, legal eligibility, malware scanning, zero-knowledge encryption or enterprise certification is fabricated. The contact page has no configured messaging backend. Policies remain draft pending operator/support/retention/legal review.

## Backup and rollback

Before production migration, obtain a verified D1 export/snapshot and R2 backup using the hosting operator's supported backup path, including restore verification. No production database backup was created or claimed in this task because the available tools do not expose that workflow. Source is preserved in Git; the prior live source commit is 74528c4ae6b288bf5f5098df737e5d5a1d52ff8c.

Migration 0002_fresh_tag.sql creates three tables and indexes only. It has no DROP, DELETE, UPDATE or financial owner rewrite. Automated tests create a pre-existing financial account before applying 0002 and verify its ID/owner/balance remain unchanged afterward. All destructive tests use a fresh ephemeral D1/R2 instance.

If production deployment later fails, redeploy the prior saved live version and retain the additive tables. Do not drop platform tables or reset financial tables as a rollback. R2 originals are untouched by the migration. Do not restore source alone as a claim that a database backup exists.

## Launch gates

1. Configure and test the actual authentication provider and admin MFA.
2. Implement real admin operations with reauthentication, retention checks, audited job-based deletion and metadata-only responses.
3. Verify backup recovery and exact existing user ownership mapping.
4. Execute provider login/logout/reset/verification/session tests and real three-account admin moderation tests.
5. Complete supported browser/mobile/keyboard tests and enforce a tested CSP compatible with hydration and print/download flows.
6. Address existing lint/type-quality findings and independent security/privacy review.
7. Ask the owner to approve the reviewed public-access change. Do not change the current private audience beforehand.
