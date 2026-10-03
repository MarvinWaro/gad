# National and API readiness

PHLGADIS is to hold GAD data for all 17 CHED regions and to be usable by other systems through an API. CHED Regional Office XII runs it first. The rules for new work are in CLAUDE.md under "Build for the whole Philippines, API-first". This file tracks what the code still assumes, as audited on 2026-09-28. Tick items off, or remove them, as they are fixed.

## Region XII still built into the code

**Contacts and office names in UI copy.** These should come from the viewer's region, or the HEI's region, instead:

- [ ] `resources/js/data/contact.ts`: the RO XII hotline and email. The footer and the FAQ contact panel read it.
- [ ] `resources/js/components/survey/respondent-step.tsx`: hard-coded `mailto:chedro12@ched.gov.ph`. It doesn't use `contact.ts`. (Settings → Profile now names the account's own regional office from `survey_regions.office_email`.)
- [ ] Footer "Powered by CHEDRO XII" (`components/public/site-layout.tsx`).
- [ ] Statistics heading "CHEDRO XII Higher Education GAD Statistical Data" (`components/home/statistics.tsx`).
- [ ] "CHEDRO XII" or "CHED Regional Office XII" in:
    - the survey confirmation (`pages/surveys/show.tsx`)
    - the rating thank-you (`components/home/rate-widget.tsx`)
    - the FAQ contact panel (`pages/help/faq.tsx`)

**HEI area and community.**

- [ ] `CHED_LABEL = 'CHED Regional Office XII'` (`lib/ched-label.ts`, one definition since 2026-09-29) labels staff posts, tags and reactors. It should come from the author's office, which staff accounts now carry (`users.survey_region_id`, or `national_access` for the Central Office).
- [x] "Region XII community": gone from the composer (2026-09-28), the share dialog, post-card and the HEI home feed heading (2026-09-29), which now name the feed "Gender Mainstreaming".
- [ ] "CHED Regional Office XII" or "Region XII" in:
    - `welcome-band.tsx`
    - `upcoming-events.tsx`
    - `next-event-card.tsx`
    - `pages/hei/events.tsx`
    - `pages/community/index.tsx` (the composer's CHED label and placeholder)

**Data and sync.**

- [x] The directory comes from HEIDA, CHED's national HEI directory, since 2026-10-03. The CHEDRO XII portal sync (`PortalHeiSync`, `PortalService`) is gone. `HeidaDirectorySync` files each HEI under its own region, matched by PSGC code, and its province as the cluster (`docs/heida-sync.md`).
- [ ] **Public surveys send every active HEI with each survey page** (`PublicSurveyController::directories()`): about 2,600 since the HEIDA sync. They should load a region's HEIs once it is picked, as registration and website feedback do. Keep the survey's rule that withholds dead-end regions and clusters.
- [ ] **Settings → Users sends the Central Office every active HEI** for its account form (`UserManagementController`), about 2,600 rows; a regional office gets only its own region's since 2026-10-03. It should load the chosen region's HEIs instead. The server does not yet refuse an HEI outside the manager's region when saving.
- [ ] `SurveySeeder`, `SurveyHeiSeeder` and `SurveyDirectorySeeder` look regions up by the name "Regional Office XII". This is fine for seeding Region XII, but no runtime code may look a region up by name.
- [x] The dashboard's demo figures (`components/dashboard/dashboard-data.ts`, with Region XII cluster names) are gone (2026-10-02). It now shows real figures for the viewer's office, filterable by region, cluster, HEI, ownership and law (`docs/dashboard.md`).

**Keep as is.** Word-for-word copies of old-system text that mention Region XII:

- `data/about-content.ts`
- `data/faq.ts`
- `data/herstory.ts`

## Missing for national scope

- [ ] **Staff scope in every module.** Since 2026-09-29 each staff account has an office (Settings → Users → Office): one region (`users.survey_region_id`) or the Central Office (`users.national_access`). HEI users still reach a region through HEI → cluster → region.
    - Done: monitoring reports use it (`BelongsToRegion::scopeWithinReachOf`, `User::reachesRegion`).
    - Done: user management places and manages accounts only within the manager's office.
    - Done: activity logs (2026-10-01). Each entry is placed by its record, or by the person who acted, and is read through `ActivityLogFilterRequest` and `ActivityLogResource` (`docs/activity-logs.md`).
    - Done: the staff dashboard (2026-10-02). It covers the office's region, or every region for the Central Office, through `App\Support\DashboardScope`. A CHED post counts under its author's office region, and a Central Office post only nationally.
    - Done: website feedback (2026-10-02). It names a region when the sender gives one; that region's office and the Central Office read it, and feedback naming none goes to every office (`SiteFeedback::scopeVisibleTo`). It has its Resource (`SiteFeedbackResource`) and Form Requests (`docs/feedback.md`).
    - Done: notifications (2026-10-01). Staff are told about reports, GAD surveys, registrations and survey answers only for the regions their office covers (`User::scopeReaching`); a survey answer that names no region reaches everyone who may read responses. The JSON the bell reads (`NotificationResource`, cursor-paginated) is ready to move under `/api/v1` (`docs/notifications.md`).
    - Still to limit to the staff member's region:
        - account approval
        - directories
        - survey responses and exports
        - events
        - community moderation
        - site ratings
- [ ] **Office details per region:** the letterhead is in data since 2026-09-29 (`survey_regions.office_city`, `office_address`, `office_email`, `office_website`, `office_phone`; Settings → Regions → Office details) and prints on monitoring reports. `resources/js/data/contact.ts` (the footer and FAQ hotline) still hard-codes Region XII and should read the viewer's office instead.
- [ ] **Filters and exports:** every statistic and export takes a region and HEI filter. (Clusters are kept out of sight since 2026-10-03.)
- [ ] **Philippine time:** dates show in Asia/Manila time throughout. The app timezone stays UTC for storage.

## Missing for the API

- [ ] **No API routes yet:** no `routes/api.php` and no token authentication. Laravel Sanctum is the likely fit.
- [ ] **Few API Resource classes:** only `PostReactorResource` (a post's reactions list, cursor-paginated with Laravel's `meta`) so far. Other controllers build arrays inline, for example `SurveyResponseController::serialize` and `SiteRatingManagementController::index`. Move each model's shape into one Resource as it is touched.
- [ ] **Validation is mostly inline** `$request->validate(...)`. Move rules into Form Requests as endpoints are touched, so web and API share them.
- [ ] **First endpoints to offer, read-only:**
    - directories (regions, HEIs)
    - aggregate survey statistics, never individual responses
    - published events
    - counts of community posts per SDG and per A.C.H.I.E.V.E. item, by region, HEI and year. Posts store these as codes in `post_sdgs` and `post_achieve_items`, both indexed by code. Count original posts only, since a share carries none of its own.

    Write endpoints come later, behind tokens and the same permissions.

## Suggested order

1. **Now (HEI and admin work before October 1):** follow the rules in every change. Add no new Region XII wording, serialize in one place, and validate with Form Requests where you are already editing.
2. Region scope for staff accounts: the data model, the policies and the query scopes.
3. Region-owned office details, replacing the contact and label constants above.
4. A read-only `/api/v1` for directories and statistics.
