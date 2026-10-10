# VisaFund interactive demo update — 10 October 2026

Existing deployed source (78e93baf) was used. The discarded uploaded ZIP was not used.

## Completed

- Public homepage: Try Demo — No Registration Required; application demo routes resolve before identity lookup. Hosting remains owner-private, so this does not remove the hosting access wall for outsiders.
- Permanent fictional-data banner, reset, exit and registration action; bilingual beginner instructions and financial-term explanations in all 17 major demo routes.
- Independent per-tab sessionStorage sample state; no production financial writes. Navigation preserves practice; reset reconstructs the original synthetic data; exit reloads the server-owned real route.
- Accounts: create/edit/delete empty sample accounts; balances and opening dates validated; currency cannot change after transactions exist.
- Transactions: create/edit/delete, source/sender/receiver/purpose fields, search, account/date/direction filters, local CSV import, paired internal transfers. Removing a demo transfer removes both sides; transfers are excluded from income and expenses.
- Calendar: month/date/account/currency controls, daily income/expenses and closing balances. Insights update from the mutable ledger; balance, flow, savings, categories and sources use the selected period/currency.
- Destinations: create/edit/delete and primary selection. Country directory excludes Thailand; official requirements are only shown from existing verified public records, otherwise unverified notices remain.
- Comparison: selectable destinations, official-source status and clearly labeled fictional tuition/living assumptions. These are not actual university prices or legal requirements.
- Readiness: personal-goal gaps/progress and editable sample evidence checklist; recorded funds and pending awards remain separate.
- Sponsors: editable examples and contribution shortcut to ledger; promised support does not count as cash. Goals: edit target/deadline, add simulated savings through a credit, and reset.
- Document vault: five fictional plain-text explanatory notes; create/categorize/preview/download/remove sample notes. Demo does not upload selected files or generate bank certification.
- History: derived monthly opening/credits/debits/closing/daily-minimum table and daily charts. Reconciliation practice requires a matching ledger balance and a sample note.
- Reports: current practice ledger in CSV/JSON downloads, account period summaries, source details, visible preview and existing Print / save PDF. Prominent DEMO — USER-PREPARED FINANCIAL SUMMARY — NOT AN OFFICIAL BANK STATEMENT warning. Browser PDF generation was not executed here.
- Settings and reminders have demo examples; demo profile edits/export/reset remain separate from real settings/data. Display language/theme preferences use existing device preferences.
- No Education Budget navigation or Thailand selection reintroduced; no financial table migrations, database reset, environment changes or production records accessed.
- Retired /admin/login redirects to /login. Configured login decides destination using the existing trusted server provisioning check rather than a browser admin flag. MFA now gates the admin page as well as APIs. External authentication configuration is still required; no admin account or credentials created. Existing server provisioning remains the baseline server-only ID allowlist, not a new DB role migration.

## Executed validation

| Suite | Passed assertions/checks |
|---|---:|
| Financial engine | 21 |
| View model | 10 |
| Admin services | 56 |
| Authentication policy | 24 |
| Demo and FX policy | 202 |
| New demo practice state | 104 |
| Compiled Worker financial API/D1/R2 | 333 |
| Compiled Worker demo/FX/privacy | 189 |
| Supabase SDK mocked-provider contract | 75 |
| Total | 1014 |

TypeScript, production Worker build and git diff whitespace check passed.
Initial monthly-history opening was double-counted; corrected and regression tested. Earlier test expectations for removed navigation/fallback login were stale; updated to match approved behavior. All final suites passed.

The compiled Worker tests rendered all 17 demo sections and checked that a seeded private financial marker stayed absent. They verify public-rule filtering, country/navigation removal, FX timestamps/failure fallback and unchanged isolated test financial data. Practice tests exercise state mutations and calculations. These do not constitute interactive browser execution.

## Not verified / remaining

- No supported browser-control skill is available: desktop/mobile click flows, visual responsiveness, per-tab navigation persistence and actual browser print/PDF have not been browser-tested.
- No real configured Supabase project/email delivery/TOTP/admin account was exercised; provider integration tests use a synthetic provider. Configure provider/SMTP/callbacks as described in AUTH-INTEGRATION.md before enabling email/password authentication.
- FX retrieval and outage logic were tested with provider mocks, not fresh production egress. No fictional rate fallback was introduced.
- SessionStorage may be unavailable or full; practice warns and remains in memory. Reset data only affects the demo namespace. Visitor practice is not saved to real accounts.
- Site remains private. Public visitor access requires separate explicit launch approval, real authentication validation and security testing.
