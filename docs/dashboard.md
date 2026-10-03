# Staff dashboard

`/dashboard` gives CHED staff the network's figures for the places their office covers. HEI accounts get the HEI home on the same route instead.

**Where things live**

| Piece             | File                                                                                      |
| ----------------- | ----------------------------------------------------------------------------------------- |
| Controller (thin) | `DashboardController`                                                                     |
| Filters           | `DashboardFilterRequest`                                                                  |
| Figures           | `App\Services\DashboardStatistics`, with `GoalStatistics` for the SDGs and A.C.H.I.E.V.E. |
| Places in view    | `App\Support\DashboardScope`                                                              |
| Periods           | `App\Support\ReportingPeriod`                                                             |
| Page              | `resources/js/pages/dashboard.tsx` and `components/dashboard/`                            |

## What is in view

**Office.** A regional office sees its own region; the `region` filter is ignored for it. The Central Office (`national_access`) sees every region and may pick one. Staff without an office see empty figures and a notice.

**Where records belong**

- **HEIs:** an HEI's posts, accounts and survey responses belong to its region, through HEI → cluster → region.
- **CHED posts:** a CHED staff member's post belongs to their office's region (`users.survey_region_id`). It counts in that region's figures and in a "{Region} office" row of the goals heatmap, but never for a school.
- **Central Office posts** belong to no region, so they count only in national figures.
- **Survey responses** keep the region, cluster and HEI they were given. A response that names no place counts only nationally.

**Filters**

- **HEI or ownership** narrows everything to HEIs, so CHED posts and staff accounts drop out.
- **Law survey** narrows only the survey figures.

## Periods

Periods follow `AcademicPeriod`:

- **Academic year:** August to July. It defaults to the current one.
- **Semesters:** the 1st runs August to December, the 2nd January to July.
- **Months:** any month of the year.

Times are cut in Philippine time, and timestamps are stored in UTC (`ReportingPeriod::utcBounds()`).

**Comparisons** are with the period before: the previous academic year, the other semester, or the previous month.

**The participation chart** shows months for a year or semester, and five-day spans for a month. It switches between survey responses (from the tallies) and posts shared. Posts shared means original posts, the same count as the GAD posts card, with shares left out.

## What each figure counts

**Top cards**

| Figure             | Counts                                                                                                                    |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| Survey responses   | Responses to the law surveys, from the tallies (below)                                                                    |
| Participating HEIs | Active HEIs in view with at least one response in the period, out of all active HEIs in view                              |
| GAD posts          | Original posts in the period, and how many carry an SDG or A.C.H.I.E.V.E. item. Shares never count.                       |
| Accounts           | Active accounts in view, accounts created in the period, accounts awaiting approval, and HEI (has an institution) vs CHED |

**Every campus counts.** Participation per region, when more than one region is in view. Otherwise it shows the first five HEIs yet to contribute, by name, and how many more there are.

**Goals.** Original posts per SDG and per A.C.H.I.E.V.E. item (`post_sdgs`, `post_achieve_items`). A post carries up to three of each, so goal counts add up to more than posts.

- **Heatmap rows** depend on what is in view:
    - **national:** regions, listed even at zero when they have HEIs
    - **one region:** its 10 HEIs with the most tagged posts, plus its CHED office
    - **one HEI:** none
- **Top HEIs:** the five HEIs with the most posts overall and per goal, from `ROW_NUMBER()` over the grouped counts. HEI posts only.

**Community.** Reactions, comments and shares made in the period on posts in view, and the HEIs that posted.

**Who shares the work.** Original posts in the period by who posted them: `public` or `private` HEIs, `unrecorded` (an HEI with no ownership on file) and `ched` (CHED offices). Only sources with posts are sent.

**Whose voices.** Responses by respondent group and by sex. Every active group, and every sex answer the forms offer, is sent even at zero, so each keeps its place, and its colour, in the charts. Unanswered responses come last as "Not given".

**People on PHLGADIS.** The Accounts figures as a donut: HEI accounts, CHED staff and accounts awaiting approval.

**Events.** The next four events, whatever the filters.

## Survey tallies

Survey responses are personal data. Each survey keeps them only for its retention period (5 years by default), after which `surveys:prune-expired` deletes them. Statistics must outlive that, so the dashboard never counts `survey_responses` directly.

`survey_response_tallies` holds counts only: one row per Philippine day, survey, region, cluster, HEI, respondent group and sex. `SurveyResponse::booted()` keeps it in step:

- **Created:** a response adds one, an atomic upsert keyed on a hash of those values (`SurveyResponseTally::add`).
- **Deleted one by one,** such as by an administrator: one is taken back.
- **The prune:** it deletes in bulk, which fires no model events, so pruned responses stay counted.

Anything that writes or deletes responses should go through the model, so the tallies stay right.

## Speed and freshness

- Everything is counted in SQL: grouped counts and window functions, with no per-row PHP loops.
- The payload is cached for 60 seconds (`DashboardStatistics::CACHE_SECONDS`), keyed by the office in view and the filters. Figures can therefore trail by up to a minute.
- Options lists (places, years, surveys) are read fresh each time.

## API

`DashboardStatistics::for($user, $filters)` returns plain arrays: codes, ids and counts, with no internal fields. It can back a read-only `/api/v1/statistics` endpoint behind token authentication with the same `DashboardFilterRequest`. Goal codes are the SDG numbers (`"1"`–`"17"`) and the `App\Enums\AchieveItem` values.
