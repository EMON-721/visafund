# VisaFund: existing source, external Cloudflare preparation

This repository preserves the existing VisaFund source at Sites version 17. It is not a new app. `vite.config.ts` keeps the original Sites build. `vite.cloudflare.config.ts` builds the external Cloudflare Worker. No production data or secrets are included.

## Current state

This is a PREPARATION branch, not a completed migration or a live preview. A separate staging D1 database has been configured; no production financial records were exported, changed, or reset. The current private Sites deployment remains the authoritative copy.

External builds discard all `oai-*` identity headers and set `EXTERNAL_HOSTING=true`. ChatGPT sign-in UI is hidden and email/password Supabase identity is required. Logout returns to `/login`. Server-owned roles, active membership, mandatory admin MFA and per-owner financial API access remain enforced. Public signup cannot assign an administrator role.

## Before connecting builds

1. Keep the GitHub repository PRIVATE. Do not enable automatic Cloudflare deployment yet.
2. Choose Cloudflare Workers, not a static Pages upload. Set the production branch only after configuration and migration review.
3. Create a separate staging D1 database. Replace the placeholder database ID in `wrangler.cloudflare.jsonc` with its actual ID. Never point staging at the existing production database.
4. External builds use the private Supabase `visafund-documents` bucket. Native Sites keeps its existing R2 binding. The Supabase migration enforces backend-only document operations and 10 MB PDF/PNG/JPEG/CSV restrictions. No R2 billing activation is needed for external builds. Existing documents still require a verified migration; source recovery does not move them.
5. Install the pinned pnpm version and dependencies with `pnpm install --frozen-lockfile`. Build with `pnpm run build:cloudflare`. Cloudflare Workers deployment command is `pnpm run deploy:cloudflare`; do NOT run until bindings, privacy, authentication and data migration are verified.
6. Default configuration has `workers_dev=false`, `preview_urls=false`, and no custom routes. These deliberately prevent a public endpoint. Keep these disabled until a protected staging access plan is implemented and verified. No deployment URL is claimed by this repository.
7. Set runtime `SUPABASE_PUBLISHABLE_KEY` through Cloudflare's secure environment UI. The document adapter requires a separate `SUPABASE_STORAGE_SECRET_KEY` encrypted Worker Secret (`sb_secret_...`). This is privileged infrastructure access, not a user/admin permission. Never expose it to clients, logs, Git, or build-time public variables. The earlier no-secret Worker guidance has changed to support server-mediated storage; see PRIVATE-STORAGE.md. Keep the operator provisioning key separate. Set `SUPABASE_URL`, the actual `APP_ORIGIN`, and `AUTH_PROVIDER_ENABLED=true` only after provider configuration and verification tests. Keep `EXTERNAL_HOSTING=true`.

## Supabase configuration

Use the existing project `VisaFund Auth` (`xtimiytiuyeetgnzlftg`). Keep email verification enabled. Configure the actual staging origin as Site URL and explicitly allow `/auth/callback`, `/auth/callback?flow=recovery`, `/auth/confirm`, and `/auth/reset-password` at that origin. Signup email link must use `/auth/confirm?token_hash={{ .TokenHash }}&type=signup`; password recovery uses `/auth/confirm?token_hash={{ .TokenHash }}&type=recovery`. Confirm email delivery and free-provider limits before saying public registration works. Do not bypass verification.

The administrator registers/verifies like other users, then a trusted operator verifies provider UUID and provisions SUPER_ADMIN using `scripts/provision-admin.mjs`. A password is set privately through the authentication provider, never source code. MFA is required before admin access.

## Data preservation: required before cutover

A Git repository contains SOURCE, not the existing D1 database or R2 documents. Export those through the current hosting's supported trusted operator process, retain owner IDs and private object keys, restore into staging and verify row/object counts and ownership. Do not commit backups or documents to GitHub. Current tools have not demonstrated a complete D1/R2 export path; this remains a migration blocker.

Existing native ChatGPT financial owners must be linked to their verified Supabase identity on the ORIGINAL trusted Sites host using `/auth/link`, before copying `auth_identities` into external staging. An external Worker cannot securely verify a ChatGPT header, and email matching is never a substitute for proof of both accounts. Financial owner IDs are not rewritten.

Apply additive migrations only after inspecting the imported schema and migration history; do not blindly apply all CREATE TABLE migrations to a restored database. Existing records must survive verified restore and rollback exercises before switching URLs.

## Validation and launch

Run TypeScript, finance/policy tests and the external Worker mocked-provider tests. Then execute real email verification, password reset, USER/SUPER_ADMIN/MFA, suspension/logout, User A versus User B, private documents, desktop/mobile browser navigation and protected preview access. Mock tests do not prove real mail or MFA delivery. Confirm free plan Worker bundle/runtime limits with an actual upload validation before deployment; local compilation does not prove hosting compatibility under account limits.

Do not enable public routing, merge into an auto-deployed production branch, or retire the original website until these tests pass and the owner approves launch.

