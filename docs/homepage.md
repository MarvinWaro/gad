# PHLGADIS homepage

The `/` route renders the public homepage. Authentication, account settings, and the dashboard retain their existing implementation.

## Content and imagery

- `resources/js/data/phlgadis-demo.ts` contains typed hero slides, demonstration datasets, laws, stories, and resource categories. The enrollment and graduate breakdowns reconcile with the design brief's totals. They are not official program statistics, and the academic year is illustrative.
- Section components accept content through props. Replace fixtures with verified Inertia props when the backend is ready. Do not remove demo labels until the relevant data is verified.
- `MediaPanel` accepts a `MediaReference` with an optional `src` and descriptive `alt`. Without a source, it renders a labeled SVG illustration. Add public paths such as `/images/hero/campus.jpg` to the `heroSlides` entries when approved files arrive; the carousel does not need to be rebuilt.
- The footer uses `/assets/img/gadlogo.png`, while the header uses the compact `/assets/img/gadlogo2.png` lockup. The footer also uses the supplied CHED, Bagong Pilipinas, Freedom of Information, and Transparency Seal marks.
- The four Know Your Rights cards use the matching artwork in `/assets/thumbnails` through typed law records.
- Statistics default to a three-series line chart and also provide grouped bar and accessible table views over the same static fixture data.
- Surveys, feedback, downloads, policies, and article content use preview dialogs. No responses are sent or persisted.

## Design

`resources/css/public.css` contains the scoped light theme and responsive layouts. Its Tailwind color aliases deliberately repeat at the `.public-theme` scope so shadcn controls inherit the public palette, including in portaled dialogs and menus. Account appearance preferences are untouched. Geist fonts are bundled locally.

Statistics share a single selected dataset across cards, chart, and table. Sex filters also apply to the displayed totals and percentages. Only academic years present in the supplied data appear in the selector. `Statistics` accepts `status` and `onRetry` props for future loading/error integration; empty datasets render an explicit empty state.

The hero carousel crossfades every six seconds. Pointer hover, keyboard focus, a hidden/offscreen tab, and reduced-motion preference suspend autoplay. Selecting a thumbnail pauses playback until the visitor explicitly resumes it.

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
