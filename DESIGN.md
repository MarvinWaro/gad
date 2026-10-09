---
version: 1.0
name: PHLGADIS design system
description: A calm, editorial civic-data interface for the Philippine Higher Education Gender and Development Information System. White canvas and dark-ink type carry the structure; the brand comes from the PHLGADIS logo (GAD purple with Philippine-flag blue and red), used sparingly on signature surfaces. Primary actions are near-black; type is Instrument Sans at modest weights. Layout grammar adapted from Airtable's editorial system; palette and type are PHLGADIS's own.

colors:
    ink: '#181d26'
    primary: '#181d26'
    body: '#333840'
    muted: '#41454d'
    canvas: '#ffffff'
    surface-soft: '#faf8f5'
    surface-strong: '#ebe7e0'
    hairline: '#e6e1d9'
    border-input: '#958f86'
    brand: '#7030a8'
    brand-soft: '#f1eaf8'
    signature-violet: '#3b1a5c'
    signature-red: '#ce1126'
    signature-cream: '#f5e9d4'
    callout: '#fce6ee'
    signature-mustard: '#d9a441'
    flag-blue: '#0038a8'
    link: '#1b61c9'
    on-primary: '#ffffff'
    on-signature: '#ffffff'

dark:
    background: '#141217'
    card: '#1a1820'
    muted-surface: '#24212a'
    border: '#2e2a35'
    foreground: '#f4f1ec'
    muted: '#a8a3ad'
    brand: '#b58ce0'
    signature-violet: '#2a1740'
    signature-red: '#ef5a66'
    signature-cream: '#2c261d'
    destructive: '#e5484d'

typography:
    display-xl:
        fontFamily: 'Instrument Sans, ui-sans-serif, system-ui, sans-serif'
        fontSize: 48px
        fontWeight: 500
        lineHeight: 1.075
        letterSpacing: -0.015em
    display-lg:
        fontFamily: 'Instrument Sans'
        fontSize: 38px
        fontWeight: 500
        lineHeight: 1.2
        letterSpacing: -0.01em
    display-md:
        fontFamily: 'Instrument Sans'
        fontSize: 32px
        fontWeight: 500
        lineHeight: 1.2
        letterSpacing: -0.01em
    title-lg:
        fontFamily: 'Instrument Sans'
        fontSize: 24px
        fontWeight: 500
        lineHeight: 1.3
    title-md:
        fontFamily: 'Instrument Sans'
        fontSize: 20px
        fontWeight: 500
        lineHeight: 1.4
    title-sm:
        fontFamily: 'Instrument Sans'
        fontSize: 16px
        fontWeight: 500
        lineHeight: 1.5
    body-lg:
        fontFamily: 'Instrument Sans'
        fontSize: 15px
        fontWeight: 400
        lineHeight: 1.6
    body-md:
        fontFamily: 'Instrument Sans'
        fontSize: 14px
        fontWeight: 400
        lineHeight: 1.5
    button:
        fontFamily: 'Instrument Sans'
        fontSize: 14px
        fontWeight: 500
        lineHeight: 1.4
    caption:
        fontFamily: 'Instrument Sans'
        fontSize: 12px
        fontWeight: 400
        lineHeight: 1.45

rounded:
    sm: 6px
    md: 10px
    lg: 12px
    full: 9999px

spacing:
    xxs: 4px
    xs: 8px
    sm: 12px
    md: 16px
    lg: 24px
    xl: 32px
    xxl: 48px
    section: 96px

components:
    button-primary:
        backgroundColor: '{colors.primary}'
        textColor: '{colors.on-primary}'
        typography: '{typography.button}'
        rounded: '{rounded.lg}'
        height: 44px
    button-outline:
        backgroundColor: '{colors.canvas}'
        textColor: '{colors.ink}'
        border: '1px {colors.border-input}'
        typography: '{typography.button}'
        rounded: '{rounded.lg}'
        height: 44px
    button-destructive:
        backgroundColor: '{colors.signature-red}'
        textColor: '{colors.on-primary}'
        rounded: '{rounded.lg}'
    text-input:
        backgroundColor: transparent
        textColor: '{colors.ink}'
        border: '1px {colors.border-input}'
        rounded: '{rounded.sm}'
        height: 44px
    signature-violet-card:
        backgroundColor: '{colors.signature-violet}'
        textColor: '{colors.on-signature}'
        rounded: '{rounded.lg}'
        padding: 24px
    content-card:
        backgroundColor: '{colors.canvas}'
        textColor: '{colors.ink}'
        border: '1px {colors.hairline}'
        rounded: '{rounded.lg}'
    sidebar-item-active:
        backgroundColor: '{colors.signature-cream}'
        textColor: '{colors.ink}'
        rounded: '{rounded.md}'
---

## Overview

PHLGADIS serves CHED regional staff, HEI GAD focal persons, and students answering anonymous law surveys. The interface should read as **calm, trustworthy, and humane**: a public-sector information system, not a SaaS marketing site.

The structure is editorial: white canvas, dark-ink type, generous whitespace, one near-black primary action per view. The brand is **not** spread across every control. It appears in a few deliberate **signature surfaces**: a deep-violet card and the logo itself.

**Where the colors come from.** Every accent traces back to the PHLGADIS logo:

- **GAD purple** (`{colors.brand}` #7030a8), the "GAD" letters and the logo frame. Purple is also the color of the gender-and-development and women's movements and of Philippine Women's Month.
- **Flag blue** (`{colors.flag-blue}` #0038a8), the "PHL" letters. Used for data series. Interactive blue (links, focus) stays `{colors.link}`.
- **Flag red** (`{colors.signature-red}` #ce1126), the "IS" letters. Reserved for destructive actions, errors, the "campaign" event category, the enablers of CHED's A.C.H.I.E.V.E. Agenda (its own colours), and the unread count on the notifications bell (`--alert-badge`).

## Colors

### Neutrals (warm)

- **Ink** `{colors.ink}`: headings, primary text, primary button background.
- **Body** `{colors.body}` / **Muted** `{colors.muted}`: running text and secondary text.
- **Canvas** `{colors.canvas}`: default page and card surface.
- **Surface soft** `{colors.surface-soft}`: sidebars, muted panels, table headers.
- **Surface strong** `{colors.surface-strong}`: segmented controls, the feedback band.
- **Hairline** `{colors.hairline}`: dividers and card borders.
- **Border input** `{colors.border-input}`: input and outline-button borders (≥3:1 against canvas, WCAG 1.4.11).

Neutrals lean **warm** so they sit with cream. Don't reintroduce cool slate grays (`#f8fafc`, `#e0e2e6`): mixing warm and cool neutrals makes the UI feel clinical.

### Brand and signature surfaces

- **Brand** `{colors.brand}`: small brand moments such as event-category dots, the textarea caret, and data series. Text contrast on white is about 7.8:1.
- **Brand soft** `{colors.brand-soft}`: selected or tinted states that need a brand hint.
- **Signature violet** `{colors.signature-violet}`: full dark cards (the HEI "next event" card, the featured story). White text, about 14:1.
- **Signature cream** `{colors.signature-cream}`: the active sidebar item, avatar backgrounds and hover tints.
- **Callout** `{colors.callout}`: the PHLGADIS logo's pastel pink, now only the colour of text selected on the HEI pages. (The law surveys sat on a pink-to-lilac gradient until 2026-10-03; they are a plain card now.)
- **Signature mustard** `{colors.signature-mustard}`: the "deadline" category only.

### Semantic

- **Destructive** `{colors.signature-red}`: delete buttons and error alerts (red text on a card, never white-on-white).
- **Toasts** (`--toast-success-*`, `--toast-error-*`): a deep tinted surface with bright text, the same in both themes except dark mode lifts the border off the page. Green when something went through; red when it failed or something was deleted (a bin icon instead of the error cross). Every toast carries its date and time under the message. Raise them through `@/lib/toast` (or a server flash with type `success`, `error` or `deleted`), never sonner's `toast` directly.
- **Link / focus** `{colors.link}`: inline links and focus rings.

### Data

Male `{colors.ink}`, female `{colors.brand}`, total `{colors.flag-blue}`. Avoid pink/blue gender coding; this is a GAD system.

## Typography

**Instrument Sans** (400/500/600), loaded by `bunny('Instrument Sans')` in `vite.config.ts` and emitted by `@fonts` in `app.blade.php`. `--font-sans` in `resources/css/app.css` is the single source; `public.css` uses `var(--font-sans)`.

Never put a font that isn't actually loaded first in the stack. The browser silently falls back (previously to Arial), and weight 500 disappears.

### Principles

- **Size before weight.** Headings are 500. Use 600 sparingly for small labels and legends; never go bolder.
- **Slight negative tracking at display sizes:** -0.01em to -0.015em from 32px up. Body text uses 0.
- **Text floor: nothing below 12px.** Captions and meta text 12–13px, secondary 13–14px, body 14px (app) and 15px (public).
- **Form inputs are 16px on screens ≤900px** so iOS Safari doesn't zoom on focus. That includes the survey builder's fields and the glossary search.
- **Touch targets are at least 44px on touch screens.** Small text links and buttons that stand alone take `tap-target` (`app.css`), an invisible 44px box centred on them that moves nothing. It is used on Open survey · Copy link, auth links, breadcrumbs and the activity log's names. On the public site, `.text-action`, the resource and glossary links and the footer's contact links grow to 44px under `(pointer: coarse)`. Links stacked closer than 44px get real padding instead, since their boxes would overlap.
- **Phones are checked page by page:** `tests/browser/mobile.spec.ts` opens every public, HEI and staff page at 360px. Nothing may scroll sideways or stick out, no text may be under 12px, and no field may be under 16px.
- Use `tabular-nums` for counts, stats and table figures.
- Known exception: Recharts axis ticks (10–11px) inside fixed-width axes. Revisit only with a visual check.

## Layout

- 4px base unit; tokens as in `spacing`.
- Public site: `.public-container` caps at 1280px; `.public-section` uses 96px vertical rhythm (64px ≤900px, 48px ≤600px).
- App: shadcn sidebar-inset shell; content cards on canvas, sidebar on `surface-soft`.
- **Staff pages fill the content area** with the same padding at every width and browser zoom (`flex flex-1 flex-col gap-6 p-4 md:p-6`): the dashboard, the modules and the Settings lists alike, so zooming out never opens margins on one page and not another. Only reading columns stay narrow: the Gender Mainstreaming feed, Notifications, Search, My Profile and short Settings forms (Profile, Password, Appearance). In top navigation every page sits in the 1280px column, except the HEI home.
- **Lists are paged on the server** (`Pagination`, `components/pagination.tsx`): every record table and log, with "Showing 1–10 of 23 roles" and Previous · page numbers · Next at the foot of its card. Lists that are short today (Roles, Regions, Respondent groups, the Survey library, Survey responses, My Profile → Activity) keep the bar on a single page (`persistent`) so the count always shows. A list sharing its page with other live content turns only itself (`only`): My Profile → Activity, and the Survey library under its insights. Feeds (Gender Mainstreaming, profile Posts, Notifications, Search) load as you scroll instead, and bounded summaries (chart tables, the regions dialog, Summary cards) are not paged.
- **A save keeps the list as it was:** creating, editing, approving or deleting from a list comes back to the same view, with its filters, search, tab and page (`Controller::backToList`, or `back()`). A page the change emptied, such as the last row on the last page or a user promoted out of a role filter, opens the list's new last page instead of an empty one (`App\Support\PageRange`). Edit dialogs open with the record as it is saved now, so a cancelled change never comes back.
- **Page changes cross-fade** (`lib/page-transitions.ts`, set as Inertia's default visit options): a 180ms ease-out View Transition when moving to another page.
    - Filters, partial reloads, infinite scroll, forms and background refreshes never fade, so they never flash or block a click.
    - With reduced motion the swap is instant. Browsers without View Transitions swap as before.
- **The app's top bar sticks** in both navigation styles and for every role, on an opaque `background` so the page scrolls under it. With the sidebar it holds just inside the inset card's 8px frame on desktop, keeping its rounded top corners (a `sidebar`-coloured cap behind it hides what scrolls past), and sits at the very top on phones. The top header (HEI accounts, and staff who choose it) is one 56px row that sticks at every width. The layouts set `--app-header` to where the sticking bar ends; sticky rails and in-page jumps use `top-below-header` and `scroll-mt-below-header` (24px below it) instead of fixed offsets.
- Whitespace is the atmosphere. No gradient, mesh or glow backdrops. (Line fades, such as the timeline's, and the corner fade behind a post's goal badges are not backdrops.) The one illustrated surface in the app is the HEI home's feed banner (see HEI home).
- **Dot texture** (`dot-backdrop` utility in `app.css`): a faint 14px halftone dot grid (ink at 16%) pinned to the top-right corner of the window, and softly the bottom-left, staying put while the page scrolls. It is a sticky, screen-sized layer that takes no space, so it stays inside its surface (the admin card keeps a clean frame). It goes on page surfaces (HEI shell, admin inset card, auth wrapper, public landing and survey pages) as a block or top-aligned flex column, never on cards, dialogs or menus. Opaque sections such as the landing statistics band cover it by design.

## Elevation and shape

- Depth comes from **color blocks first, shadow second**. Cards are flat with a hairline border. Law cards lift with a soft shadow on hover and focus only.
- Radius: 12px (`rounded.lg`) for buttons, cards and signature surfaces; 10px for date badges; 6px for inputs; full for avatars and icon buttons. No pill-shaped buttons.

## Components

- **Primary button**: ink background, white text, 44px tall, 12px radius. One per view.
- **Outline button**: canvas background, `border-input` outline. The natural partner to the primary button.
- **Destructive button**: signature red with white text.
- **Confirm popover** (`confirm-popover.tsx`): every delete and deactivate asks here, anchored to the button that asked, never in a browser `confirm()` or a full modal. It has a title naming the item, one or two lines on the consequence, then Cancel (which gets focus) and a red confirm. The confirm shows a spinner while the request runs, and the popover closes when the request ends. Reactivating, restoring or un-archiving needs no confirmation. When a menu item asks, like a post's "⋯ → Delete post", the popover opens once the menu has closed and points at the menu's button (`anchorOnly` with a controlled `open`).
- **View-only pages**: when someone can open a page but not change it (the survey builder without `surveys.update`), a "View only" note at the top names the permission to ask for. Fields turn read-only with a `muted` fill and full-strength text, which can still be selected. The editing buttons (add, move, remove, save) are hidden, not disabled. Never leave fields that take typing but cannot be saved. The builder does this through `ReadOnlyContext` (`components/survey-builder/read-only.ts`).
- **Signature violet card**: HEI home "next event". White text at 75–80% opacity for meta text, underlined links in `on-signature`.
- **Settings sections** (`layouts/settings/layout.tsx`): Account, User management, System configuration, Statistics (Enrollment & graduates), Community (Badges) and Public site, each shown only when the account may open something in it.
- **Sidebar**: `surface-soft` background, cream active item. Staff items sit under four labels, in this order: Overview (Dashboard), Monitoring (Reports, Training Survey, Compliance Survey), Community (Gender Mainstreaming, Events) and Public site (Surveys, Carousel, Feedback). A label with nothing the account may open is left out. `appNavigationGroups` in `lib/app-navigation.ts` is the one list for the sidebar, the top header and the phone menu. The current item is the one whose address the page's path starts with, the longest match winning (`activeNavItem`), so the Training Survey page lights Training Survey, not Reports.
- **Top header** (`app-header.tsx`): one row across the full width, laid out like Facebook's (a `1fr auto 1fr` grid, so the tabs sit in the true centre), 56px with a hairline under it.
    - **Left:** the official icon alone on its round white plate, a link named "PHLGADIS home", then the search.
    - **Search** (`header-search.tsx`; rules in `docs/people-and-following.md`): from 768px a 40px field on `muted` with a search icon, 10px radius (the input family, not a pill), "Search PHLGADIS". Below 768px a search icon opens the same field in a popover. The sidebar layout's top bar has it too, at its right end, as a field from 1024px.
        - **A combobox:** focus shows a 22rem panel under the field (a popover's border, radius and shadow) with the hint "Search people by name or institution." From two letters it lists up to eight people as 44px rows: a 36px photo, the name at 500, the affiliation in 12px muted text, and "You" or "Following" at the end. A last row, over a hairline, reads "See all results for “…”".
        - **Keys:** the arrow keys move a `muted` highlight while focus stays in the field (`aria-activedescendant`). Enter opens the chosen row, or every result, and Escape closes the panel.
        - **States:** three skeleton rows while it asks, "No one found for “…”" with a hint, and a calm line when it can't reach the server. A polite status says how many were found.
    - **Middle (from 1024px):** the navigation as icon tabs, a 48px hover box (`muted`, rounded-lg) 64px wide, 96px from 1280px. Each is named by its label (a bottom tooltip on hover and focus, and its accessible name); the current one is ink over a 2px ink line on the hairline, the others muted. A group marked `menu` (Monitoring) is one tab with a small chevron that opens its labelled items; it carries the line when one of them is current.
    - **Right:** the header actions, then the account avatar (its name is for screen readers only, as on Facebook).
    - **Phones and tablets** (below 1024px): the tabs give way to a menu button, left of the icon, opening a side sheet with the same groups under their labels.
    - HEI accounts get Community (their home, the feed; a people icon), Events, then Monitoring (Records, Training Survey, Compliance Survey) for HEI Focals.
- **App icon** (`app-logo-icon.tsx` → `public/assets/img/gadicon.png`): the official ⚥ icon supplied by CHED central office. It is used as-is in the sidebar, header, auth pages, the CHED official-post avatar and the favicons (`public/favicon.svg` embeds the same PNG, unmodified). Never redraw, recolor or replace official CHED/PHLGADIS assets.
- **Where an account belongs** is always in sight: `UserInfo` (sidebar and account menu) puts a 12px muted line under the name, with the institution or CHED office ("CHED Regional Office XII", "CHED Central Office"; `auth.affiliation`). The Users list shows a staff account's office as a `brand-soft` pill with a map pin. The Monitoring lists open with `OfficeScope`, the dashboard's scope line: a `brand` dot, the office's region (or "Every region" for the Central Office) and whose records the list holds.
- **Header actions** (`header-actions.tsx`): the notifications bell (`NotificationBell`, see Notifications) and a light/dark toggle, to the left of the account avatar in the top header and at the right end of the sidebar layout's top bar. The toggle is `ThemeToggle` (`theme-toggle.tsx`), which the public site header uses too.
- **FAQ** (public header): a plain "FAQ" link after the section links, styled like them, and last in the phone menu. The FAQ opens with the old page's prose: a larger lead paragraph, then the objectives as a two-column bulleted list (one column on phones). The questions follow as `<details>` rows on hairlines under an ink rule, and the page ends with a contact panel (the survey "coming soon" panel style) holding the hotline and email.
- **Timeline** (`pages/about/gad-herstory.tsx`, `.timeline*` in `public.css`): after shadcnblocks' timeline4, without its outer frame. Steps alternate text and media either side of a hairline centre line. A 2px `brand` line grows down it as the reader scrolls, its tip at the middle of the screen. Both lines fade out at their ends (fixed 80–140px fades), as in timeline4. Text faces the axis (right-aligned on the left side) with a 12px date, a title-md heading and muted body. On the axis sits a 44px card-bordered badge with a cream inner square and a lucide icon for the kind of milestone. Media sit in a dashed `border-input` frame hatched in `hairline`; a step without a photo shows its year there. Below 900px it becomes one column with the line and badges down the left.
- **Page tabs** (`/about`, `.about-tabs` in `public.css`): a bar pinned under the site header (88px, 76px ≤900px, 70px ≤600px) on the page background with a hairline under it. Tabs look like the header links: `nav-foreground` text, the chosen one ink with a 2px ink underline. On phones the bar scrolls sideways.
- **PHLGADIS logo** (`PhlgadisLogo`, `components/public/phlgadis-logo.tsx`): gadlogo.png on the light theme; in dark mode the compact gadlogo2.png on the header's white plate (`.lockup-plate`). Used by the footer and the Logo tab; the header always uses gadlogo2.png.
- **Logo explainer** (`.logo-block` in `public.css`, the Logo tab of `/about`): each official logo in a 220px column beside its explanation, sticky under the tab bar from 901px; body text muted with the source's bold terms in ink at 600. Stacked on phones.
- **A.C.H.I.E.V.E. tiles** (`.achieve-*`): CHED's agenda as rows on hairlines under an ink rule, each led by an 80px lettered tile with an uppercase THRUST/ENABLER label. Thrusts use `--thrust` (flag blue) and enablers `--enabler` (flag red), in both themes; both tokens live in `app.css`, shared with the post goals below. Apart from the bell's unread count, those are the only places flag red appears outside errors and the campaign category, because they reproduce CHED's own agenda colours.
- **SDG tiles** (`.goal-tile`, the SDG tab of `/about`): six a row, 8px radius, each a link to its UN goal page. Hover or keyboard focus lays `--media-scrim` over the tile, zooms the artwork 4%, and shows a frosted "Read more ↗" label (`--media-label`, 8px radius, not a pill).
- **Homepage statistics** (`components/home/statistics.tsx`, `.stat-row*` and `.chart-*` in `public.css`): the section's heading carries a Region and an Academic year select (stacked on phones). Four views: Line (first), Counts, Balance and Table; on phones the four buttons share the card's width, words only.
    - **Line:** the old system's chart, male (`--data-male`), female (`--data-female`) and total (`--data-total`) lines across the groups in CHED's order. Names are never cut or dropped: each sits under its point at 12px, slanted 40° and on up to two lines, and each group gets at least 52px, so a narrow screen scrolls the chart sideways (a focusable region) instead of squeezing it.
    - **Counts:** a 14px name with its total at 500 on the right, then an 8px male bar and an 8px female bar (`--data-male`, `--data-female`, the stat cards' colours) 3px apart, each drawn against the longest bar in view, with its figure in a 12px column on the right. 20px between rows; ten rows, then "Show all".
    - **Balance:** one 10px bar per group, women from the start and men to the end with a 2px gap, a hairline at 50%, and "81% female" / "19% male" either side (under the bar on phones). Ranked by women's share, so the list reads as a spectrum. The legend lists Female first here.
    - The rows are an `<ol>`; the bars and figures are hidden from screen readers, which hear one sentence per group instead.
- **Rate PHLGADIS** (`rate-widget.tsx`, `.rate-*` in `public.css`): an ink button fixed at the bottom-left of the homepage (44px, float shadow) opening a 360px popover card above it. On phones (≤600px) it is a round 44px star, its name for screen readers only, so it covers less of the page. A link to `/#rate` opens the card at once. Brand-purple uppercase eyebrow, a title-sm question, five 28px stars that fill in `brand` (hover previews, the chosen meaning shows under them), an optional textarea, a lock-iconed privacy line, and a full-width primary "Submit feedback". A thank-you state with a success check replaces the form.
- **Website feedback** (`pages/feedback.tsx`, `components/feedback/`; what it asks and who reads it are in `docs/feedback.md`):
    - **Form:** the law surveys' frame (progress bar, cards, Back and Continue) in an 860px reading column, in four steps: Your feedback, Agreement, Ease of use, Your details.
        - Steps already opened are buttons in the progress bar.
        - Only step 1 has required answers; the scale steps carry a muted "Optional".
        - A new step fades in and rises 6px over 200ms (instant with reduced motion), and its heading takes focus.
    - **Type tiles:** four tiles, two a row, with the icon over the words on phones. Real radios are stretched over them. The chosen tile is ink, like a checked chip.
    - **Rated questions:** five native emoji faces (😞 🙁 😐 🙂 😄) on equal 64px buttons with the end words under the row, or the four answers' words on 44px buttons, 2×2 on phones. Faces keep the numeric 1-to-5 values.
        - Radios sit underneath, so arrow keys move along the row.
        - Every face carries its question-specific words for screen readers and on hover: Strongly Disagree / Disagree / Neutral / Agree / Strongly Agree, or Very Difficult / Difficult / Neither difficult nor easy / Easy / Very Easy. The selected words appear under the row.
        - Borders are `border-input`, and the chosen button is ink.
        - "Clear" undoes an optional answer and keeps focus on the question.
    - **Details:** Email, Name, Region (from the database), then a searchable institution picker for that region, with a lock line saying who sees them. The surveys' confirmation panel replaces the form once sent, and its heading takes focus.
    - **Staff page** (`/admin/feedback`, Public site → Feedback): the usual full-width frame.
        - A filter card: search, Type and the place filters.
        - Stat tiles (`StatTile`, shared with Site ratings).
        - Bar rows: the label and its figure on one line, a `--chart-bar` bar under them. They show the types (each row filters the list), the reading and layout answers, and each statement's average, with a "View answer counts" table under each scale.
        - The list: each row has a type badge, two lines of the feedback, then place · sender · time. "Details" opens every answer (scale answers as the same face and its words), an email link and Delete. Averages and counts stay numeric.
- **Switch** (`ui/switch.tsx`): the one on/off control, 44×24, ink when on. It is named by the label beside it.
- **User dialog** (Add user and Edit user, `UserDialog` in `settings/users.tsx`): Region, Institution and Office each take a full row, and a long name wraps onto a second line instead of being cut (`wrap` on `FormSelect` and `HeiCombobox`). The institution picker's list always wraps, so two long campus names never look the same.
- **Temporary passwords:** the Create user dialog has no password fields; a muted note with a key icon names the temporary password the account starts with. Edit user keeps "New password (optional)", with "They'll choose their own at their next sign-in." under it for anyone but yourself. The first sign-in opens `auth/change-password.tsx` in the auth card: "Choose your password", "Signed in as …", New password and Confirm password with show toggles, a full-width "Save password" and a "Log out" link. No app chrome shows until it is saved.
- **Registration card** (`registration-panel.tsx`, Settings → Users, above the status tabs): one row per region the manager covers. Each row has the region's name, an emerald "No approval" pill while open, what happens to new accounts (and until when, in Philippine time), and a switch. Switching on asks first, in a popover anchored to the switch, with an optional "Close automatically at" time. Switching off takes effect at once, since it is the safe direction. An outline "Show 17 regions" / "Hide regions" button (chevron down, up when open) folds the list away, and the header line still names the regions that skip approval, with the same pill. A single region starts unfolded; a longer list starts folded. The register form asks for a Region first: every active region, in the survey pickers' order (chosen already when only one is listed). It narrows the HEI list and says what will happen: straight in, or wait for approval. A region whose institutions have not arrived from the CHED directory yet says so, with its office's email when set, and the HEI field reads "No institutions available". Mobile number and sex are left to Settings → Profile, where both are optional.
- **Enrollment & graduates** (`settings/student-counts.tsx`, Settings → Statistics; what it holds is in `docs/enrollment-and-graduates.md`): the full-width settings frame.
    - **Header:** the title and line, an outline "Template" (the .xlsx layout) and a primary "Import file".
    - **Tabs:** Enrollment | Graduates as underlined links (`aria-current`), then a filter card with Academic year (years with figures say how many groups) and Region (Central Office only, "All regions").
    - **Figures:** three `StatTile`s (total, female, male with their shares), then the table by discipline group (`FiguresTable`: female, male, total, and the female share as a figure and a small `SexSplitBar`), with a totals row. On phones the table scrolls inside its own focusable box.
    - **Under it:** when and for which region the figures were imported, and a red ghost "Delete these figures" (confirm popover) while one region is in view.
    - **Import dialog:** what the file holds, Region (Central Office only) and a file chooser for .xlsx or CSV. A refused file lists its problems, a line each, in a red-bordered alert; nothing is saved.
- **Sex split bar** (`sex-split-bar.tsx`): women's and men's shares of a whole as one bar, female in `--series-1` from the start and male in `--series-2` to the end, as in the dashboard's Sex donut, with a 2px gap and 4px-rounded ends. `parity` adds a hairline at 50%. It is `aria-hidden`; printed figures carry the meaning, and `SexLegend` names the colours.
- **Site ratings** (`settings/ratings.tsx`): a switch row for the button, a KPI row of three stat tiles (proportional figures), a "Ratings by stars" breakdown whose rows filter the list (10px bars in `--chart-bar`, square at the baseline and 4px-rounded at the tip, on a `muted` track; count and share in muted text), then the ratings table with star marks and delete. `--chart-bar` is `brand` in light and `#a57cd4` in dark, one step deeper than the dark brand so the bars sit in the dark lightness band.
- **Notice panel** (`.notice-panel`): icon, a short heading and line, then its action on a `muted` tint with a hairline border. Used by the unpublished survey, the FAQ's contact box and the About page's link to the timeline.
- **Status badges**: live/active = emerald tint, draft/pending = amber tint, archived/inactive = muted. Admin tables all share this mapping. Monitoring reports' stage pills (`components/monitoring/shared.tsx`) apply it by whose turn it is: amber with an icon while the HEI has work to do (Draft, Returned for correction, Ready to sign), `brand-soft` while CHED reviews (Submitted), emerald once Reviewed. Never red: a returned report is not an error.
- **Checklists** (`checklist-items.tsx`): the GAD surveys' items as bordered tiles (one column on phones, two from 640px) under a "Check all" box that shows a dash when only some are checked, with a live "N of M checked". A checked tile turns `brand-soft` with a brand border. CHED reads an answer as every item with a brand check or an empty circle; unchecked items are muted.
- **Post composer** (`post-composer.tsx` + `post-composer-views.tsx`): a compact prompt card (with Photos / Tag people / Feeling / SDGs & ACHIEVE shortcuts, icons only below 640px) that opens a "Create post" modal. Sub-views (Tag people, feelings, Photos, and "What does this support?") swap in place with a back arrow and Done; Escape steps back before it closes. "Add to your post" and Post stay pinned while the content scrolls. The draft survives closing the modal.
- **Homepage stories** (`#stories`; selection rules in `docs/homepage.md`): the year's three most reacted photo posts in the existing story grid.
    - **Cards:** the first is the signature-violet card. Each card shows the first photo, then "{HEI or CHED office} {date}" as 12px meta, then a title (the post's first line or sentence), a ♥ reaction count and "Read story ↗". The person who posted is never named.
    - **"Read story":** the public preview dialog, labelled "Gender Mainstreaming", with the post's photos in the feed's own mosaic (`PostImages`: one photo whole in its shape, more as the grid with "+N", each opening the photo viewer), the full text, goals as text (no SDG icons, so the UN icon rules don't apply), counts, and a primary "Log in to react and comment" ("Open the post" when signed in).
    - **Moderators** get Hide from homepage / Show on homepage (EyeOff/Eye) in a photo post's ⋯ menu.
    - **The composer** adds a muted note once photos are attached.
- **Post modal** (`post-dialog.tsx`): "Comment" opens "{School}'s post": the full post and thread scroll, and the "Comment as …" box stays pinned at the bottom (Enter sends; the new comment scrolls into view). Feed cards show no inline comments. Comments thread one level deep (`post-comments.tsx`): each has "time · Reply · Delete", replies fold under "View N replies", a reply names whom it answers in brand purple, and the post author's comments carry an "Author" tag. Deleting a comment removes its replies.
- **Post actions** (`PostActions` in `post-parts.tsx`): React, Comment and Share as icons only (18px, 36px targets), no words. Comment and Share show their count beside the icon once it is non-zero; each has a screen-reader name ("Comment, 3 comments"). The reactions summary sits at the far end of the same row.
- **Reactions** (`post-reactions.tsx`, list in `lib/post-reactions.ts`): three, drawn with the device's emoji like Feelings: ❤️ Heart, 🤗 Care, 👏 Clap. One per person per post.
    - **React button:** an outline heart, or the viewer's chosen emoji (it pops in). A click or tap gives a Heart or takes the reaction back.
    - **Picker:** resting the mouse on React for 450ms, holding it for 400ms on a touch screen (no text selection or callout), or pressing ↑ opens a rounded bar of 44px emoji buttons above it. The emoji pop in one after another; hover or focus lifts one and shows its name in a small ink label. Arrow keys move, Enter picks, Escape closes. It mounts only while open, and all motion is transform and opacity behind `motion-safe`.
    - **Summary:** the reactions given as overlapping 20px emoji, most given first, and the total. Hover shows the latest ten names with their emoji, then "See N more"; the button (or the names) opens the Reactions dialog.
    - **Reactions dialog:** the Share dialog's header, underline tabs ("All 15", "❤️ 7", …) for the reactions given, and rows of avatar (with the emoji as a badge), name and school, newest first, 20 at a time with "Show more".
- **Share** (menu in `post-parts.tsx`): Share to feed (`post-share-dialog.tsx`: an optional message with the original framed inside via `SharedPostEmbed`; reposts read "{School} shared a post"), Send via… (the device share sheet, shown only where supported), Email, and Copy link. Links point to the post's members-only page `/posts/{id}` (`pages/posts/show.tsx`), which opens straight into the post modal. Sharing a share passes along the original. Removing a post removes its shares.
- **Photo mosaic** (`PhotoMosaic` in `post-images.tsx`): its shape is known before the photos load, so the feed never jumps. The feed and the composer preview share it.
    - **One photo** keeps its own shape and shows whole (`object-contain`). The frame is no wider than 2:1 and no taller than 80% of the screen or 44rem (`singlePhotoHeight` in `lib/photo-frame.ts`); past those limits the photo gets `muted` bands, never cropping. The size comes with the photo (`post_images.width` and `height`, stored at upload with the phone's EXIF rotation applied by `App\Support\PhotoDimensions`); the composer preview measures the photo once it loads.
    - **2–4 photos** fill fixed-ratio grids; **5–10** show two over three, with "+N" on the fifth tile. Grid tiles are cropped; the viewer shows each photo whole. An optional `overlay` (a post's goal badges) sits once at the bottom-right of the whole grid over `bg-corner-fade`; the grid is a size container, so the overlay scales with it in `cqw`. Only the overlay takes clicks; the fade passes them to the photos.
- **Post goals** (`post-goals.tsx`; the picker is `GoalsView` in `post-composer-views.tsx`): a post can say which SDGs (up to 3) and A.C.H.I.E.V.E. items (up to 3) it supports. Both are optional.
    - **UN icon rules** (Guidelines for the use of the SDG logo, including the colour wheel, and 17 icons, September 2023, pp. 4 and 65–66): each icon is used whole and square, never cropped, covered, shadowed, recoloured, dimmed or stretched, and a group sits in one line or aligned left. Wherever the icons appear with details, `SdgCredit` gives the UN's link and its statement word for word.
    - **On photos:** one row at the bottom-right of the whole mosaic, never one per photo, over `bg-corner-fade` (an ellipse of `--media-scrim` that clears at its edges, behind the icons). A lone icon is 9.5% of the photos' width; the size steps down to about 6% with three icons and the strip, never under 28px (`badgeShare` in `lib/post-goals.ts`).
    - **Without photos:** the same row, left-aligned under the text, at 32px.
    - **A.C.H.I.E.V.E. strip:** the acronym with the chosen letters lit in `--thrust` or `--enabler`, never taller than the icons. Over photos it sits on `--media-panel` so unlit letters stay readable; on the card it is `muted` with a hairline border.
    - **Details:** the row is one button named "Supports …", opening a "This post supports" popover with each goal (linking to its UN page) and agenda item (linking to `/about#achieve`). The full-size photo viewer shows the photos without the row.
    - **Picker:** the 17 icons 4 a row on phones and 6 above; a picked icon gets a 3px brand frame 3px outside it, while the focus ring hugs the icon. At the limit, the other icons stop responding with a note rather than fading. The agenda items are rows like Tag people's.
- **My Profile** (`pages/profile/show.tsx`, `/profile`, opened from the account menu): a plain signature-violet cover with two faint outline circles and no text, then the photo overlapping its bottom edge by half (112px on phones, 144px from 640px, 160px from 1024px, a 4px card-coloured ring).
    - **Photo** (`ProfilePhoto` in `profile-photo.tsx`): on your own profile it opens a menu, as on Facebook: "See profile picture" (only with a photo; the photo viewer, `PhotoLightboxContent`, shared with post photos; Escape returns to the photo) and "Choose profile picture" (file picker, then the crop dialog, saved in place). The crop dialog is `useProfilePhotoPicker` (`profile-photo-cropper.tsx`), shared with Settings → Profile, which keeps Upload/Change/Remove. On anyone else's profile the photo opens the viewer, and is plain without one.
    - **Anyone's profile** (`/people/{id}`) is the same page: their photo opens the viewer, and there is no Activity tab, no roles and no account link. On the right sits `FollowButton` with a "Follows you" pill (12px, `muted`, 6px radius), or "Deactivated account" in muted italics.
    - **Counts:** under the affiliation, "12 followers · 3 following", the figures at 500 in ink. Each opens `FollowListDialog`, in the Reactions dialog's frame: rows of a 40px photo, the name (a link to the profile) and the affiliation, the latest first, then "Show more".
    - **Achievements** (Beta), above the tabs, like GitHub's: the greatest six badges (`App\Support\Achievements`: Champion, then badges given by hand, Advocate, the earned milestones, Participant) as 48px medals in 56px round buttons (`muted` on hover), each named by a tooltip and its accessible name, then a `muted` "+N" circle. "See all badges" sits at the right. A medal opens the Badges tab, scrolls it under the header and focuses that badge's tile. With none, your own profile shows one muted line on how to earn one and "How to earn badges"; someone else's hides the section.
    - **Tabs:** Posts · Activity · About · Badges on your own profile, and Posts · About · Badges on anyone else's. Badges carries a `brand` count pill. `?tab=badges` opens a tab directly, as the badge notifications do.
        - **Posts** shows their Gender Mainstreaming posts in the feed's cards (`Feed`, without the new-posts check), beside the About card. With none, an empty state links to where you post on your own profile.
        - **Activity** (your own only) is your activity log (`ActivityTimeline`, the admin log's entries without the person filter; View links only to pages you may open). Posts and Activity arrive just after the page with skeletons. Posts load more as you scroll; Activity comes in numbered pages of 15 under a "Showing 1–15 of N entries" bar, which turns only the list and keeps the tab (`?tab=activity&activity_page=2`).
        - **About** lists the name and affiliation, plus the roles and "Manage account details" on your own profile.
        - **Badges** shows every badge as an `AchievementTile`. On your own profile it adds **Still to earn**: cards with the medal at 50%, the name and how to earn it, plus "GAD Quest badges" with a link for players, naming the levels as Settings → Badges does and showing the Champion's picture.
- **Staff dashboard** (`pages/dashboard.tsx`, `components/dashboard/`; what each figure counts is in `docs/dashboard.md`): the staff pages' full-width frame.
    - **Top:** greeting, title and the Open Gender Mainstreaming button. Then the scope line, a `brand` dot with the place in view and the period, and the range in muted text. Then one filter card, applied as values change: Academic year, View by (Whole year / Semester / Month), the semester or month, the place filters (`PlaceFilters`), Ownership and Law survey.
    - **Overview:** four stat tiles on hairlines: Survey responses, Participating HEIs, GAD posts and Accounts. Each has a 36px figure, its change or note in `brand` at 500, and a muted detail line.
    - **Participation over time:** a Survey responses / Posts shared switch (`aria-pressed`, on a `muted` track), then one area series at a time: responses in `chart-2`, posts in `chart-3`. A "View data" table shows the same points. Beside it, the signature-violet "Every campus counts." card shows participation per region, leaders first (highest share, then most HEIs contributing, then office order). Past five regions it lists the five "Leading regions" and a "View all N regions" button opens every region in a table dialog (Region · Contributing · Active HEIs · Share, `reach-table.tsx`), so the card stays as tall as the chart beside it. When one region is in view it shows the HEIs yet to contribute instead.
    - **Goals** (`goal-insights.tsx`, "Where GAD work meets the goals", full width), the dashboard's main section. Underline tabs: SDGs and A.C.H.I.E.V.E. Agenda.
        - **Summary:** a muted strip with tagged posts, goals covered and HEIs contributing.
        - **Ranked list:** each row has the goal's whole square icon (40px; never rounded, covered or dimmed) or the agenda letter tile (`AgendaTile`), "5 · Gender Equality", a single-hue bar in `--chart-bar` (square at the baseline, 4px-rounded tip) on a `muted` track, and the count and share. Rows are toggle buttons; the chosen one gets a 2px ink ring around the row, outside the icon. A Most posts / Goal order switch sorts them, and goals without posts wait behind "Show the N goals with no posts yet".
        - **Details panel** (sticky on wide screens): the chosen goal, or all goals. It lists top regions as bars, then the top five HEIs with rank chips, then the CHED office's share.
        - **Heatmap table:** places as rows, goals as columns, every figure printed. The tint uses the `--heat-1…4` ramp: one violet, darker is more, each step at least 2:1 on the card. Ink figures sit on steps 1–2 and light ones on 3–4, flipped in dark mode. Cells have 2px gaps. A zero is a dot. The chosen goal's column is outlined, with its header in ink. The table scrolls inside its own box with a sticky first column.
        - **Footnotes:** the counting note, then the UN credit and disclaimer (`SdgCredit`) under SDGs, or the agenda link under A.C.H.I.E.V.E.
    - **Donuts** (`DonutChart` in `dashboard-charts.tsx`): a ring (inner radius 68%, 2px card-coloured gaps, no animation) with the total and its noun in the middle. Beside it is a legend table that repeats every figure and share, so colour is never the only key. Slices take `--series-1…4` in a fixed order per chart (brand violet, orange, aqua, yellow), so a value keeps its colour whatever the filters leave. "Not given", "Other" and unrecorded values take grey `--series-other`, and past four values fold into it. The ring is out of the tab order, with a hover tooltip for mouse users.
    - **Who studies, who graduates.** (`student-figures.tsx`, full width, under the goals): enrollment and graduates by sex for the newest imported year up to the one in view.
        - **Left:** a bordered block for each kind: the AY, the total at 36px, the female share in `brand` at 500, a `SexSplitBar` with both figures, and the change against the year before (or "The latest year imported").
        - **Right:** an Enrollment / Graduates switch (`SegmentedSwitch`, shared with Participation over time) and "View data". The groups, largest first, eight then "Show all N groups": the name and total, then the split bar with a parity line between the female and male percentages. Hovering a bar gives its counts; screen readers get the shares as text. "View data" swaps in `FiguresTable`.
        - **Footer:** the regions the figures come from, and "Manage enrollment and graduates" for `student-counts.view`.
        - With an HEI or ownership filter, a muted note says the figures are regional totals.
    - **Below the goals:** "Who shares the work" (posts by public HEIs, private HEIs and CHED offices) and "People on PHLGADIS" (HEI accounts, CHED staff, awaiting approval) as donuts, side by side.
    - **Then:** the four laws as bars, "Whose voices" as two donuts (respondent group, sex), the community counts, and real upcoming events (`EventDateBlock`). Every card says what will appear when its count is zero.
- **Activity logs** (`settings/activity-logs.tsx`, entries in `components/activity/activity-entry.tsx`): the filter card (search, Action, Module, From and To dates, then the place filters), a person chip with "Show everyone" when the list is narrowed to one account, and an entry count. Below it a timeline, newest first: each entry's 36px photo or initials (a shield for a failed login, a server for the system) on a hairline rail, beside a card with a 3px left edge in the action's tone. Tones follow the status badges: emerald when something began or went through (login, created, approved, activated, published, submitted, reviewed), brand for a change (updated, draft saved, finalized), amber when something paused or was sent back (deactivated, archived, reopened, returned), red when removed or refused (deleted, failed login), muted for data read out and logouts. The card reads: name (a button that narrows the list to that person), the action badge in the tone's tint, "in {Module}", a "View" link while the record exists; then the sentence with the record's name at 500; then time to the second (Philippine time), place, device and IP as 12px meta with icons. A `<details>` "View changes (n)" folds out a field / before / after table (and any other details); times inside it show in Philippine time.
- **Notifications** (`components/notifications/`, `pages/notifications/index.tsx`; who is told what is in `docs/notifications.md`):
    - **Bell:** a 32px ghost icon button named "Notifications, N unread". While anything is unread it carries an 18px count, "1" to "9" then "9+", at its top-right corner: 12px figures at 600 in white on `--alert-badge` (flag red, 5.6:1, kept deep in dark mode) with a 2px `background` ring. It pops in, motion permitting.
    - **Panel:** a popover aligned to the bell's end, 24rem wide and at most the screen less 1rem, so it fits a 375px phone. It has a "Notifications" heading (focused on open) with a ghost "Mark all as read" (double check) shown only while something is unread. The list scrolls inside, at most 26rem tall: five rows first, then five more each time the list reaches its end, with skeleton rows meanwhile. A "View all notifications" footer leads to the page. It loads afresh each time it opens, and takes in anything new while open.
    - **Rows** (`NotificationItem`, shared with the page):
        - **Marks:** a 40px photo or initials (44px on the page) with a 20px mark at its corner, a white lucide icon on the tone's solid colour (`lib/tones.ts`, the activity log's tones). A reaction shows its emoji instead. Grouped survey answers show a muted circle with a clipboard, with no person.
        - **Text:** the actor's name at 500, the sentence, the record's name at 500 (three lines at most in the panel), a reviewer's comment as a muted quote, then the relative time with Philippine time in its title (the page adds "· Module").
        - **Unread:** a `brand-soft` row at 60% (full on hover), the time in `brand` at 500, and a 10px `brand` dot on the right.
        - **Actions:** the whole row is one link that reads it and opens its record. A ⋯ button appears on hover or focus (always on touch screens) and opens Mark as read / Mark as unread and a red "Delete notification". Delete asks in the confirm popover by ⋯ and ends with the red deleted toast.
    - **Page:** the usual page frame with a centred `max-w-3xl` column, as a reading list. It has:
        - a 24px "Notifications" heading with "You have N unread notifications" (or "You’re all caught up") and an outline "Mark all as read"
        - underline tabs All / Unread with a `brand` count pill (`lib/underline-tabs.ts`, shared with the Reactions dialog)
        - one card holding the filters (search, Type, Module; hidden while there is nothing yet) over the rows on hairlines
        - more loading by itself, 15 at a time, ending with "No older notifications"

        Something new while the page is open loads straight in near the top. Further down, the feed's floating "New notifications ↑" button waits.

    - **Freshness:** the count arrives with every page and is checked every 30 seconds while the tab is in view (at once on coming back), until live updates (Reverb) replace it. New arrivals are announced to screen readers.
- **Gender Mainstreaming** is the name of the posts feed, as in the old PHLGADIS ("View More Gender Mainstreaming Efforts"): the staff nav item, tab title and breadcrumb say "Gender Mainstreaming" (the address stays `/community`, for CHED staff with `posts.view`). The feed opens with a calm editorial heading, no banner: "HEI Gender Mainstreaming Efforts" with the old HEI page's line "Promoting gender equality and inclusivity in our school community", word for word; the staff page has its own line instead, which tells moderators (`posts.moderate`) how to remove posts.
- **Feed tabs** (`feed-tabs.tsx`): "All posts · My region · Following" under the composer on the HEI home and `/community`, as underlined links (`?feed=`, `aria-current`) like Enrollment | Graduates. My region names the region in its title and for screen readers, and is left out for the Central Office. Each tab has its own empty state ("No posts from your region yet", "No posts from people you follow").
- **Follow button** (`components/people/follow-button.tsx`): a primary "Follow" with a person-plus icon, then an outline "Following" with a check and a chevron. Its menu holds "Unfollow {name}", so a stray tap never unfollows. Each button's name includes the person's (screen readers only), and it shows a spinner while it asks.
- **Search results** (`pages/search/index.tsx`, `/search?q=`): the Notifications page's centred column. A heading and line, then a field with a Search button. Then a "People" card of rows on hairlines: a 48px photo, the name as a link, the affiliation, "Follows you", and `FollowButton` (or "You"). More load as you scroll, ending with "That’s everyone". The empty state says "No one found for “…”", with a hint.
- **Feed loading** (`feed.tsx`, `use-new-posts.ts`; the HEI home and `/community`):
    - **First open:** the feed is a deferred prop, so the page appears at once with two post-shaped skeletons (byline, two lines, a 16:10 photo, the action row) and a "Loading posts" status; the first five posts replace them.
    - **Older posts** load by themselves, five at a time, 800px before the reader reaches the end, with the same skeleton meanwhile. "You're all caught up" with a check marks the end.
    - **Photos** shimmer in their tiles (`bg-primary/10`, pulsing unless the reader prefers reduced motion) until each one arrives.
    - **Newer posts:** a reader who comes back after 30 seconds or more away (another tab, a locked phone) triggers one small check. At the top of the feed the new posts load straight in, with a skeleton at the top meanwhile. Further down, a "3 new posts ↑" button (ink, 12px radius, float shadow) floats 12px under the top bar without moving the page; it scrolls up and loads them. A status line announces both to screen readers.
- **HEI home** (`pages/hei/home.tsx`), the community feed, laid out like Facebook from 1280px: the page drops the 1280px column (`data-layout="wide"`) and spreads three columns across the screen, the rails at its edges and the feed centred, at most 42rem (`17rem · 42rem · 20rem`, then `22rem · 42rem · 22rem` from 1536px).
    - **Left rail** (`HomeRail`, `components/hei/home-rail.tsx`): a plain list on the page, no card chrome, as on Facebook. Rows are 44px, rounded-lg, `muted` on hover, each led by a 36px round `brand-soft` tile with a `brand` icon (the Quick links' style).
        - **You:** your photo or initials, the institution's name (the page's h1, 15px at 500), "Good morning, {name}" in muted 13px and a chevron: a link to My Profile.
        - **Menu** ("Your PHLGADIS"): Community (current, the cream active fill) and GAD Quest with a Beta tag, a link to `/quests`. Events and Records are left to the top bar and Quick links rather than listed twice.
        - **Groups that fold** (`Collapsible`, the chevron turns; both start open so the column reads full, and each remembers in this browser if it was folded): Law surveys lists each law indented under the icon column, its code at 500 and title in muted text on one line, the HEI's count, then Open survey ↗ · Copy link (`SurveyActions`, shared with the panel). Resources lists the landing page's five areas with their icons (`lib/resource-icons.ts`) and counts; GAD Videos says "Coming soon" and is not a link.
        - **GAD Quest card**: a plain bordered card, "GAD Quest" with its Beta tag, then the newest quest open to them in 13px and a small primary button that says where they stand (Play, Continue, See your result, Play again), with their badge's mark and level once earned. With none open it says so and links to their badges. The PHLGADIS persona (`persona-card.webp`, a resized copy of the user's `persona.png`; not an official CHED asset) sits at 80px on the right.
        - **Footer**: after a hairline, 12px muted links (About · Resources · FAQ · Feedback) and "PHLGADIS © {year}", wrapping inside the column. As on Facebook it rests at the bottom of the screen: the column is at least the screen's height beside the feed (`min-h-[calc(100dvh-var(--app-header)-3rem)]`) and the footer is pushed to its end. Open groups that outgrow the screen push it down after them; it never covers them. The GAD Quest card stays right under the groups.
        - Hairlines separate the menu, the groups, the card and the footer.
    - **Middle:** the feed banner, the composer and the feed, nothing else.
        - **Feed banner** (`FeedBanner`, `components/hei/feed-banner.tsx`): "HEI Gender Mainstreaming Efforts" (title-md, title-lg from 640px, at 500) and its line, word for word from the old HEI page, on a card with a hairline border over the campus illustration (hills, the sun and a school building). The picture is `hei-banner-720.webp` / `-1440.webp`, about 5 and 11 KB, resized from the user's 1 MB `background-HEI.png`, which stays as the source. It covers the card, anchored to the building at the right (`object-[right_72%]`), and is hidden from assistive technology. From 640px the words keep to the open sky on the left, ink and muted text on the pale sky well above 4.5:1. On phones the words sit on the plain card and the picture is a 112px strip under them, fading in at its top, so the text never runs over the hills. In dark mode the picture fades to 16% so it never glares.
    - **Right rail:** the next event, the calendar, later events and Quick links (HEI Focals), then two cards for every HEI account:
        - **People at your institution** (`InstitutionPeople`; the list is `App\Support\InstitutionPeople`), like Facebook's Contacts: the institution's active accounts other than you, up to six, each name a link to their profile. Its GAD Focal Persons (whoever may submit the monitoring report) come first on a `brand-soft` row with a "GAD Focal Person" label in `brand` and "Ask about GAD reports and surveys", then colleagues by name as 32px avatars, then a muted "N people from your institution are on PHLGADIS" (counting you). Only names and photos are sent, never emails or roles. The first account sees a line saying colleagues appear as they join.
        - **Need help?**: the Quick links card (`QuickLinks` with a title) with FAQ, Send feedback and Rate PHLGADIS. The last opens the homepage with its rating card already open (`/#rate`).
    - **1024–1279px:** the name over the page, the law surveys as a plain card above the feed (`SurveyPanel`: the four laws on hairlines, no background), the right rail beside it. **Below 1024px:** one column: name, law surveys, events and links, then the feed.
    - **Both rails** stick via `useStickyRail`: under the header when they fit, otherwise they scroll until their end is visible and hold. They never scroll internally.
- **GAD Quest** (Beta; `pages/quests/`, `components/quests/`; rules in `docs/gad-quest.md`):
    - **Beta tag** (`components/beta-tag.tsx`): a 12px `brand` label on `brand-soft`, 6px radius, beside the name wherever GAD Quest appears: page headings, the HEI rail, the nav (`NavItem.beta`: in the dropdowns, the mobile sheet and the sidebar; in an icon tab's tooltip and name only) and My Profile's Achievements.
    - **The game** (`play.tsx`) is a single 42rem column, the HEI pages' plain frame, with a back link to the list. Calm rather than playful: no timer, no confetti, no sounds.
        - **Intro:** a card with a `brand-soft` band holding the organizer and the persona (decorative), then the title (title-lg), the description and four checked lines (length, explanations, one try or retakes, the badge). The primary "Start the quest" is full width on phones.
        - **Question:** "Question 2 of 5" and five 8px pills (ahead `muted`, current ink, answered emerald or red) over a card with the prompt (20px, 24px from 640px, focused when it appears) and the choices as full-width 56px buttons with a 2px border and a lettered circle. Choosing one sends it. Then the right choice turns emerald with a check, a wrong choice red with a cross (icon and words, never colour alone), the others muted, and a muted panel with a 4px emerald or red left edge says "Correct." or "Not quite.", the right answer, and the explanation, announced politely. Focus moves to "Next question" (or "See your result").
        - **Result:** the level's mark at 80px, "4 of 5 correct", what was earned, the badge's details (`BadgeDetails`) on a `muted` strip, then Play again (only with retakes), All quests and Your profile; below, every question with the player's answer, the right one and its explanation.
    - **Badges** (`LevelMark` in `quest-badge.tsx`): the shared medal (see Medals), plain for Participant, violet for Advocate, gold for Champion, or the level's picture from Settings → Badges. The level's name, as Settings → Badges gives it, is always written beside it. In a collection each badge is an `AchievementTile`.
    - **Player list** (`/quests`): the HEI pages' header, then quest cards (organizer · questions, title, description, then the badge or "About two minutes" and the button), three across from 1280px, then "Your badges".
    - **Staff pages** use the staff frame. Manage lists quests as rows (title linking to its page, region and author; status pill in the status badges' colours; finished of players; updated). A quest's page has Edit, Close (confirmed) or Open quest / Open again, and Delete while nobody has played; an amber notice while it is a draft; the retakes switch; four stat tiles; "Who finished, by sex" with `SexSplitBar`; the participants with the HEI filter; and every question with its answer checked. The form is a 48rem column of cards: the quest's details, then a card per question with radios for the correct choice (none is marked until the author picks one, and removing the marked choice unmarks it; the marked choice's field turns emerald and "Correct answer: C" shows under the choices, "Mark the correct answer." until then), add and remove choice (2–4), and the explanation's hint to name a law's section. Once anyone has played, the questions are shown but disabled under a lock notice.
- **Medals** (`components/badges/medal.tsx`; what each badge is for is in `docs/badges.md`): every badge, GAD Quest levels included, is one flat medal, so the set reads as one system: two ribbon tails under a 27-unit ring, a disc with a 2px card-coloured edge, and a lucide icon (1.75 stroke) in the middle, drawn as SVG (64×72) from tokens only.
    - **Tones:** plain (`muted-foreground` ring at 35%, `muted` disc) for Participant; violet (`brand` ring, `brand-soft` disc, `brand` icon) for Advocate and every other badge; gold (`signature-mustard` ring, `accent` cream disc, `signature-violet` icon, mustard in dark mode) for Champion. Ribbons take the ring's colour at a lower strength.
    - **Icons:** sparkles (Community Spark), camera (Visual Storyteller), globe (SDG Connector; never the UN wheel), compass (Agenda Builder), award (custom), check badge, medal and trophy (the quest levels).
    - **Pictures:** a custom badge's uploaded picture replaces the medal in the same box, whole (`object-contain`), its transparency kept. The browser shrinks it to a 256px WebP first.
    - **Always named:** the medal is `aria-hidden`; its name is written beside it. A switched-off badge's medal sits at 50% in Settings.
    - **Achievement tile** (`achievement-tile.tsx`): a bordered card tile, the medal at 56px, the name in two lines and (for a quest) its level; it opens a popover with the medal, the description, its facts (score, organizer, awarded by, for) and the date earned.
- **Settings → Badges** (`settings/badges.tsx`, `settings/badge.tsx`): the full-width settings frame.
    - **List:** a search card, then rows on hairlines: the 56px medal or picture, the name (a link to its page) with an "Off" pill when off, its description, and a 13px line: "Earned by: …" or "Awarded by hand", the region, holders. On the right, a switch ("Give out …"; not for GAD Quest levels, which stay on), Edit (dialog) and Delete (custom only, confirm popover saying how many hold it). The earned badges come first, in the order people reach them, then the GAD Quest levels from Participant up.
    - **Dialog:** an 80px preview with Upload / Change picture and Remove, Name, "What it is for", "Who can receive it" (Central Office only) or the rule as a muted line for an earned badge or GAD Quest level, and the On switch (not for GAD Quest levels).
    - **Badge page:** a back link, the 80px medal, name, description and how it is given, and a primary "Award" for custom badges. A search card, then "N holders" over rows (avatar, name, place · awarded by · date, the note) with a take-back button. The Award dialog searches people as you type (a list of 48px rows, the chosen one `brand-soft` with a check), then an optional "What for", then "Award to {name}".
- **Event category dots**: training = brand, campaign = signature red, deadline = mustard, meeting = ink, other = muted.
- **Glossary** (`pages/resources/definition-of-terms.tsx`, `.glossary-*` in `public.css`): term | definition rows on hairlines, grouped under each Act by an ink rule with its cream `law-number` pill and a "Read the Act" link to its full text. A toolbar (sticky from 901px) holds the search (matches in `brand-soft` with a brand underline, `/` to focus, Esc to clear) and law chips; the chip for the group in view is cream. Every term has an anchor and a copy-link button, and a term opened from a link tints `brand-soft` once. Resource pages live at `/resources/{area}`, share the `ResourcePage` frame, and, like `welcome` and `surveys/`, render without the app layout (`app.tsx`). Document pages (Republic Acts, Issuances, Manuals) share `DocumentRow` / `.resource-row`: one row per document on hairlines under an ink rule, led by its artwork or a small document tile (`data-media="icon"`), a cream number pill, and an outline "Read the …" button (no primary button, since a page has several) with "PDF · size" or the host site written underneath. Links to related laws are small bordered chips.
- **No clusters on screen** (since 2026-10-03): every place picker and place line goes region → HEI. Clusters stay in the data only, as the link from an HEI to its region (the HEIDA sync files each HEI under its province; `docs/heida-sync.md`).
    - **Public survey:** Region, then Name of HEI. The response is filed under the chosen HEI's cluster, which the respondent never sees. The definitions keep their Cluster question; the form never asks it and the survey builder hides it (`shownQuestionIndexes`).
    - **Filters** (dashboard, Monitoring, GAD surveys, Users, Activity logs, Feedback, the HEI directory): Region (Central Office only), then HEI.
    - **Settings:** no Clusters page. Regions lists each region's HEI count. Add/Edit HEI asks only for the region; an institution keeps its cluster while its region stays the same, and otherwise goes beside its region's others (`SurveyCluster::defaultIdFor`) or into the holding cluster.
    - **Lists, exports and records** show the HEI and its region, never a cluster.

- **Survey insights** (`components/surveys/survey-insights.tsx`, above the Survey library on `/admin/surveys`; what each figure counts is in `docs/survey-analytics.md`): the dashboard's grammar.
    - **Top:** an h2 and a line on anonymity, the scope line (a `brand` dot, the place and period), then `DashboardFilterBar` at the page's own address.
    - **Tiles:** four on hairlines: Responses, Participating HEIs, Female respondents and Live surveys.
    - **Charts:** "Responses over time" (`ActivityChart`, responses alone, so no switch), "Whose voices are we hearing?" (`RespondentsChart`), then "Responses by law" and "Where responses come from" side by side as `RankedBars`. Each row is a name (a law links to its Summary), the figure at 500 with its share muted, and a `--chart-bar` bar under it.
    - **Loading:** skeletons while the figures load.
- **Survey Summary** (`pages/admin/surveys/summary.tsx`, `components/surveys/answer-card.tsx`): the staff frame.
    - **Top:** a back link, then "{code} summary" and the law, then **Summary | Responses** as underlined links (`SurveyTabs`, also on the Responses page).
    - **Filters and tiles:** the scope line, filters (the period, places, Sex, Respondent group), then three `StatTile`s.
    - **Answers:** one card per question, then "About the respondents" two a row from 1024px. Each card:
        - **Rows:** each answer, its count at 500 and share muted, an 8px `--chart-bar` bar, and "n female · n male" in 12px muted text.
        - **Experiences:** a "Who was responsible" `<details>` with 6px bars for each perpetrator.
        - **"View data":** a ghost button (`aria-pressed`) that swaps in a scrollable, focusable table.
    - **Too few responses:** below five in view, a `muted` notice with a shield icon replaces the answers.
- **Survey follow-up questions** (`.survey-conditional` in `public.css`): a question that appears because of an answer sits on a full-width `muted` tint right under that answer. Gender identity, then the optional Sexual orientation, follow Sex assigned at birth, with the same choices for every answer. Student or employee details follow the respondent group, according to the group's follow-up setting in Settings → Respondent groups. Changing the respondent group clears that group's follow-ups. Short choose-one lists are radio buttons (`RadioField`, ink `accent-color`), and longer ones are selects. Check-all-that-apply options are pills (`ChoiceChip`). The survey's controls live in `components/survey/fields.tsx`. Follow-up edits have no draft: saving them changes every open survey at once, and the editor says so.

## Dark mode

Dark mode uses the `dark` palette above: warm, faintly violet neutrals. Brand, violet and red are lifted for contrast on dark. The public site (`.public-theme`) follows the same setting. `.dark .public-theme` in `public.css` maps these values, with cards one step above the page and muted bands one step below, as in light. Signature cream becomes a warm dark tone (`signature-cream` above), so highlighted states still read as cream. The swap is screen only, so printouts stay light. The header lockup sits on a white plate inside its frame in dark mode, because the official file is transparent there.

## Do and don't

**Do**

- Keep the primary action near-black; let purple be the brand accent, not the button color.
- Use at most one signature surface per screen region.
- Route every color through a token in `app.css` / `.public-theme`. Don't hard-code hex values in components.
- Check contrast for any new text-on-surface pairing (≥4.5:1 text, ≥3:1 UI borders).

**Don't**

- Don't bring back Airtable's own brand colors (coral `#aa2d00`, forest `#0a2e0e`) or its licensed Haas font.
- Don't color chart or data series pink/blue by gender. The official app icon is the exception: it is a fixed asset.
- Don't set text below 12px, or form inputs below 16px on mobile.
- Don't bold display type past 500.
