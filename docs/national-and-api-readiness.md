# National and API readiness

PHLGADIS is to hold GAD data for all 17 CHED regions and to be usable by other systems through an API. CHED Regional Office XII runs it first. The rules for new work are in CLAUDE.md under "Build for the whole Philippines, API-first". This file tracks what the code still assumes, as audited on 2026-09-28. Tick items off, or remove them, as they are fixed.

## Region XII still built into the code

**Contacts and office names in UI copy.** These should come from the viewer's region, or the HEI's region, instead:

- [x] The site's own contact (footer, FAQ contact panel, rating thank-you) comes from `config/phlgadis.php` since 2026-10-08: the office running the deployment, set by `PHLGADIS_OPERATOR_*` (shared as `operator`, read through `useOperator()`). `resources/js/data/contact.ts` is gone.
- [x] `resources/js/components/survey/respondent-step.tsx`: the no-institutions note emails the chosen region's own office (`survey_regions.office_email`, sent with the survey's regions), or says to contact the regional office, as registration does (2026-10-08).
- [x] Footer "Powered by …" names the configured operator (2026-10-08).
- [x] Statistics heading "CHEDRO XII Higher Education GAD Statistical Data" (`components/home/statistics.tsx`): since 2026-10-03 the section has a Region select, and the line follows it ("{Region} Higher Education GAD Statistical Data", or "…, all regions").
- [x] The survey confirmation says "ask CHED" (2026-10-08); the rating thank-you and FAQ panel name the configured operator.

**HEI area and community.**

- [x] `CHED_LABEL` is gone (2026-10-08). Staff posts carry their author's office (`office` in `CommunityFeed`), and tagged people and reactors their `affiliation`, both from `User::chedOffice()` / `User::affiliation()`: "CHED {region}" or "CHED Central Office". The staff composer posts as `auth.affiliation`.
- [x] "Region XII community": gone from the composer (2026-09-28), the share dialog, post-card and the HEI home feed heading (2026-09-29), which now name the feed "Gender Mainstreaming".
- [x] `upcoming-events.tsx`, `next-event-card.tsx` and `pages/hei/events.tsx` say "CHED", since events may come from the region or the Central Office (2026-10-08); a deactivated account is told to contact its CHED regional office.

**Data and sync.**

- [x] The directory comes from HEIDA, CHED's national HEI directory, since 2026-10-03. The CHEDRO XII portal sync (`PortalHeiSync`, `PortalService`) is gone. `HeidaDirectorySync` files each HEI under its own region, matched by PSGC code, and its province as the cluster (`docs/heida-sync.md`).
- [ ] **Public surveys send every active HEI with each survey page** (`PublicSurveyController::directories()`): about 2,600 since the HEIDA sync. They should load a region's HEIs once it is picked, as registration and website feedback do. Keep the survey's rule that withholds dead-end regions and clusters.
- [ ] **Settings → Users sends the Central Office every active HEI** for its account form (`UserManagementController`), about 2,600 rows; a regional office gets only its own region's since 2026-10-03. It should load the chosen region's HEIs instead. Since 2026-10-13 the server refuses an HEI outside a regional manager's region when saving.
- [ ] `SurveySeeder`, `SurveyHeiSeeder` and `SurveyDirectorySeeder` look regions up by the name "Regional Office XII". This is fine for seeding Region XII, but no runtime code may look a region up by name.
- [ ] **Enrollment and graduates are imported by file** (Settings → Enrollment & graduates, since 2026-10-03) until CHED's enrollment and graduate APIs exist. They are regional totals by discipline group, so they cannot narrow to an HEI; per-HEI figures need the API (`docs/enrollment-and-graduates.md`).
- [x] The dashboard's demo figures (`components/dashboard/dashboard-data.ts`, with Region XII cluster names) are gone (2026-10-02). It now shows real figures for the viewer's office, filterable by region, cluster, HEI, ownership and law (`docs/dashboard.md`).

**Keep as is.** Word-for-word copies of old-system text that mention Region XII:

- `data/about-content.ts`
- `data/faq.ts`
- `data/herstory.ts`

## Missing for national scope

- [ ] **Staff scope in every module.** Since 2026-09-29 each staff account has an office (Settings → Users → Office): one region (`users.survey_region_id`) or the Central Office (`users.national_access`). HEI users still reach a region through HEI → cluster → region.
    - Done: monitoring reports use it (`BelongsToRegion::scopeWithinReachOf`, `User::reachesRegion`).
    - Done: user management places and manages accounts only within the manager's office. Since 2026-10-04 a regional office's list and actions judge HEI accounts by their HEI's region (`User::regionId()`), not only staff by their office.
    - Done: account approval (2026-10-13). Each region's CHED Focal approves and manages its own region's accounts, and is told only of its region's registrations; the Central Office covers all.
    - Done: survey responses and their CSV export (2026-10-04). A regional office reads its own region's responses only (`SurveyResponse::scopeReachableBy`); those naming no region stay with the Central Office (since 2026-10-14). Exports are formula-safe (`CsvCell`).
    - Done: activity logs (2026-10-01). Each entry is placed by its record, or by the person who acted, and is read through `ActivityLogFilterRequest` and `ActivityLogResource` (`docs/activity-logs.md`).
    - Done: the staff dashboard (2026-10-02). It covers the office's region, or every region for the Central Office, through `App\Support\DashboardScope`. A CHED post counts under its author's office region, and a Central Office post only nationally.
    - Done: website feedback (2026-10-02). It names a region when the sender gives one; that region's office and the Central Office read it, and feedback naming none goes to every office (`SiteFeedback::scopeVisibleTo`). It has its Resource (`SiteFeedbackResource`) and Form Requests (`docs/feedback.md`).
    - Done: notifications (2026-10-01). Staff are told about reports, GAD surveys, registrations and survey answers only for the regions their office covers (`User::scopeReaching`); a survey answer that names no region reaches the Central Office alone (since 2026-10-14), and an HEI's focal persons hear of the answers that chose their HEI. The JSON the bell reads (`NotificationResource`, cursor-paginated) is ready to move under `/api/v1` (`docs/notifications.md`).
    - Done: GAD events (2026-10-15). Each event is for one region (`gad_events.survey_region_id`) or, with none, every region. A regional office's events are always its own region's; the Central Office picks. HEI accounts and regional staff see their region's events and every region's (`GadEvent::scopeVisibleTo`), change only their own region's (`GadEventPolicy`), and a new event is announced to its region's accounts and the Central Office only.
    - Done: event check-in (2026-10-20). Staff check people in at the events they see, today only (`GadEventPolicy::checkIn`, `GadEvent::scopeOpenForCheckIn`). Each check-in keeps the person's region and HEI, and its activity log entry is filed there. One action (`CheckInParticipant`) and one resource (`GadEventCheckInResource`, cursor-paginated) serve the scanner, ready to move under `/api/v1` (`docs/event-check-in.md`).
    - Done: Join (2026-10-22). People join the events they see (`GadEventPolicy::join`); each registration keeps their region and HEI, and its activity log entries are filed there. Staff see who joined only for the events they see; at an event for every region a regional office sees the whole list (since 2026-10-14), and only the Central Office keeps it. There is no cap; counts are SQL counts on indexed columns and the list is paginated. Events have a public ULID for their page. How many joined, and who, is for the event's creator and Administrators (`events.view-registrations`, since 2026-10-13). One action (`ManageEventRegistration`) and one resource each (`GadEventResource`, `EventRegistrationResource`, `JoinedEventResource`), ready to move under `/api/v1` (`docs/event-registration.md`).
    - Done: keeping an event's list by hand, guests, cancelling and certificate requests (2026-10-14). Staff of the event's region add invitees from any region, who see the event without gaining staff powers there; guests without an account have no place and belong to the event's office. Certificates go out by themselves at the event's end (`certificates:release-due`, a scheduled command, in chunks), and who earns one is a SQL count of days. The rules are in actions (`ManageEventRegistration`, `ManageEventGuest`, `CancelEvent`, `CheckInParticipant::undo`, `ManageCertificateRequest`) and each shape in one resource (`EventGuestResource`, `CertificateRequestResource`), ready to move under `/api/v1`.
    - Done: event certificates (2026-10-21). Signatories and designs belong to one office (a region's, or the Central Office's for every-region events), and an event uses only its own office's, so a certificate prints only its own office's signatories (`ManageEventCertificate::attach`, `GadEventCertificatePolicy`). Each certificate keeps its holder's region and HEI for filters, and its activity log entries are filed there. The rules are in actions and every shape in one resource, ready to move under `/api/v1`; the public verify page is throttled and shows nothing private (`docs/certificates.md`).
    - Still to limit to the staff member's region:
        - directories
        - community moderation
        - site ratings
- [ ] **Office details per region:** the letterhead is in data since 2026-09-29 (`survey_regions.office_city`, `office_address`, `office_email`, `office_website`, `office_phone`; Settings → Regions → Office details) and prints on monitoring reports. Since 2026-10-09 each region's CHED Focal keeps its own region's details (`region-offices.update`, `SurveyRegionPolicy`); the Central Office keeps every region's. The site's own footer and FAQ contact come from `config/phlgadis.php` (the deployment's operator) since 2026-10-08.
- [ ] **Filters and exports:** every statistic and export takes a region and HEI filter. (Clusters are kept out of sight since 2026-10-03.)
- [ ] **Philippine time:** dates show in Asia/Manila time throughout. The app timezone stays UTC for storage.

- [ ] **"Contains" searches scan their table.** These searches find text anywhere in a name (`LIKE '%…%'`), which no index can serve:
    - Settings → Activity logs (`ActivityLog::scopeFilter`): actor name and record label. Entries are kept forever.
    - People search (`App\Support\PeopleSearch`): names. The users table stays small enough that this is fine.

    Both are fast today. Revisit the activity log search when `activity_logs` passes about a million rows: either a MySQL FULLTEXT index (fast, but it matches whole words and word starts, so "uan" no longer finds "Juan"), or a required date range so the scan stays within the `created_at` index. Kept as is on 2026-10-20 by choice.

- [ ] **Email verification is not enforced.** `User` does not implement `MustVerifyEmail`, so the `verified` middleware lets every account through. That suits instant registration for launch (2026-10-07); revisit once the server's mail is proven.

## Missing for the API

- [ ] **No API routes yet:** no `routes/api.php` and no token authentication. Laravel Sanctum is the likely fit.
- [ ] **Few API Resource classes:** only `PostReactorResource` (a post's reactions list, cursor-paginated with Laravel's `meta`) so far. Other controllers build arrays inline, for example `SurveyResponseController::serialize` and `SiteRatingManagementController::index`. Move each model's shape into one Resource as it is touched.
- [ ] **People are addressed by their integer id.** Done for links since 2026-10-09: every account has a public ULID (`users.ulid`, filled by `HasUlids`), and profiles and follow routes take only that (`/people/{person:ulid}`); a number gives 404. Still to do: page data keeps the integer `id` beside `ulid` for tagging, badge awards and keys. Before `/api/v1` exposes people, send the ULID alone.
- [ ] **Validation is mostly inline** `$request->validate(...)`. Move rules into Form Requests as endpoints are touched, so web and API share them.
- [ ] **First endpoints to offer, read-only:**
    - directories (regions, HEIs)
    - aggregate survey statistics, never individual responses
    - published events: ready since 2026-10-13. The public website lists them through `App\Support\PublicEvents` (which events, by region, those on now first) and `PublicEventResource` (ULID, no internal id, nothing about who joined), so `/api/v1/events` can reuse both.
    - counts of community posts per SDG and per A.C.H.I.E.V.E. item, by region, HEI and year. Posts store these as codes in `post_sdgs` and `post_achieve_items`, both indexed by code. Count original posts only, since a share carries none of its own.

    Write endpoints come later, behind tokens and the same permissions.

## Suggested order

1. **Now (HEI and admin work before October 1):** follow the rules in every change. Add no new Region XII wording, serialize in one place, and validate with Form Requests where you are already editing.
2. Region scope for staff accounts: the data model, the policies and the query scopes.
3. Region-owned office details, replacing the contact and label constants above.
4. A read-only `/api/v1` for directories and statistics.
