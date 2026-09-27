# PHLGADIS homepage

The `/` route renders the public homepage. Authentication, account settings, and the dashboard retain their existing implementation.

## Content and imagery

- `resources/js/data/phlgadis-demo.ts` contains typed hero slides, demonstration datasets, laws, stories, and resource categories. The enrollment and graduate breakdowns reconcile with the design brief's totals. They are not official program statistics, and the academic year is illustrative.
- Section components accept content through props. Replace fixtures with verified Inertia props when the backend is ready. Do not remove demo labels until the relevant data is verified.
- `MediaPanel` accepts a `MediaReference` with an optional `src` and descriptive `alt`. Without a source, it renders a labeled SVG illustration. Add public paths such as `/images/hero/campus.jpg` to the `heroSlides` entries when approved files arrive; the carousel does not need to be rebuilt.
- The footer uses `/assets/img/gadlogo.png`, while the header uses the compact `/assets/img/gadlogo2.png` lockup. The footer also uses the supplied CHED, Bagong Pilipinas, Freedom of Information, and Transparency Seal marks.
- The four Know Your Rights cards use the matching artwork in `/assets/thumbnails` through typed law records.
- Statistics default to a three-series line chart and also provide grouped bar and accessible table views over the same static fixture data.
- The hero keeps its static fixtures as a fallback. Active records from the permission-protected carousel manager replace those fixtures in display order.
- Surveys, feedback, downloads, policies, and article content use preview dialogs. No responses are sent or persisted.
- The Definition of Terms resource card opens `/resources/definition-of-terms` (`pages/resources/definition-of-terms.tsx`). Its 19 terms live in `resources/js/data/definition-of-terms.ts`, quoted from the definition sections of RA 9262 (Sec. 3), RA 9710 (Sec. 4) and RA 11313 (Sec. 3) and grouped by Act. Each group links to the Act's full text: the PDFs in `public/assets/document/` for RA 9710 and RA 11313, and LawPhil for RA 9262, whose local `ra9262.pdf` is an information brochure rather than the Act. Search and highlighting are pure functions in `resources/js/lib/glossary.ts`. The other four cards stay static; give a `ResourceRecord` an `href` and `summary` when its page exists.
- The GAD Enabling Republic Acts card opens `/resources/gad-enabling-republic-acts`, which lists the four laws under the names the old system used ("Anti-Sexual Harassment Law", "VAWC", "Magna Carta of Women", "Safe Spaces Act"). Each row shows the Act's Section 1 short title and approval date (both checked on LawPhil), links to its full text, and links to its terms in Definition of Terms. RA 9262 also links the information brochure in `ra9262.pdf`. Both pages share `ResourcePage` (`components/resources/resource-page.tsx`) for the header, back link, intro and footer.
- The Issuances card opens `/resources/issuances`, which lists CMO No. 01 S. 2015 and CMO No. 3 S. 2022 with their titles exactly as the old system showed them (`resources/js/data/issuances.ts`). Each row links the scanned PDF in `public/assets/document/` with its size, shows the issue date where the document states one (only CMO No. 01 does), and links the laws the document itself names. Recorded file sizes are checked against the files by `tests/frontend/resources.test.ts`.
- The Manuals card opens `/resources/manuals`: the "Enhanced GMEF of CHED 2020 Manual" (`gmef.pdf`, CHED's Enhanced Gender Mainstreaming Evaluation Framework assessment, administered October 1, 2020, on the Philippine Commission on Women toolkit) and the "GAD Capacity Assessment Form Manual" (`gcaf.pdf`, the PCW form). Titles are the old system's; the details and related laws come from the documents (`resources/js/data/manuals.ts`).
- Republic Acts, Issuances and Manuals render their rows with `DocumentRow`, `RelatedLaws` and `DatedFact` (`components/resources/document-row.tsx`) and `DocumentButton` (`resource-page.tsx`).
- GAD Videos has no content yet, as in the old system, so its card stays static ("Content coming soon") until a video manager exists.

## Design

`resources/css/public.css` contains the scoped light theme and responsive layouts. Its Tailwind color aliases deliberately repeat at the `.public-theme` scope so shadcn controls inherit the public palette, including in portaled dialogs and menus. Account appearance preferences are untouched. Geist fonts are bundled locally.

Statistics share a single selected dataset across cards, chart, and table. Sex filters also apply to the displayed totals and percentages. Only academic years present in the supplied data appear in the selector. `Statistics` accepts `status` and `onRetry` props for future loading/error integration; empty datasets render an explicit empty state.

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

Use `npm.cmd` on Windows if PowerShell blocks `npm.ps1`. Frontend calculation tests use Node's TypeScript support (Node 22.18+ or 24). Browser checks use Playwright Chromium; install it with `npx playwright install chromium`. Run Vite or build the frontend before browser tests. The browser configuration starts an isolated Laravel preview at port 8015 and uses an in-memory session driver; it does not require database writes.

If a pre-existing cached Laravel configuration prevents PHP tests from reading their environment, run in PowerShell:

```powershell
$env:APP_CONFIG_CACHE = 'bootstrap/cache/phlgadis-test-config.php'
php artisan test --compact
```

This bypasses the cached configuration for that process without editing `.env` or the application's cached config. The supplied design brief may have pre-existing formatting differences; check implementation files separately if the repository-wide formatter reports that document.

Browser tests cover 375px, 768px, 1280px, and 1536px layouts, shared auth navigation fixtures, statistics controls, anchors, light-theme isolation, keyboard focus restoration, reduced-motion preference, and automated accessibility checks. Screenshots are stored under the ignored `test-results` directory.
