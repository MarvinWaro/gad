# RA 9262 survey

RA 9262 uses the shared survey builder and four-step public questionnaire. Its
definition contains the supplied 21 experience choices and 16 perpetrator
choices, plus an exclusive none choice. No name or email is collected.

The answering-for question stores `self` or `minor-under-legal-care` in
`survey_responses.answers.answering_for`. When answering for a minor, all
demographics, institution details, and experiences describe that minor. Age must
be below 18 and guardian confirmation is required. RA 7877 responses keep their
existing answer keys; there is no database migration.

## Draft setup and review

Run `php artisan db:seed --class=SurveySeeder` to create missing drafts. Re-running
the seeder preserves existing survey metadata, edited drafts, published versions,
and collected responses. A new RA 9262 draft inherits the current published
RA 7877 retention period; if none exists, retention must be set in the builder.

Review RA 9262 in **Admin → Surveys**. The readiness gate checks notices,
retention, an active directory chain, and the questionnaire's supported answer
keys. Publishing requires the operator's explicit approval and opens the next
draft. Until publication, `/surveys/ra-9262` and its landing card remain closed.

Labels may be edited without changing stored option values. Only one perpetrator
option may require free text because the existing response format holds one
specified-detail string per experience. Admin response details use the frozen
version's labels. CSV exports include specified details and, for RA 9262,
answering-for information.

## Verification

Build browser assets with `npm run build`, then run:

```text
php artisan test
node --test tests/frontend/*.test.ts
npx playwright test
vendor/bin/pint --test
npx tsc --noEmit
```

On Windows PowerShell, use `npx.cmd` if execution policy blocks `npx.ps1`, and
`php vendor/bin/pint --test` for Pint.

Playwright starts its own server on port 8016 with a temporary SQLite database.
It creates published RA 7877 and RA 9262 fixtures and their next drafts, leaves
the other laws closed, and uses built assets even if Vite is running. It never
reuses a working application server or publishes into the development database.
