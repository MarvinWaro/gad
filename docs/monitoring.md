# Monitoring reports

The GAD monitoring report replaces the old portal's "Upload Monitoring". The HEI fills in CHED's monitoring form in PHLGADIS, prints it, has it signed, and uploads the signed copy. CHED staff then review it for their region.

## The HEI's three steps

1. **Fill out.** Home → **Monitoring Report** opens the start page (`/monitoring`).
    - The HEI picks an academic year and semester. The defaults are today's period in Philippine time: August–December is the first semester of that year; January–July is the second semester of the year before.
    - Colleagues at an HEI share one report per period. Opening a period that a colleague started continues their report.
    - Answers save as they are typed (`PATCH /monitoring/{report}/draft`), after a short pause, when a field loses focus, when the tab is hidden, and before leaving the page.
    - Any answer may stay blank. CHED's form asks for the actual situation per item, so finalizing first lists what is blank.
2. **Print and sign.** **Finalize for signing** locks the answers and gives the revision a document code, such as `A101-7BF7`.
    - **Download PDF for signing** builds the official form in the browser. Staff print it on 8.5 × 13 in (long bond) paper, and the President and the GAD Focal Person sign over their printed names.
    - **Edit answers** unlocks the report again. The code is cleared, so copies already printed no longer match.
3. **Upload and submit.** One PDF of the signed pages, up to 20 MB, is sent together with a confirmation that it shows the document code.

**Records** (`/records`) lists the HEI's reports and their review. CHED can **return a report for correction** with a note. That opens the next revision with the same answers, for the HEI to correct, sign and submit again. Earlier revisions, their signed copies and their reviews stay under **History**.

"Reviewed" records that CHED reviewed the report and its signed copy. It does not certify legal compliance, and there is no compliance score.

## The printable form

`resources/js/lib/monitoring-pdf.ts` lays out CHED's Word template (`public/assets/document/CHEDRO_XII_GAD_MONITORING _TEMPLATE_2025.docx`). pdfmake renders it in the browser, loaded only when someone downloads a PDF (`monitoring-pdf-download.ts`).

- **Why pdfmake.** Answers often run over several pages inside one table row, as in the HEIs' own signed copies. PHP's dompdf and mPDF cannot split a row across pages; pdfmake can.
- **Page layout:**
    - 8.5 × 13 in pages with 1 in margins, as in the Word file.
    - The letterhead on every page: the CHED seal, CHED's national lines, the region's office name and city, and Bagong Pilipinas.
    - The footer: the office's address, email, website and phone.
    - Under the footer, a small line with the period, the revision, the document code and "Page N of M".
    - Drafts carry a "DRAFT — NOT FOR SIGNATURE" watermark.
- **What was left out of the Word file:** its last page ("Remove this page before uploading"), an empty row, and a page number that overlapped the footer. "OFFICE OF THE PRESIDE NT" is printed "OFFICE OF THE PRESIDENT", as agreed on 2026-09-29.
- **Fonts.** Word's Arial Narrow and Bookman Old Style cannot be shipped, so these open fonts stand in. They are in `public/fonts/pdf/` with their licences:
    - Liberation Sans Narrow 1.07.5: Arial Narrow's metrics, so lines wrap as in Word. GPLv2 with the font exception, which allows embedding in documents.
    - TeX Gyre Bonum, for the Bookman letterhead. GUST Font License.
    - Liberation Sans 2.1.5, for characters the narrow face lacks, such as ₱. SIL OFL. It downloads only when a report uses one of those characters.
- **Images, used as they are:**
    - the CHED seal, `public/assets/img/ched_logo.png`
    - the Bagong Pilipinas mark with its wordmark, and the envelope and phone icons, copied out of the Word file into `public/assets/img/letterhead/`
- **Letterhead details** come from the report's region (`survey_regions.office_*`), editable in Settings → Regions → **Office details**. A blank field leaves its line out. Region XII's details are seeded from the Word file.

**The document code** is the first eight characters of a SHA-256 over what the signers put their names to: the template version, report, revision, HEI name, period, details and answers (`App\Support\MonitoringDocument`). Reviewers compare it with the printed copy.

## Staff access

Reviewers need two things:

- **Permissions.** `monitoring.view` (the **Monitoring** list in the staff navigation, and the reports) and `monitoring.review` (decisions). `RbacSeeder` gives both to `admin` and `gad-focal-person`.
- **An office.** Set it in Settings → Users → edit → **Office**:
    - **Central Office — all regions** (`users.national_access`)
    - one regional office (`users.survey_region_id`)

    Staff with no office see an empty list and cannot open reports. HEI accounts never hold an office: their region comes through their HEI.

Other offices' accounts are protected:

- Only Central Office staff can grant national access or place accounts in any region. Regional staff place accounts only in their own office.
- Accounts in another office, or in the Central Office, are beyond a regional manager's reach.

The seeded administrator is Central Office staff.

Scoping lives in `App\Models\Concerns\BelongsToRegion` (`withinReachOf`) and `User::reachesRegion()`, ready for other modules to adopt.

## Data and rules

- **One report per HEI, year and semester.** The unique key is `survey_hei_id`, `academic_year`, `semester`.
    - The HEI's name is kept as it was when the report began, since it is printed for signing.
    - The report's cluster and region are fixed at creation, so routing stays with the original office.
- **Statuses** are stable codes: `draft`, `returned`, `submitted`, `reviewed`.
    - "Ready to sign" is derived: the current revision is finalized but not submitted.
    - The page's stage pill shows whose turn it is: amber while the HEI has work to do, brand while CHED reviews, emerald once reviewed.
- **Revisions** hold the details and one answer row per requirement key (`MonitoringTemplate`, version `2025`).
    - Answers are stored exactly as typed (`mediumText`). `bootstrap/app.php` exempts the draft route from trimming.
    - A signed copy exists only on a submitted revision, on the private `monitoring` disk (`storage/app/private/monitoring-files`).
- **Concurrent edits.** Every change claims the report with an update on `lock_version`, the row lock in MySQL and the write lock in SQLite.
    - An autosave writes a field only if it still holds the value its editor started from. Otherwise the field comes back as a conflict: the editor keeps their text and picks **Use their version** or **Keep mine**.
    - Finalizing, unlocking, submitting and reviewing are refused if the report changed since the person loaded it.
- **Signed copies.** `/monitoring/{report}/revisions/{revision}/attachment` downloads the file; `?inline=1` shows it in the reviewer's split view. Both check the report and that the revision belongs to it.
- **Structure.** The code uses Form Requests, `MonitoringReportPolicy` (`create`, `edit`, `view`, `review`, `viewRecords`), the `ManageMonitoringReport` action, and `MonitoringReportResource` / `MonitoringRevisionResource`.
- **Not built.** There is no public API, email, deadline, notification or deletion flow yet.

## Setup

Before launch, migrations are edited in place: run `php artisan migrate:fresh --seed` after pulling. PHP and the web server must accept a 20 MB upload plus overhead (`upload_max_filesize >= 20M`, `post_max_size > 20M`). Back up the `monitoring` disk with the database, and never expose it through a public link.

## Checks

```text
php artisan test --compact tests/Feature/Monitoring tests/Feature/Settings/UserOfficeTest.php tests/Feature/Settings/RegionOfficeTest.php tests/Unit/AcademicPeriodTest.php
node --test tests/frontend/monitoring-pdf.test.ts tests/frontend/monitoring-draft.test.ts
npm run build
npx playwright test tests/browser/monitoring.spec.ts
```

The browser test fills in, finalizes, downloads, signs (by uploading the downloaded PDF), returns, corrects and reviews a report. It saves screenshots and both PDFs under `test-results`.
