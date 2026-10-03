# PHLGADIS homepage

The `/` route renders the public homepage. Authentication, account settings, and the dashboard retain their existing implementation.

## Content and imagery

- "Gender mainstreaming in action" (`#stories`, `Stories` in `components/home/content-sections.tsx`) shows real posts: `App\Support\HomepageStories`.
    - **Which posts:** the year's three most reacted original posts with photos (the current academic year, August to July). Shares never count. Comments and then the newest break ties, so posts with no reactions yet still fill the places.
    - **Who is named:** each story names its HEI, or the CHED office for a staff post (`HomepageStoryResource`), never the person who posted.
    - **The dialog:** "Read story" opens the full text, the photos (the feed's mosaic and photo viewer), goals and counts, with "Log in to react and comment", which leads to the post.
    - **Caching:** the list is cached for 10 minutes. Editing or deleting a post clears the cache at once.
    - **Hiding:** moderators (`posts.moderate`) can "Hide from homepage" from a photo post's ⋯ menu (`PUT /posts/{post}/homepage`, recorded in the activity log). The composer tells authors that photo posts may be featured.
    - **When nothing qualifies:** a short line says what will appear.
- `resources/js/data/phlgadis-demo.ts` contains typed hero slides, laws, and resource categories.
- The statistics section shows real figures since 2026-10-03: the enrollment and graduates regional offices import in Settings → Enrollment & graduates (`docs/enrollment-and-graduates.md`).
    - **Figures:** `App\Support\StudentStatistics::forHomepage()` adds them up by academic year (newest first) and discipline group, and the footnote names the regions and the date of the last import. With no figures, the section shows its empty state.
    - **Region:** a Region select ("All regions", then each region with figures) sits beside Academic year. Choosing one reloads only the `statistics` prop (`/?region={id}`, the home route's props are closures) and keeps the chosen view, kind and filter. The line under the heading follows it: "{Region} Higher Education GAD Statistical Data", or "Higher Education GAD Statistical Data, all regions". It replaced the old site's "CHEDRO XII Higher Education GAD Statistical Data" on 2026-10-03, at the user's request.
    - **Caching:** each region's copy, and the all-regions copy, is cached for 10 minutes and cleared on every import and delete.
- Section components accept content through props. Replace fixtures with verified Inertia props when the backend is ready. Do not remove demo labels until the relevant data is verified.
- `MediaPanel` accepts a `MediaReference` with an optional `src` and descriptive `alt`. Without a source, it renders a labeled SVG illustration. Add public paths such as `/images/hero/campus.jpg` to the `heroSlides` entries when approved files arrive; the carousel does not need to be rebuilt.
- The footer uses `/assets/img/gadlogo.png`, while the header uses the compact `/assets/img/gadlogo2.png` lockup. The footer also uses the supplied CHED, Bagong Pilipinas, Freedom of Information, and Transparency Seal marks.
- The four Know Your Rights cards use the matching artwork in `/assets/thumbnails` through typed law records.
- Statistics have four views over the same figures:
    - **Line** (the default, the old system's chart): male, female and total across the groups in CHED's order, on the shadcn-style `ChartContainer` (`components/ui/chart.tsx`, Recharts). Every group's full name sits under its point at 12px, slanted and on up to two lines (`axisLines` in `lib/gad-statistics.ts`; no word is cut). Each group gets at least 52px, so a screen too narrow for that scrolls the chart sideways inside its card, with a "Swipe the chart sideways" line below 900px.
    - **Counts:** HTML rows, groups by size, largest first, each with a male and a female bar drawn against the longest bar in view and its figure printed beside it. The first ten show, then "Show all N discipline groups".
    - **Balance:** each group's women and men as one bar, women from the start, with a line at an even split, ranked by women's share. The sex filter is hidden here, since a share needs both.
    - **Table:** every figure with totals.

- The hero keeps its static fixtures as a fallback. Active records from the permission-protected carousel manager replace those fixtures in display order.
- Downloads, policies, and article content use preview dialogs. The "Help shape a better PHLGADIS" band's "Share feedback" button, and a "We value your feedback" line in the footer, open the website feedback form at `/feedback` (`docs/feedback.md`).
- The Definition of Terms resource card opens `/resources/definition-of-terms` (`pages/resources/definition-of-terms.tsx`). Its 19 terms live in `resources/js/data/definition-of-terms.ts`, quoted from the definition sections of RA 9262 (Sec. 3), RA 9710 (Sec. 4) and RA 11313 (Sec. 3) and grouped by Act. Each group links to the Act's full text: the PDFs in `public/assets/document/` for RA 9710 and RA 11313, and LawPhil for RA 9262, whose local `ra9262.pdf` is an information brochure rather than the Act. Search and highlighting are pure functions in `resources/js/lib/glossary.ts`. The other four cards stay static; give a `ResourceRecord` an `href` and `summary` when its page exists.
- The GAD Enabling Republic Acts card opens `/resources/gad-enabling-republic-acts`, which lists the four laws under the names the old system used ("Anti-Sexual Harassment Law", "VAWC", "Magna Carta of Women", "Safe Spaces Act"). Each row shows the Act's Section 1 short title and approval date (both checked on LawPhil), links to its full text, and links to its terms in Definition of Terms. RA 9262 also links the information brochure in `ra9262.pdf`. Both pages share `ResourcePage` (`components/resources/resource-page.tsx`) for the header, back link, intro and footer.
- The Issuances card opens `/resources/issuances`, which lists CMO No. 01 S. 2015 and CMO No. 3 S. 2022 with their titles exactly as the old system showed them (`resources/js/data/issuances.ts`). Each row links the scanned PDF in `public/assets/document/` with its size, shows the issue date where the document states one (only CMO No. 01 does), and links the laws the document itself names. Recorded file sizes are checked against the files by `tests/frontend/resources.test.ts`.
- The Manuals card opens `/resources/manuals`: the "Enhanced GMEF of CHED 2020 Manual" (`gmef.pdf`, CHED's Enhanced Gender Mainstreaming Evaluation Framework assessment, administered October 1, 2020, on the Philippine Commission on Women toolkit) and the "GAD Capacity Assessment Form Manual" (`gcaf.pdf`, the PCW form). Titles are the old system's; the details and related laws come from the documents (`resources/js/data/manuals.ts`).
- Republic Acts, Issuances and Manuals render their rows with `DocumentRow`, `RelatedLaws` and `DatedFact` (`components/resources/document-row.tsx`) and `DocumentButton` (`resource-page.tsx`).
- GAD Videos has no content yet, as in the old system, so its card stays static ("Content coming soon") until a video manager exists.
- The header ends its links with a plain "FAQ" link to `/help/faq` (`pages/help/faq.tsx`), after the homepage sections; the phone menu lists it last too. The old system put the FAQ in a one-item "Need Help?" dropdown, which the user asked to drop.
- A "Rate PHLGADIS" button floats at the bottom-left of the homepage (`components/home/rate-widget.tsx`). It opens a card with a 1–5 star rating (radio inputs drawn as stars; 1 = Needs improvement, 5 = Excellent), an optional suggestion of up to 1000 characters, and the note "Anonymous: no name, email, or IP address is stored." `POST /ratings` (`SiteRatingController`) keeps only the stars, the suggestion and the time in `site_ratings`, is throttled like the surveys (5 an hour), and ignores bots that fill a hidden `website` field. Answers appear in Settings → Public site → Site ratings (`settings/ratings`, `SiteRatingManagementController`): average, total, share with a suggestion, a breakdown by stars that filters the list, the list itself with delete, a CSV export (formula-like cells prefixed with an apostrophe), and a switch that hides or shows the button (`site_settings` key `rating_button_enabled`, on until switched off). Permissions: `site-ratings.view` (admin and GAD focal person), `.export`, `.delete` and `.update` (admin).
- The FAQ's text lives in `resources/js/data/faq.ts`: the old page's opening (what PHLGADIS is for, and its eight objectives) and its six questions, taken from phlgadis.chedro12.com/faq and checked against the page's HTML. Three changes were agreed on 2026-09-28. First, the old answer to 'What data do the surveys collect?' said an email is collected; the new survey collects none, so the answer now uses the survey's own wording from its consent step, details step and confirmation page. Second, 'Republic Act 78777' reads 7877. Third, the RA 7877 quote reads 'its human resources', as Section 2 of the Act does. The RA 9262 and RA 11313 quotes match their Section 2 on LawPhil. Answers are native `<details>`, `/help/faq#{id}` opens one (for example `#ra-9262`), and a closing panel offers CHED RO XII's hotline and email (`resources/js/data/contact.ts`, the same source as the footer).
- The homepage About section (`#about`) shows five cards, like Resources, through the shared `LinkCards` (`components/public/link-cards.tsx`): GAD Herstory, Organizational Chart, What is PHLGADIS? (overview and logo), A.C.H.I.E.V.E. Agenda and Sustainable Development Goals. Organizational Chart opens `/about#organization`: the three leadership roles, five members and 27 secretariat names are transcribed from the old-system screenshots supplied on 2026-09-29 into `resources/js/data/organization.ts`. The chart uses connected leadership cards and responsive name lists, with the same content in light and dark themes. Topics live in `resources/js/data/about.ts`.
- `/about` (`pages/about.tsx`) is one page with five tabs on a bar pinned under the site header: What is PHLGADIS?, The Logo, Organizational Chart, A.C.H.I.E.V.E. Agenda and Sustainable Development Goals (shadcn `Tabs` on `@radix-ui/react-tabs`). The URL hash names the tab, so a card opens its tab (`/about#achieve`) and switching tabs updates the hash. Switching while the bar is pinned starts the new panel right under it; on phones the bar scrolls sideways and keeps the chosen tab in view. A panel after the tabs links to the GAD Herstory timeline. The SDG tab shows the 17 goals six a row (five on tablets, three on phones) as 320px WebP copies of the 1500px tiles (`public/assets/sdg/web/`, 147 KB for all 17 instead of 804 KB and far less to decode; the originals stay in `public/assets/sdg/`). Each tile links, in a new tab, to its goal's page on un.org/sustainabledevelopment: the addresses the old PHLGADIS SDG page used, all 17 checked on 2026-09-28 (`sustainableGoals` in `resources/js/data/sdgs.ts`, shared with the HEI feed's post goals). Hover or keyboard focus darkens the tile and shows "Read more".
- The What is PHLGADIS? and The Logo tabs carry the old site's full text (`resources/js/data/about-content.ts`, from phlgadis.chedro12.com/phlgadis and /logo, checked word for word against their HTML). The live page spells the system 'PHILGADIS' twice; this follows the user's copy, which reads PHLGADIS. The old Logo page split one sentence about the PHLGADIS logo over three paragraphs; here it is one. Its bold terms stay bold. The source's last CHED-logo sentence ends mid-thought ('The CHED is an attached.') and is kept as written until CHED RO XII supplies the full wording. On the Logo tab each logo sits beside its text and, from 901px, holds its place under the pinned tab bar while the text scrolls.
- The A.C.H.I.E.V.E. Agenda tab lists CHED's four thrusts and three enablers (`resources/js/data/achieve.ts`) as lettered tiles, blue for thrusts and red for enablers, as CHED's site shows them, under the CHED and Bagong Pilipinas seals. ched.gov.ph/achieve-agenda turns away automated requests, so the text was copied word for word from a screenshot of it on 2026-09-28 (the thrust descriptions also match a search snippet); 'efficient,transparent' is CHED's own spacing. The per-item 'Learn More' addresses could not be checked, so one button links to the agenda page instead. The header also shows the official ACHIEVE mark: `public/assets/img/achieve.png` as supplied (3750px, 1.2 MB), served as `achieve-mark.png`, the same mark trimmed of its transparent margin and resized to 480px (74 KB). In dark mode it sits on a white plate because its lettering is transparent-backed.
- GAD Herstory opens `/about/gad-herstory` (`pages/about/gad-herstory.tsx`), a timeline laid out after shadcnblocks' timeline4, rebuilt without Framer Motion. Steps alternate either side of a centre line; each has a date, a title and the old text, with its photo (or its year) in a hatched frame. The line fills in brand purple as the reader scrolls (`useScrollProgress` in `hooks/use-scroll-progress.ts`, which sets `--scroll-progress` without re-rendering). Below 900px it becomes one column with the line on the left. The 13 entries in `resources/js/data/herstory.ts` are the old site's timeline (phlgadis.chedro12.com/gad_herstory), checked word for word against its HTML, with three changes agreed on 2026-09-28: 'RA 92622' reads RA 9262, 'educations sector' reads education sector, and the old page's shorter, repeated March 2010 'Magna Carta of Women' entry is left out.
- Resource, help and About pages share the `PublicPage` frame (`components/public/public-page.tsx`): header, back link, intro and footer. `ResourcePage` is that frame labelled Resources.

## Design

`resources/css/public.css` contains the public theme and responsive layouts. Its Tailwind color aliases deliberately repeat at the `.public-theme` scope so shadcn controls inherit the public palette, including in portaled dialogs and menus. Geist fonts are bundled locally.

The public site follows the same appearance setting as the dashboard:

- `useAppearance` saves the choice, and the Blade view sets `html.dark` before first paint.
- `.dark .public-theme` swaps in the dark palette. It applies on screen only, so printouts stay light.
- The header has the dashboard's light/dark toggle (`ThemeToggle`, shared with `HeaderActions`).
- In dark mode the header logo sits on a white plate, because `gadlogo2.png` is transparent inside its frame. The file itself is never changed.
- Below 940px the header folds into the menu sheet, because the full row needs about 910px.

Statistics share a single selected dataset across cards, rows, and table. Sex filters also apply to the displayed totals and percentages. Only academic years present in the supplied data appear in the selector. `Statistics` accepts `status` and `onRetry` props for future loading/error integration; empty datasets render an explicit empty state.

The hero carousel's frame is a 16:9 landscape (3:2 on phones), capped at 75% of the screen height and never shorter than the original strip. Its notched top edge is a fixed-height mask layer over a plain body, so the notch and corners keep their size however tall the frame grows (`tests/browser/hero.spec.ts`). The carousel crossfades every six seconds. Pointer hover, keyboard focus, a hidden/offscreen tab, and reduced-motion preference suspend autoplay. Selecting a thumbnail pauses playback until the visitor explicitly resumes it.

## Development and checks

```text
npm run dev
npm run build
npm run types:check
npm run check
npm run test:frontend
npm run test:browser
php artisan test
```

Use `npm.cmd` on Windows if PowerShell blocks `npm.ps1`. Frontend calculation tests use Node's TypeScript support (Node 22.18+ or 24). Browser checks use Playwright Chromium; install it with `npx playwright install chromium`. Run Vite or build the frontend before browser tests. The browser configuration starts an isolated Laravel preview at port 8016 (`tests/browser/server.php`) with its own temporary SQLite database and uploads folder. Photos posted during a run are served from that folder as `/storage/...` and never land in `storage/app/public`; both are removed when the run ends.

Sessions, the cache and the queue can run on the database (the default in `.env.example`) or on Redis.

- **Switching to Redis:** set `SESSION_DRIVER`, `CACHE_STORE` and `QUEUE_CONNECTION` to `redis`. PHP tests and the browser preview keep their own in-memory drivers, so they never need Redis.
- **PHP client:** the `predis/predis` package works where PHP has no `phpredis` extension (`REDIS_CLIENT=predis`), for example on Windows.
- **Sharing one Redis server:** apps that share it each need their own `REDIS_DB` and `REDIS_CACHE_DB`, because `php artisan cache:clear` empties a whole database.
- **On a server,** Redis holds logins and queued jobs, not just cache:
    - Run it with `maxmemory-policy noeviction` and append-only persistence, so it never drops a session or a job to free memory, and a restart keeps them.
    - Bind it to localhost with a password.

If a pre-existing cached Laravel configuration prevents PHP tests from reading their environment, run in PowerShell:

```powershell
$env:APP_CONFIG_CACHE = 'bootstrap/cache/phlgadis-test-config.php'
php artisan test --compact
```

This bypasses the cached configuration for that process without editing `.env` or the application's cached config. The supplied design brief may have pre-existing formatting differences; check implementation files separately if the repository-wide formatter reports that document.

Browser tests cover 375px, 768px, 1280px, and 1536px layouts, shared auth navigation fixtures, statistics controls, anchors, light and dark themes (including the header toggle), the FAQ link and page, keyboard focus restoration, reduced-motion preference, and automated accessibility checks. Screenshots are stored under the ignored `test-results` directory.
