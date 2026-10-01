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

- [ ] `PortalHeiSync` files every synced HEI under a region named "Regional Office XII". A national sync must file each HEI under its own region.
- [ ] `PortalService` is written as a client for the CHEDRO XII portal only.
- [ ] `SurveySeeder`, `SurveyHeiSeeder` and `SurveyDirectorySeeder` look regions up by the name "Regional Office XII". This is fine for seeding Region XII, but no runtime code may look a region up by name.
- [ ] The demo figures in `components/dashboard/dashboard-data.ts` use Region XII cluster names. Replace them with real, region-filtered statistics.

**Keep as is.** Word-for-word copies of old-system text that mention Region XII:

- `data/about-content.ts`
- `data/faq.ts`
- `data/herstory.ts`

## Missing for national scope

- [ ] **Staff scope in every module.** Since 2026-09-29 each staff account has an office (Settings → Users → Office): one region (`users.survey_region_id`) or the Central Office (`users.national_access`). HEI users still reach a region through HEI → cluster → region.
    - Done: monitoring reports use it (`BelongsToRegion::scopeWithinReachOf`, `User::reachesRegion`).
    - Done: user management places and manages accounts only within the manager's office.
    - Done: activity logs (2026-10-01). Each entry is placed by its record, or by the person who acted, and is read through `ActivityLogFilterRequest` and `ActivityLogResource` (`docs/activity-logs.md`).
    - Still to limit to the staff member's region:
        - account approval
        - directories
        - survey responses and exports
        - events
        - community moderation
        - statistics
        - site ratings
- [ ] **Office details per region:** the letterhead is in data since 2026-09-29 (`survey_regions.office_city`, `office_address`, `office_email`, `office_website`, `office_phone`; Settings → Regions → Office details) and prints on monitoring reports. `resources/js/data/contact.ts` (the footer and FAQ hotline) still hard-codes Region XII and should read the viewer's office instead.
- [ ] **Filters and exports:** every statistic and export takes a region, cluster and HEI filter.
- [ ] **Philippine time:** dates show in Asia/Manila time throughout. The app timezone stays UTC for storage.

## Missing for the API

- [ ] **No API routes yet:** no `routes/api.php` and no token authentication. Laravel Sanctum is the likely fit.
- [ ] **Few API Resource classes:** only `PostReactorResource` (a post's reactions list, cursor-paginated with Laravel's `meta`) so far. Other controllers build arrays inline, for example `SurveyResponseController::serialize` and `SiteRatingManagementController::index`. Move each model's shape into one Resource as it is touched.
- [ ] **Validation is mostly inline** `$request->validate(...)`. Move rules into Form Requests as endpoints are touched, so web and API share them.
- [ ] **First endpoints to offer, read-only:**
    - directories (regions, clusters, HEIs)
    - aggregate survey statistics, never individual responses
    - published events
    - counts of community posts per SDG and per A.C.H.I.E.V.E. item, by region, cluster, HEI and year. Posts store these as codes in `post_sdgs` and `post_achieve_items`, both indexed by code. Count original posts only, since a share carries none of its own.

    Write endpoints come later, behind tokens and the same permissions.

## Suggested order

1. **Now (HEI and admin work before October 1):** follow the rules in every change. Add no new Region XII wording, serialize in one place, and validate with Form Requests where you are already editing.
2. Region scope for staff accounts: the data model, the policies and the query scopes.
3. Region-owned office details, replacing the contact and label constants above.
4. A read-only `/api/v1` for directories and statistics.
