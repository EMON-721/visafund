# VisaFund account and admin corrections — 2026-10-11

## Changes
- Transaction/planning selectors use accessible native select controls, avoiding nested portal interaction. Transactions with no saved accounts display a Create bank account action and reject invalid/unowned account IDs.
- Remove the account last-four-digits input and masked-number display; preserve existing historical account details.
- Opening balance is optional, with an explicit notice that blank starts the recorded ledger at zero. API accepts omitted/blank opening and defaults omitted masked digits to empty; negative amounts remain invalid.
- All 15 workspace module configurations support page headings, explanatory notes and user create/edit/delete permissions. Backend financial mutations enforce these permissions and ownership.
- Overview's nine statistics/panels support configurable visibility and titles without editing financial calculations or users' private values.
- Add MFA-gated, audited retention policy configuration with exact approval phrase. Environment-managed retention remains authoritative. User metadata shows current policy and deletion job IDs. Ban/suspension blocks access immediately; eligible deletion remains confirmed and retention governed. Provider identity deletion remains a separate operation.

## Executed validation
- Full Cloudflare production build: PASS, exit 0 (non-fatal framework bundling warnings).
- TypeScript no-emit check: PASS.
- Built-worker authentication/API contract: 148 checks PASS against a synthetic provider and isolated D1, including blank/omitted opening balance, missing masked digits, negative balance rejection, selected owned account transaction recording, cross-owner rejection, create/edit/delete restrictions, overview settings and retention approval.
- Admin/database service: 71 checks PASS in isolated D1/R2.
- Module policy checks: PASS, all 15 disable/re-enable cases and health/mapping cases.

No production accounts, financial records, policies or storage were changed by these tests. No live admin MFA success is claimed. Real email verification/recovery and production upload/download remain separate live checks.
