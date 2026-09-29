# Monitoring reports

## Use

- HEI: open **Monitoring Report** from Home, select an academic year and semester, and enter the narrative answers. The same period opens the institution's existing report for all its HEI users.
- Save the draft, then use **Print / Save PDF** to prepare the document for both signatures. Upload the signed PDF (maximum 20 MB), confirm it matches the answers, and submit.
- **Records** shows drafts, submitted reports, correction requests, and reviewed reports. A returned report opens a new revision. Every submitted revision, its file, and its review remain in History.
- Staff: **Monitoring Reports** offers institution/period/status and geographic filters. Reviewer access is managed at `/admin/monitoring/access`, also linked from Settings for user managers.
- Reviewed means the documents were reviewed; it does not certify legal compliance. There is no calculated compliance score.

## Setup

Run the additive migration and permission setup after deploying the code:

```text
php artisan migrate
php artisan monitoring:setup
```

The setup command only adds monitoring view/review grants to the existing administrator and GAD focal person roles. It does not reset existing permissions, create reports, or assign national access. Run it after any intentional reseeding of the default RBAC roles.

An administrator with `users.update` must explicitly assign a region or national access to each reviewer, including themselves. Unassigned staff see an empty queue and cannot open reports. Regional assignments affect only this module. HEI access requires the HEI role and the institution linked to the account; creating/editing additionally requires an active HEI, cluster, and region.

PHP and the reverse proxy must allow a 20 MB PDF plus multipart overhead (`upload_max_filesize >= 20M`, `post_max_size > 20M`). The dedicated `monitoring` disk stores documents under `storage/app/private/monitoring-files`; do not expose this directory through a public storage link. Include it in database-consistent backups.

## Data and workflow

`MonitoringTemplate` holds the versioned transcription of the supplied 2025 DOCX. Stable keys identify narrative answers. The source document remains unchanged. Version `2025-v3` presents requirements 1–12 in order, with 20 answer boxes. Requirements 1, 3–6, 11, and 12 are headings for their lettered subitems; #4 has separate hiring and admissions answers. Requirements 2 and 7–10 each have one answer box. Versions `2025-v1` and `2025-v2` remain available for submitted history and printing. Existing editable drafts move to v3 without losing answers. Earlier combined GFPS or Equal Opportunity answers appear as read-only notes, and old draft attachments are invalidated so a corrected signed copy can be uploaded.

Reports have a unique HEI/academic-year/semester key. Academic years are consecutive years, entered as `2026-2027`; semesters are first and second. Narrative answers, address, date, and signatory names may remain blank when saving, attaching a PDF, or submitting. The signed PDF and confirmation are required for submission. An HEI can explain non-applicability in a narrative field.

Institution identity and geographic names are snapshotted at report creation and carried into revisions, so the name printed for signing does not change underneath an uploaded document. Report routing remains with that original regional office if directories later move an institution. Historical records are retained through restrictive directory foreign keys.

Draft and returned reports are editable by colleagues from the same HEI. Every mutation checks `lock_version` atomically. Stale requests fail with a reload message rather than overwriting current work. Submitted/reviewed answers are locked. Returning a report requires a comment and copies the answers into a new unsigned draft using the current template. Signed attachments are never copied into a new revision.

Changes to answers, address, date, or signatory names invalidate and remove the draft attachment after the transaction commits. Replacing a draft attachment removes the previous draft file. Submitted attachments are retained. File routes authorize the report and verify that the requested revision belongs to it.

The module uses Form Requests, policies, `ManageMonitoringReport`, and `MonitoringReportResource`. The browser receives stable status codes and revision shapes defined in `resources/js/types/monitoring.ts`. No public API, anonymous submissions, emails, deadlines, deletion workflow, or old PDF import is introduced.

## Checks

```text
php artisan test --compact
npm run types:check
npm run check
npm run test:frontend
npm run build
npx playwright test tests/browser/monitoring.spec.ts tests/browser/dashboard.spec.ts tests/browser/settings-appearance.spec.ts
```

Browser fixtures use a temporary SQLite database and separate private uploads. They do not populate the application database. Screenshots and a long-answer print PDF are produced under `test-results`.
