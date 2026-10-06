# Survey analytics

Public site → Surveys (`/admin/surveys`) opens with **Survey insights**, above the Survey library, and each law survey has a **Summary** of its answers (`/admin/surveys/{id}/summary`), beside its Responses. Built 2026-10-05.

## Survey insights (the Surveys page)

For everyone who can open Surveys (`surveys.view`): administrators, GAD Focal Persons and, read-only, CHED Focals (since 2026-10-05). Counts only, never a respondent.

- **Filters:** the dashboard's own: academic year, then Whole year, Semester or Month, then Region (Central Office only), HEI, Ownership and Law survey (`DashboardFilterBar`, `DashboardFilterRequest::staffRules()`).
- **Figures:**
    - **Tiles:** responses, with the change against the period before; participating HEIs out of the active HEIs in view; the female share; and the surveys live now (published and not archived).
    - **Responses over time:** the period's buckets, with a table view.
    - **Whose voices:** respondent group and sex.
    - **Responses by law:** each law links to its Summary.
    - **Where responses come from:** regions when every region is in view, otherwise the 10 HEIs with the most responses.
- **Loading:** the figures arrive just after the page (a deferred prop) and are cached for a minute, like the dashboard. The filters come with the page, so they stay put meanwhile.

## Summary (one survey)

For everyone who can open Surveys (`surveys.view`), since it holds counts only. Single responses need `survey-responses.view`, and only accounts holding it get the Summary | Responses tabs: administrators, for every region, and since 2026-10-14 each CHED Focal, for its own region's responses only (`SurveyResponse::scopeReachableBy`). Export and delete stay with administrators. It reads like Google Forms' summary: every question with each answer's count, its share of the respondents in view, a bar, and how many were female and male.

- **Answers:**
    - **Experiences:** each one, ending with "I have not experienced any of the above". Each folds out "Who was responsible": the perpetrators chosen for it.
    - **Check-all-that-apply questions:** each choice.
    - **"Answering for"** (RA 9262 only).
- **About the respondents:** sex, respondent group, age in bands (under 18, 18–24, 25–34, 35–44, 45–59, 60 and over) and gender identity.
- **Filters:** the period and places, plus Sex and Respondent group.
- **"View data"** on every card swaps the bars for a table of the same figures.
- **Labels** come from the survey's published questionnaire (or its newest draft). Answers it no longer offers keep a readable name.
- **Not yet:** a respondent group's own follow-up answers (`survey_group_answers`).

### Anonymity

**Answers show only when at least 5 responses are in view** (`SurveyStatistics::MIN_RESPONSES`). Below that, the totals still show, and a notice asks to widen the filters. Narrowing to one HEI, one sex or one group can never single out a respondent's answers.

**Responses naming no region** (where a questionnaire lets respondents skip it) belong to no region. They count only in the overall figures, where "Where responses come from" lists them as "Not given", never in a region's. Only the Central Office reads them one by one or is told of them.

## Where the figures come from

- **Totals** come from `survey_response_tallies`, as on the dashboard (`docs/dashboard.md`).
- **Answers** come from `survey_answer_tallies` (`App\Models\SurveyAnswerTally`). It counts each answer by day (Philippine time), survey, region, HEI, respondent group and sex, never by person.
    - **Question codes:**
        - `experiences`
        - `perpetrators` (the experience, then who was responsible)
        - `selections.{question}`
        - `answering_for`
        - `age_band`
        - `gender_identity`
    - **Kept in step:** a response adds its answers when created and takes them back when deleted one by one. The retention prune deletes in bulk, which fires no events, so **charts never shrink when old responses expire.**
    - **Backfill:** the migration (`2026_10_09_000000_create_survey_answer_tallies_table.php`) counts the responses already kept.
- **Where the code lives:**
    - `App\Services\SurveyStatistics` is the one place for survey figures: the dashboard's, the insights and the Summary.
    - Places follow `DashboardScope`: a regional office sees its own region, the Central Office every region, and staff without an office see an empty state.

## Checks

`tests/Feature/Surveys/SurveyAnalyticsTest.php`, `tests/browser/survey-insights.spec.ts` (it reads five RA 9262 answers seeded in AY 2025-2026), and the Summary in `tests/browser/mobile.spec.ts`.
