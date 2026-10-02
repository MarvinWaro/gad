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
    callout-gradient: 'linear-gradient(120deg, #fde2eb 0%, #fbe9f0 45%, #efe3f8 100%)'
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
    callout:
        backgroundColor: '{colors.callout}'
        backgroundImage: '{colors.callout-gradient}'
        textColor: '{colors.ink}'
        rounded: '{rounded.md}'
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

The structure is editorial: white canvas, dark-ink type, generous whitespace, one near-black primary action per view. The brand is **not** spread across every control. It appears in a few deliberate **signature surfaces**: a deep-violet card, a soft pink-to-lilac callout, the logo itself.

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
- **Callout** `{colors.callout-gradient}`: the HEI law-surveys panel, a pastel pink (from the PHLGADIS pink) drifting to lilac toward the violet card beside it. Applied with `bg-callout bg-callout-gradient`; the solid `{colors.callout}` is the fallback and the HEI text-selection color. Keep it pastel: ink text must stay ≥4.5:1 across the whole gradient.
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
- **Form inputs are 16px on screens ≤900px** so iOS Safari doesn't zoom on focus.
- Use `tabular-nums` for counts, stats and table figures.
- Known exception: Recharts axis ticks (10–11px) inside fixed-width axes. Revisit only with a visual check.

## Layout

- 4px base unit; tokens as in `spacing`.
- Public site: `.public-container` caps at 1280px; `.public-section` uses 96px vertical rhythm (64px ≤900px, 48px ≤600px).
- App: shadcn sidebar-inset shell; content cards on canvas, sidebar on `surface-soft`.
- **Staff pages fill the content area** with the same padding at every width and browser zoom (`flex flex-1 flex-col gap-6 p-4 md:p-6`): the dashboard, the modules and the Settings lists alike, so zooming out never opens margins on one page and not another. Only reading columns stay narrow: the Gender Mainstreaming feed, Notifications, My Profile and short Settings forms (Profile, Password, Appearance). In top navigation every page sits in the 1280px column, except the HEI home.
- **Page changes cross-fade** (`lib/page-transitions.ts`, set as Inertia's default visit options): a 180ms ease-out View Transition when moving to another page.
    - Filters, partial reloads, infinite scroll, forms and background refreshes never fade, so they never flash or block a click.
    - With reduced motion the swap is instant. Browsers without View Transitions swap as before.
- **The app's top bar sticks** in both navigation styles and for every role, on an opaque `background` so the page scrolls under it. With the sidebar it holds just inside the inset card's 8px frame on desktop, keeping its rounded top corners (a `sidebar`-coloured cap behind it hides what scrolls past), and sits at the very top on phones. The top header (HEI accounts, and staff who choose it) is one 56px row that sticks at every width. The layouts set `--app-header` to where the sticking bar ends; sticky rails and in-page jumps use `top-below-header` and `scroll-mt-below-header` (24px below it) instead of fixed offsets.
- Whitespace is the atmosphere. No gradient, mesh or glow backdrops, with one exception: the pastel callout gradient on the HEI law-surveys panel. (Line fades, such as the timeline's, and the corner fade behind a post's goal badges are not backdrops.)
- **Dot texture** (`dot-backdrop` utility in `app.css`): a faint 14px halftone dot grid (ink at 16%) pinned to the top-right corner of the window, and softly the bottom-left, staying put while the page scrolls. It is a sticky, screen-sized layer that takes no space, so it stays inside its surface (the admin card keeps a clean frame). It goes on page surfaces (HEI shell, admin inset card, auth wrapper, public landing and survey pages) as a block or top-aligned flex column, never on cards, dialogs or menus. Opaque sections such as the landing statistics band cover it by design.

## Elevation and shape

- Depth comes from **color blocks first, shadow second**. Cards are flat with a hairline border. Law cards lift with a soft shadow on hover and focus only.
- Radius: 12px (`rounded.lg`) for buttons, cards and signature surfaces; 10px for callouts and date badges; 6px for inputs; full for avatars and icon buttons. No pill-shaped buttons.

## Components

- **Primary button**: ink background, white text, 44px tall, 12px radius. One per view.
- **Outline button**: canvas background, `border-input` outline. The natural partner to the primary button.
- **Destructive button**: signature red with white text.
- **Confirm popover** (`confirm-popover.tsx`): every delete and deactivate asks here, anchored to the button that asked, never in a browser `confirm()` or a full modal. It has a title naming the item, one or two lines on the consequence, then Cancel (which gets focus) and a red confirm. The confirm shows a spinner while the request runs, and the popover closes when the request ends. Reactivating, restoring or un-archiving needs no confirmation. When a menu item asks, like a post's "⋯ → Delete post", the popover opens once the menu has closed and points at the menu's button (`anchorOnly` with a controlled `open`).
- **View-only pages**: when someone can open a page but not change it (the survey builder without `surveys.update`), a "View only" note at the top names the permission to ask for. Fields turn read-only with a `muted` fill and full-strength text, which can still be selected. The editing buttons (add, move, remove, save) are hidden, not disabled. Never leave fields that take typing but cannot be saved. The builder does this through `ReadOnlyContext` (`components/survey-builder/read-only.ts`).
- **Signature violet card**: HEI home "next event". White text at 75–80% opacity for meta text, underlined links in `on-signature`.
- **Callout**: HEI law-surveys panel on `{colors.callout-gradient}`. Ink text, dividers in ink at 15% opacity.
- **Sidebar**: `surface-soft` background, cream active item. Staff items sit under four labels, in this order: Overview (Dashboard), Monitoring (Reports, Training Survey, Compliance Survey), Community (Gender Mainstreaming, Events) and Public site (Surveys, Carousel, Feedback). A label with nothing the account may open is left out. `appNavigationGroups` in `lib/app-navigation.ts` is the one list for the sidebar, the top header and the phone menu. The current item is the one whose address the page's path starts with, the longest match winning (`activeNavItem`), so the Training Survey page lights Training Survey, not Reports.
- **Top header** (`app-header.tsx`): one row across the full width, laid out like Facebook's (a `1fr auto 1fr` grid, so the tabs sit in the true centre), 56px with a hairline under it.
    - **Left:** the official icon alone on its round white plate, a link named "PHLGADIS home", then the search.
    - **Search** (`header-search.tsx`): from 768px a 40px field on `muted` with a search icon, 10px radius (the input family, not a pill), "Search PHLGADIS". It finds nothing yet: while it has focus a small panel under it says "Search is coming soon. You'll be able to find people and institutions here.", the field's description, and Enter goes nowhere. Below 768px a search icon opens the same field and note in a popover.
    - **Middle (from 1024px):** the navigation as icon tabs, a 48px hover box (`muted`, rounded-lg) 64px wide, 96px from 1280px. Each is named by its label (a bottom tooltip on hover and focus, and its accessible name); the current one is ink over a 2px ink line on the hairline, the others muted. A group marked `menu` (Monitoring) is one tab with a small chevron that opens its labelled items; it carries the line when one of them is current.
    - **Right:** the header actions, then the account avatar (its name is for screen readers only, as on Facebook).
    - **Phones and tablets** (below 1024px): the tabs give way to a menu button, left of the icon, opening a side sheet with the same groups under their labels.
    - HEI accounts get Home, Events, then Monitoring (Records, Training Survey, Compliance Survey) for HEI Focals.
- **App icon** (`app-logo-icon.tsx` → `public/assets/img/gadicon.png`): the official ⚥ icon supplied by CHED central office. It is used as-is in the sidebar, header, auth pages, the CHED official-post avatar and the favicons (`public/favicon.svg` embeds the same PNG, unmodified). Never redraw, recolor or replace official CHED/PHLGADIS assets.
- **Header actions** (`header-actions.tsx`): the notifications bell (`NotificationBell`, see Notifications) and a light/dark toggle, to the left of the account avatar in the top header and at the right end of the sidebar layout's top bar. The toggle is `ThemeToggle` (`theme-toggle.tsx`), which the public site header uses too.
- **FAQ** (public header): a plain "FAQ" link after the section links, styled like them, and last in the phone menu. The FAQ opens with the old page's prose: a larger lead paragraph, then the objectives as a two-column bulleted list (one column on phones). The questions follow as `<details>` rows on hairlines under an ink rule, and the page ends with a contact panel (the survey "coming soon" panel style) holding the hotline and email.
- **Timeline** (`pages/about/gad-herstory.tsx`, `.timeline*` in `public.css`): after shadcnblocks' timeline4, without its outer frame. Steps alternate text and media either side of a hairline centre line. A 2px `brand` line grows down it as the reader scrolls, its tip at the middle of the screen. Both lines fade out at their ends (fixed 80–140px fades), as in timeline4. Text faces the axis (right-aligned on the left side) with a 12px date, a title-md heading and muted body. On the axis sits a 44px card-bordered badge with a cream inner square and a lucide icon for the kind of milestone. Media sit in a dashed `border-input` frame hatched in `hairline`; a step without a photo shows its year there. Below 900px it becomes one column with the line and badges down the left.
- **Page tabs** (`/about`, `.about-tabs` in `public.css`): a bar pinned under the site header (88px, 76px ≤900px, 70px ≤600px) on the page background with a hairline under it. Tabs look like the header links: `nav-foreground` text, the chosen one ink with a 2px ink underline. On phones the bar scrolls sideways.
- **PHLGADIS logo** (`PhlgadisLogo`, `components/public/phlgadis-logo.tsx`): gadlogo.png on the light theme; in dark mode the compact gadlogo2.png on the header's white plate (`.lockup-plate`). Used by the footer and the Logo tab; the header always uses gadlogo2.png.
- **Logo explainer** (`.logo-block` in `public.css`, the Logo tab of `/about`): each official logo in a 220px column beside its explanation, sticky under the tab bar from 901px; body text muted with the source's bold terms in ink at 600. Stacked on phones.
- **A.C.H.I.E.V.E. tiles** (`.achieve-*`): CHED's agenda as rows on hairlines under an ink rule, each led by an 80px lettered tile with an uppercase THRUST/ENABLER label. Thrusts use `--thrust` (flag blue) and enablers `--enabler` (flag red), in both themes; both tokens live in `app.css`, shared with the post goals below. Apart from the bell's unread count, those are the only places flag red appears outside errors and the campaign category, because they reproduce CHED's own agenda colours.
- **SDG tiles** (`.goal-tile`, the SDG tab of `/about`): six a row, 8px radius, each a link to its UN goal page. Hover or keyboard focus lays `--media-scrim` over the tile, zooms the artwork 4%, and shows a frosted "Read more ↗" label (`--media-label`, 8px radius, not a pill).
- **Rate PHLGADIS** (`rate-widget.tsx`, `.rate-*` in `public.css`): an ink button fixed at the bottom-left of the homepage (44px, float shadow) opening a 360px popover card above it. Brand-purple uppercase eyebrow, a title-sm question, five 28px stars that fill in `brand` (hover previews, the chosen meaning shows under them), an optional textarea, a lock-iconed privacy line, and a full-width primary "Submit feedback". A thank-you state with a success check replaces the form.
- **Website feedback** (`pages/feedback.tsx`, `components/feedback/`; what it asks and who reads it are in `docs/feedback.md`):
    - **Form:** the law surveys' frame (progress bar, cards, Back and Continue) in an 860px reading column, in four steps: Your feedback, Agreement, Ease of use, Your details.
        - Steps already opened are buttons in the progress bar.
        - Only step 1 has required answers; the scale steps carry a muted "Optional".
        - A new step fades in and rises 6px over 200ms (instant with reduced motion), and its heading takes focus.
    - **Type tiles:** four tiles, two a row, with the icon over the words on phones. Real radios are stretched over them. The chosen tile is ink, like a checked chip.
    - **Rated questions:** a row of equal 44px buttons: 1 to 5 with the end words under the row, or the four answers' words, 2×2 on phones.
        - Radios sit underneath, so arrow keys move along the row.
        - The end numbers carry their words for screen readers ("1 Strongly Disagree").
        - Borders are `border-input`, and the chosen button is ink.
        - "Clear" undoes an optional answer and keeps focus on the question.
    - **Details:** Email, Name, Region (from the database), then a searchable institution picker for that region, with a lock line saying who sees them. The surveys' confirmation panel replaces the form once sent, and its heading takes focus.
    - **Staff page** (`/admin/feedback`, Public site → Feedback): the usual full-width frame.
        - A filter card: search, Type and the place filters.
        - Stat tiles (`StatTile`, shared with Site ratings).
        - Bar rows: the label and its figure on one line, a `--chart-bar` bar under them. They show the types (each row filters the list), the reading and layout answers, and each statement's average, with a "View answer counts" table under each scale.
        - The list: each row has a type badge, two lines of the feedback, then place · sender · time. "Details" opens every answer, an email link and Delete.
- **Switch** (`ui/switch.tsx`): the one on/off control, 44×24, ink when on. It is named by the label beside it.
- **Registration card** (`registration-panel.tsx`, Settings → Users, above the status tabs): one row per region the manager covers. Each row has the region's name, an emerald "No approval" pill while open, what happens to new accounts (and until when, in Philippine time), and a switch. Switching on asks first, in a popover anchored to the switch, with an optional "Close automatically at" time. Switching off takes effect at once, since it is the safe direction. An outline "Show 17 regions" / "Hide regions" button (chevron down, up when open) folds the list away, and the header line still names the regions that skip approval, with the same pill. A single region starts unfolded; a longer list starts folded. The register form asks for a Region first: every active region, in the survey pickers' order (chosen already when only one is listed). It narrows the HEI list and says what will happen: straight in, or wait for approval. A region whose institutions have not arrived from the CHED directory yet says so, with its office's email when set, and the HEI field reads "No institutions available". Mobile number and sex are left to Settings → Profile, where both are optional.
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
    - **Tabs: Posts · Activity · About.** Posts is the person's own Gender Mainstreaming posts in the feed's cards (`Feed`, without the new-posts check), beside the About and Following cards; with none, an empty state links to where they post. Activity is their own activity log (`ActivityTimeline`, the admin log's entries without the person filter; View links only to pages they may open). Both arrive just after the page with skeletons and load more as you scroll. About lists the account details.
- **Staff dashboard** (`pages/dashboard.tsx`, `components/dashboard/`; what each figure counts is in `docs/dashboard.md`): the staff pages' full-width frame.
    - **Top:** greeting, title and the Open Gender Mainstreaming button. Then the scope line, a `brand` dot with the place in view and the period, and the range in muted text. Then one filter card, applied as values change: Academic year, View by (Whole year / Semester / Month), the semester or month, the place filters (`PlaceFilters`), Ownership and Law survey.
    - **Overview:** four stat tiles on hairlines: Survey responses, Participating HEIs, GAD posts and Accounts. Each has a 36px figure, its change or note in `brand` at 500, and a muted detail line.
    - **Participation over time:** a Survey responses / Posts shared switch (`aria-pressed`, on a `muted` track), then one area series at a time: responses in `chart-2`, posts in `chart-3`. A "View data" table shows the same points. Beside it, the signature-violet "Every campus counts." card shows participation per region, or the HEIs yet to contribute when one region is in view.
    - **Goals** (`goal-insights.tsx`, "Where GAD work meets the goals", full width), the dashboard's main section. Underline tabs: SDGs and A.C.H.I.E.V.E. Agenda.
        - **Summary:** a muted strip with tagged posts, goals covered and HEIs contributing.
        - **Ranked list:** each row has the goal's whole square icon (40px; never rounded, covered or dimmed) or the agenda letter tile (`AgendaTile`), "5 · Gender Equality", a single-hue bar in `--chart-bar` (square at the baseline, 4px-rounded tip) on a `muted` track, and the count and share. Rows are toggle buttons; the chosen one gets a 2px ink ring around the row, outside the icon. A Most posts / Goal order switch sorts them, and goals without posts wait behind "Show the N goals with no posts yet".
        - **Details panel** (sticky on wide screens): the chosen goal, or all goals. It lists top regions as bars, then the top five HEIs with rank chips, then the CHED office's share.
        - **Heatmap table:** places as rows, goals as columns, every figure printed. The tint uses the `--heat-1…4` ramp: one violet, darker is more, each step at least 2:1 on the card. Ink figures sit on steps 1–2 and light ones on 3–4, flipped in dark mode. Cells have 2px gaps. A zero is a dot. The chosen goal's column is outlined, with its header in ink. The table scrolls inside its own box with a sticky first column.
        - **Footnotes:** the counting note, then the UN credit and disclaimer (`SdgCredit`) under SDGs, or the agenda link under A.C.H.I.E.V.E.
    - **Donuts** (`DonutChart` in `dashboard-charts.tsx`): a ring (inner radius 68%, 2px card-coloured gaps, no animation) with the total and its noun in the middle. Beside it is a legend table that repeats every figure and share, so colour is never the only key. Slices take `--series-1…4` in a fixed order per chart (brand violet, orange, aqua, yellow), so a value keeps its colour whatever the filters leave. "Not given", "Other" and unrecorded values take grey `--series-other`, and past four values fold into it. The ring is out of the tab order, with a hover tooltip for mouse users.
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
- **Feed loading** (`feed.tsx`, `use-new-posts.ts`; the HEI home and `/community`):
    - **First open:** the feed is a deferred prop, so the page appears at once with two post-shaped skeletons (byline, two lines, a 16:10 photo, the action row) and a "Loading posts" status; the first five posts replace them.
    - **Older posts** load by themselves, five at a time, 800px before the reader reaches the end, with the same skeleton meanwhile. "You're all caught up" with a check marks the end.
    - **Photos** shimmer in their tiles (`bg-primary/10`, pulsing unless the reader prefers reduced motion) until each one arrives.
    - **Newer posts:** a reader who comes back after 30 seconds or more away (another tab, a locked phone) triggers one small check. At the top of the feed the new posts load straight in, with a skeleton at the top meanwhile. Further down, a "3 new posts ↑" button (ink, 12px radius, float shadow) floats 12px under the top bar without moving the page; it scrolls up and loads them. A status line announces both to screen readers.
- **HEI home** (`pages/hei/home.tsx`), laid out like Facebook from 1280px: the page drops the 1280px column (`data-layout="wide"`) and spreads three columns across the screen, the rails at its edges and the feed centred, at most 42rem (`17rem · 42rem · 20rem`, then `22rem · 42rem · 22rem` from 1536px).
    - **Left rail:** the institution's name (h1, 24px) and greeting, then the law surveys stacked in their callout (`SurveyPanel variant="rail"`): each law on hairlines with its code, title, count from the HEI and Open survey · Copy link.
    - **Middle:** "HEI Gender Mainstreaming Efforts", the composer and the feed, nothing else.
    - **Right rail:** the next event, the calendar, later events and quick links.
    - **1024–1279px:** the name over the page, the law surveys panel above the feed, the right rail beside it. **Below 1024px:** one column: name, law surveys, events and links, then the feed.
    - **Both rails** stick via `useStickyRail`: under the header when they fit, otherwise they scroll until their end is visible and hold. They never scroll internally.
- **Event category dots**: training = brand, campaign = signature red, deadline = mustard, meeting = ink, other = muted.
- **Glossary** (`pages/resources/definition-of-terms.tsx`, `.glossary-*` in `public.css`): term | definition rows on hairlines, grouped under each Act by an ink rule with its cream `law-number` pill and a "Read the Act" link to its full text. A toolbar (sticky from 901px) holds the search (matches in `brand-soft` with a brand underline, `/` to focus, Esc to clear) and law chips; the chip for the group in view is cream. Every term has an anchor and a copy-link button, and a term opened from a link tints `brand-soft` once. Resource pages live at `/resources/{area}`, share the `ResourcePage` frame, and, like `welcome` and `surveys/`, render without the app layout (`app.tsx`). Document pages (Republic Acts, Issuances, Manuals) share `DocumentRow` / `.resource-row`: one row per document on hairlines under an ink rule, led by its artwork or a small document tile (`data-media="icon"`), a cream number pill, and an outline "Read the …" button (no primary button, since a page has several) with "PDF · size" or the host site written underneath. Links to related laws are small bordered chips.
- **Clusters only when used**: a cluster is a choice only when a region's institutions sit in two or more clusters (`PlaceFilters::clusterChoices`). Until then, for example while every HEI is "Unassigned", every place picker goes from region straight to HEI:
    - **Public survey:** choosing the region picks its one cluster, so the response still records it.
    - **Monitoring, GAD survey and Users filters, and the HEI directory:** the Cluster filter is left out.
    - **Registration and the user form:** they never ask for a cluster.
    - **Settings → HEIs, Add/Edit HEI:** the region is required, and an optional "Cluster" select appears only in such a region. Otherwise the institution waits in the region's holding cluster (`SurveyCluster::holdingFor`).

    Assigning institutions to a second cluster brings the step back without code changes. The holding cluster "Unassigned" is never shown as a place (`placeLine` in `lib/places.ts`).

- **Survey follow-up questions** (`.survey-conditional` in `public.css`): a question that appears because of an answer sits on a full-width `muted` tint right under that answer. Gender identity follows Sex (Female or Male only). Student or employee details follow the respondent group, according to the group's follow-up setting in Settings → Respondent groups. Changing the answer above clears the follow-up. Short choose-one lists are radio buttons (`RadioField`, ink `accent-color`), and longer ones are selects. Check-all-that-apply options are pills (`ChoiceChip`). The survey's controls live in `components/survey/fields.tsx`. Follow-up edits have no draft: saving them changes every open survey at once, and the editor says so.

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
