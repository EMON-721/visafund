# VisaFund — Cloudflare preparation

This is the current existing VisaFund source. See [CLOUDFLARE-MIGRATION.md](CLOUDFLARE-MIGRATION.md) before deploying. Runtime authentication configuration, private staging access, and verified production data/file migration are still required. External builds now use backend-only Supabase private Storage; see [PRIVATE-STORAGE.md](PRIVATE-STORAGE.md). No public deployment has been performed.

Cloudflare build branch: `cloudflare-preparation`. Build with `npm run build:cloudflare`; deploy with `npm run deploy:cloudflare`. Public Worker and preview URLs remain disabled in the repository configuration.

## Executed checks

- External Cloudflare production build: passed.
- TypeScript: passed.
- Finance: 21 assertions passed.
- Auth policy: 29 checks passed.
- Admin service: 56 checks passed.
- External Worker and mocked Supabase provider: 109 checks passed, including forged native identity rejection, role redirects, MFA gating, owner isolation and logout/session replay rejection.
- Private Storage adapter: 23 checks passed using a mocked transport.
- Real email delivery, real MFA, browser/mobile QA, data export/restore and deployed Cloudflare account limits: not tested.

## Original project documentation (historical Sites behavior; external configuration is described above)

# VisaFund

A private, operational student financial planning application, built with React, TypeScript, Vinext (Next.js App Router APIs), Cloudflare D1, R2, and Sites identity.

## Run locally

Requires Node 22.13+, pnpm, and the bundled dependencies.

```
pnpm install
pnpm db:generate
pnpm build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_public_mastermind.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0001_luxuriant_the_hood.sql
pnpm dev
```

See the starter README and wrangler configuration for local bindings. Generate migrations only after schema changes. Production migration files are immutable once applied.

```
node --experimental-strip-types tests-finance.ts
node tests-api.mjs
pnpm exec tsc --noEmit
pnpm build
```

## Data and authorization

Financial APIs use the dispatcher-provided ChatGPT identity. All reads, mutations, downloads, and exports require that identity and query by owner. Sponsor records are information only: no third-party sponsor sharing has been enabled. Administrators only edit global rules and cannot use that role to browse another user’s finances.

Money is stored as integer minor units, with zero decimal places for JPY/KRW and two for supported other currencies. Same-currency transfer amounts must agree; cross-currency transfers record the actual debited and credited amounts. Both entries and audit events commit atomically. Imported rows are immutable and deduplicated. Manual corrections retain audit snapshots. CSV exports protect against spreadsheet formula injection.

D1 has no PostgreSQL row-level security. Ownership authorization is implemented in the service and prepared queries. This is a justified hosting-compatible alternative; it is not a PostgreSQL/Supabase implementation.

Set ADMIN_EMAILS as a hosted environment variable to a comma-separated explicit allowlist. Leave it empty to disable all rule administration. No administrator is provisioned implicitly.

Documents use private R2 storage with authenticated downloads, size/type checks, and SHA-256 hashes. Originals are never rewritten. Malware scanning is not yet integrated.

## Implemented workflows

- Signed-in private financial workspace and personal profile
- Accounts with opening date, currency, ownership, accessibility, and masked numbers
- Manual transactions, corrections, audited deletion, filtering, pagination, and CSV export
- CSV preview/import with validation, duplicate detection, and unchanged original CSV preservation
- Atomic internal transfers excluded from income/expense totals
- Date-range dashboard, trends, source analysis, calendar, balance reconciliation
- Sponsors, scholarships, savings goals, targets, budgets, manual rate records
- Private documents, preparation checklist, derived in-app reminders
- Country directory, comparison, immutable administrator rule versions
- Unofficial print/PDF summaries and JSON data export
- Theme switch, English/Bangla navigation and dashboard, responsive layouts
- Financial data deletion with document removal

## Current limits against the full brief

This is the working foundation and core planning application, not the complete public SaaS acceptance target. Public email registration/reset, email verification, MFA, Google OAuth, granular sponsor invitations, PostgreSQL RLS, malware scanning, live exchange rates, AI assistant, automated email/push notifications, and a fully translated Bangla interface are not implemented. Rule records start empty and honestly unverified: no official visa amounts have been invented. Country-specific legal eligibility, complete holding-period validation, multiple rule jurisdiction matching, historical exchange-rate normalization, loan/reversal workflows, need further work. Readiness is an explicit limited planning screen. No visa approval probability is calculated.

Reports use the browser's Print / Save as PDF, not a server-generated PDF attachment. A small dataset could be validated by closing balance without a complete history; the UI discloses this. Chart analysis is capped at 2,000 rows per selected period and warns on truncation. The oldest opening balance should precede all recorded transactions.

Admin rule publication requires manual official source verification; URL presence alone is not automated verification. Verify current official requirements before publishing a rule. Email credentials, bank PINs, and full account numbers are never requested.

The synthetic demo is isolated from real saved records and labeled throughout. Its example includes October 10, 2026 for the specified closing-balance demonstration. It must never be submitted as real evidence.

## Deployment

The site uses managed Sites hosting. `.openai/hosting.json` contains only logical DB/BUCKET bindings and the Site project ID. Sites applies Drizzle migrations and provides dispatcher identity. Use the Sites source workflow and deployment tools; do not put credentials in source. Secrets are configured as runtime variables. Public deployment and production readiness require resolving the limits listed above.

Validation performed: 16 financial assertions and 66 API integration checks using the built Worker with real emulated D1/R2. Browser-based Playwright and WebMCP validation were unavailable in this session. Responsive UI interactions and complete Bangla translation still need browser QA. Mutations use database-backed per-user minute limits; uploads are bounded at 10 MB and rate-limited separately.

<!-- DEPLOYMENT LINKS: maintained for GitHub repository navigation -->
## Website & repository links

- **Source repository:** https://github.com/EMON-721/visafund
- **Published website URL:** https://visafund.emon721.workers.dev
- **Availability:** Cloudflare Domains screenshot on 3 November 2026 confirms the `visafund` production `workers.dev` route is enabled under the `emon721` account subdomain. A successful end-to-end live HTTP/authentication test has not yet been verified.

<!-- END DEPLOYMENT LINKS -->
