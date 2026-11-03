# VisaFund: existing source, external Cloudflare preparation

This repository preserves the existing VisaFund source at Sites version 17. It is not a new app. `vite.config.ts` keeps the original Sites build. `vite.cloudflare.config.ts` builds the external Cloudflare Worker. No production data or secrets are included.

## Current state

This is a PREPARATION branch and the data migration is not yet verified as complete. On 3 November 2026, a Cloudflare Domains screenshot showed the public production Worker route `https://visafund.emon721.workers.dev` enabled. A separate staging D1 database is configured; no production financial records were exported, changed, or reset by these source changes. The private Sites deployment remains the source of any original data pending a verified migration.

External builds discard all `oai-*` identity headers and set `EXTERNAL_HOSTING=true`. ChatGPT sign-in UI is hidden and email/password Supabase identity is required. Logout returns to `/login`. Server-owned roles, active membership, mandatory admin MFA and per-owner financial API access remain enforced. Public signup cannot assign an administrator role.

## Before connecting builds

1. Review GitHub repository visibility and production access: the repository is currently public and the production Worker URL is enabled. Never commit credentials, private documents or exported financial data. Restrict access or use staging for incomplete testing.
2. Choose Cloudflare Workers, not a static Pages upload. Set the production branch only after configuration and migration review.
3. Create a separate staging D1 database. Replace the placeholder database ID in `wrangler.cloudflare.jsonc` with its actual ID. Never point staging at the existing production database.
4. External builds use the private Supabase `visafund-documents` bucket. Native Sites keeps its existing R2 binding. The Supabase migration enforces backend-only document operations and 10 MB PDF/PNG/JPEG/CSV restrictions. No R2 billing activation is needed for external builds. Existing documents still require a verified migration; source recovery does not move them.
5. Install the pinned pnpm version and dependencies with `pnpm install --frozen-lockfile`. Build with `pnpm run build:cloudflare`. Cloudflare Workers deployment command is `pnpm run deploy:cloudflare`; do NOT run until bindings, privacy, authentication and data migration are verified.
6. The current configuration has `workers_dev=true`, `preview_urls=false`, and no custom routes. The enabled production `workers.dev` URL is public (unless restricted with Cloudflare Access); disabling previews does **not** protect production. Confirm staging data separation, authentication, access policy and storage permissions before using it with real financial data.
7. Set runtime `SUPABASE_PUBLISHABLE_KEY` through Cloudflare's secure environment UI. The document adapter requires a separate `SUPABASE_STORAGE_SECRET_KEY` encrypted Worker Secret (`sb_secret_...`). This is privileged infrastructure access, not a user/admin permission. Never expose it to clients, logs, Git, or build-time public variables. The earlier no-secret Worker guidance has changed to support server-mediated storage; see PRIVATE-STORAGE.md. Keep the operator provisioning key separate. Set `SUPABASE_URL`, the actual `APP_ORIGIN`, and `AUTH_PROVIDER_ENABLED=true` only after provider configuration and verification tests. Keep `EXTERNAL_HOSTING=true`.

## Supabase configuration

Use the existing project `VisaFund Auth` (`xtimiytiuyeetgnzlftg`). The owner requested **no signup email verification**: in Supabase Authentication → Sign In / Providers → Email, turn **Confirm Email OFF**. The Supabase dashboard setting is mandatory; GitHub/Worker code cannot toggle it. With Confirm Email disabled, Supabase auto-confirms new password signups, returning a session. Note the significant account-impersonation risk: someone can claim another person's email; evaluate whether this is acceptable for a financial application. Do not disable MFA for administrators. Configure the actual Worker origin as Site URL, allow `/auth/callback` and recovery redirects, and retain password recovery/email-change protections where applicable. Existing pending-confirmation accounts are not automatically repaired by this change.

The administrator registers/verifies like other users, then a trusted operator verifies provider UUID and provisions SUPER_ADMIN using `scripts/provision-admin.mjs`. A password is set privately through the authentication provider, never source code. MFA is required before admin access.

## Data preservation: required before cutover

A Git repository contains SOURCE, not the existing D1 database or R2 documents. Export those through the current hosting's supported trusted operator process, retain owner IDs and private object keys, restore into staging and verify row/object counts and ownership. Do not commit backups or documents to GitHub. Current tools have not demonstrated a complete D1/R2 export path; this remains a migration blocker.

Existing native ChatGPT financial owners must be linked to their verified Supabase identity on the ORIGINAL trusted Sites host using `/auth/link`, before copying `auth_identities` into external staging. An external Worker cannot securely verify a ChatGPT header, and email matching is never a substitute for proof of both accounts. Financial owner IDs are not rewritten.

Apply additive migrations only after inspecting the imported schema and migration history; do not blindly apply all CREATE TABLE migrations to a restored database. Existing records must survive verified restore and rollback exercises before switching URLs.

## Validation and launch

Run TypeScript, finance/policy tests and the external Worker mocked-provider tests. Then test immediate no-verification signup (a unique new email), repeat signup rejection, login, password reset, USER/SUPER_ADMIN/MFA, 30-day activity tracking and cron bans, suspension/logout, User A versus User B, private documents, desktop/mobile browser navigation and protected preview access. Mock tests do not prove real mail or MFA delivery. Confirm free plan Worker bundle/runtime limits with an actual upload validation before deployment; local compilation does not prove hosting compatibility under account limits.

Public Worker routing is already enabled as shown in the Cloudflare screenshot. Do not migrate original financial data, widen access, or retire the original website until these tests pass and the owner approves cutover.


## Daily inactivity ban (new policy)

The Worker entrypoint exports a `scheduled()` handler and `wrangler.cloudflare.jsonc` configures `0 3 * * *` UTC. The policy starts on 2026-11-03 and provides a 30-day grace period to prevent retroactive bans on older accounts. From 2026-12-03 onward, the Worker bans `active` non-`SUPER_ADMIN` accounts with `last_seen` at least 30 days old. An authenticated workspace/API visit updates `last_seen`; the initial access after 30 days is also checked against the ban condition. Ban does not delete account/financial information. Manually unban accounts through the existing audited admin controls. Verify the deployed Cron Trigger and D1 binding before announcing this as active.
