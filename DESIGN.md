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
- **Flag red** (`{colors.signature-red}` #ce1126), the "IS" letters. Reserved for destructive actions, errors, the "campaign" event category, and the enablers of CHED's A.C.H.I.E.V.E. Agenda (its own colours).

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
- **The app's top bar sticks** in both navigation styles and for every role, on an opaque `background` so the page scrolls under it. With the sidebar it holds just inside the inset card's 8px frame on desktop, keeping its rounded top corners (a `sidebar`-coloured cap behind it hides what scrolls past), and sits at the very top on phones. The layouts set `--app-header` to where the bar ends; sticky rails and in-page jumps use `top-below-header` and `scroll-mt-below-header` (24px below it) instead of fixed offsets.
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
- **Sidebar**: `surface-soft` background, cream active item. Staff items sit under four labels, in this order: Overview (Dashboard), Reporting (Monitoring), Community (Gender Mainstreaming, Events) and Public site (Surveys, Carousel). A label with nothing the account may open is left out. `appNavigationGroups` in `lib/app-navigation.ts` is the one list, and the top bar shows the same items in one row.
- **App icon** (`app-logo-icon.tsx` → `public/assets/img/gadicon.png`): the official ⚥ icon supplied by CHED central office. It is used as-is in the sidebar, header, auth pages, the CHED official-post avatar and the favicons (`public/favicon.svg` embeds the same PNG, unmodified). Never redraw, recolor or replace official CHED/PHLGADIS assets.
- **Header actions** (`header-actions.tsx`): a notifications bell (placeholder until notifications ship) and a light/dark toggle, to the left of the account avatar in the HEI header and at the right end of the admin top bar. The toggle is `ThemeToggle` (`theme-toggle.tsx`), which the public site header uses too.
- **FAQ** (public header): a plain "FAQ" link after the section links, styled like them, and last in the phone menu. The FAQ opens with the old page's prose: a larger lead paragraph, then the objectives as a two-column bulleted list (one column on phones). The questions follow as `<details>` rows on hairlines under an ink rule, and the page ends with a contact panel (the survey "coming soon" panel style) holding the hotline and email.
- **Timeline** (`pages/about/gad-herstory.tsx`, `.timeline*` in `public.css`): after shadcnblocks' timeline4, without its outer frame. Steps alternate text and media either side of a hairline centre line. A 2px `brand` line grows down it as the reader scrolls, its tip at the middle of the screen. Both lines fade out at their ends (fixed 80–140px fades), as in timeline4. Text faces the axis (right-aligned on the left side) with a 12px date, a title-md heading and muted body. On the axis sits a 44px card-bordered badge with a cream inner square and a lucide icon for the kind of milestone. Media sit in a dashed `border-input` frame hatched in `hairline`; a step without a photo shows its year there. Below 900px it becomes one column with the line and badges down the left.
- **Page tabs** (`/about`, `.about-tabs` in `public.css`): a bar pinned under the site header (88px, 76px ≤900px, 70px ≤600px) on the page background with a hairline under it. Tabs look like the header links: `nav-foreground` text, the chosen one ink with a 2px ink underline. On phones the bar scrolls sideways.
- **PHLGADIS logo** (`PhlgadisLogo`, `components/public/phlgadis-logo.tsx`): gadlogo.png on the light theme; in dark mode the compact gadlogo2.png on the header's white plate (`.lockup-plate`). Used by the footer and the Logo tab; the header always uses gadlogo2.png.
- **Logo explainer** (`.logo-block` in `public.css`, the Logo tab of `/about`): each official logo in a 220px column beside its explanation, sticky under the tab bar from 901px; body text muted with the source's bold terms in ink at 600. Stacked on phones.
- **A.C.H.I.E.V.E. tiles** (`.achieve-*`): CHED's agenda as rows on hairlines under an ink rule, each led by an 80px lettered tile with an uppercase THRUST/ENABLER label. Thrusts use `--thrust` (flag blue) and enablers `--enabler` (flag red), in both themes; both tokens live in `app.css`, shared with the post goals below. Those are the only places flag red appears outside errors and the campaign category, because they reproduce CHED's own agenda colours.
- **SDG tiles** (`.goal-tile`, the SDG tab of `/about`): six a row, 8px radius, each a link to its UN goal page. Hover or keyboard focus lays `--media-scrim` over the tile, zooms the artwork 4%, and shows a frosted "Read more ↗" label (`--media-label`, 8px radius, not a pill).
- **Rate PHLGADIS** (`rate-widget.tsx`, `.rate-*` in `public.css`): an ink button fixed at the bottom-left of the homepage (44px, float shadow) opening a 360px popover card above it. Brand-purple uppercase eyebrow, a title-sm question, five 28px stars that fill in `brand` (hover previews, the chosen meaning shows under them), an optional textarea, a lock-iconed privacy line, and a full-width primary "Submit feedback". A thank-you state with a success check replaces the form.
- **Site ratings** (`settings/ratings.tsx`): a switch row for the button, a KPI row of three stat tiles (proportional figures), a "Ratings by stars" breakdown whose rows filter the list (10px bars in `--chart-rating`, square at the baseline and 4px-rounded at the tip, on a `muted` track; count and share in muted text), then the ratings table with star marks and delete. `--chart-rating` is `brand` in light and `#a57cd4` in dark, one step deeper than the dark brand so the bars sit in the dark lightness band.
- **Notice panel** (`.notice-panel`): icon, a short heading and line, then its action on a `muted` tint with a hairline border. Used by the unpublished survey, the FAQ's contact box and the About page's link to the timeline.
- **Status badges**: live/active = emerald tint, draft/pending = amber tint, archived/inactive = muted. Admin tables all share this mapping. Monitoring reports' stage pills (`components/monitoring/shared.tsx`) apply it by whose turn it is: amber with an icon while the HEI has work to do (Draft, Returned for correction, Ready to sign), `brand-soft` while CHED reviews (Submitted), emerald once Reviewed. Never red: a returned report is not an error.
- **Records tabs** (`records-tabs.tsx`): Monitoring, Training Survey and Compliance Survey, as links under the page heading, for HEIs (Records) and CHED (Monitoring) alike. They follow the page-tabs look: muted text, and the current tab in ink with a 2px ink underline on the hairline, 44px tall. The sidebar or header item stays active on every tab.
- **Checklists** (`checklist-items.tsx`): the GAD surveys' items as bordered tiles (one column on phones, two from 640px) under a "Check all" box that shows a dash when only some are checked, with a live "N of M checked". A checked tile turns `brand-soft` with a brand border. CHED reads an answer as every item with a brand check or an empty circle; unchecked items are muted.
- **Post composer** (`post-composer.tsx` + `post-composer-views.tsx`): a compact prompt card (with Photos / Tag people / Feeling / SDGs & ACHIEVE shortcuts, icons only below 640px) that opens a "Create post" modal. Sub-views (Tag people, feelings, Photos, and "What does this support?") swap in place with a back arrow and Done; Escape steps back before it closes. "Add to your post" and Post stay pinned while the content scrolls. The draft survives closing the modal.
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
- **Gender Mainstreaming** is the name of the posts feed, as in the old PHLGADIS ("View More Gender Mainstreaming Efforts"): the staff nav item, tab title and breadcrumb say "Gender Mainstreaming" (the address stays `/community`, for CHED staff with `posts.view`). The feed opens with a calm editorial heading, no banner: "HEI Gender Mainstreaming Efforts" with the old HEI page's line "Promoting gender equality and inclusivity in our school community", word for word; the staff page has its own line instead, which tells moderators (`posts.moderate`) how to remove posts.
- **Feed loading** (`feed.tsx`, `use-new-posts.ts`; the HEI home and `/community`):
    - **First open:** the feed is a deferred prop, so the page appears at once with two post-shaped skeletons (byline, two lines, a 16:10 photo, the action row) and a "Loading posts" status; the first five posts replace them.
    - **Older posts** load by themselves, five at a time, 800px before the reader reaches the end, with the same skeleton meanwhile. "You're all caught up" with a check marks the end.
    - **Photos** shimmer in their tiles (`bg-primary/10`, pulsing unless the reader prefers reduced motion) until each one arrives.
    - **Newer posts:** a reader who comes back after 30 seconds or more away (another tab, a locked phone) triggers one small check. At the top of the feed the new posts load straight in, with a skeleton at the top meanwhile. Further down, a "3 new posts ↑" button (ink, 12px radius, float shadow) floats 12px under the top bar without moving the page; it scrolls up and loads them. A status line announces both to screen readers.
- **HEI home right rail**: sticky via `useStickyRail`. It sticks under the header when it fits, otherwise it scrolls until its end is visible and holds. It never scrolls internally.
- **Event category dots**: training = brand, campaign = signature red, deadline = mustard, meeting = ink, other = muted.
- **Glossary** (`pages/resources/definition-of-terms.tsx`, `.glossary-*` in `public.css`): term | definition rows on hairlines, grouped under each Act by an ink rule with its cream `law-number` pill and a "Read the Act" link to its full text. A toolbar (sticky from 901px) holds the search (matches in `brand-soft` with a brand underline, `/` to focus, Esc to clear) and law chips; the chip for the group in view is cream. Every term has an anchor and a copy-link button, and a term opened from a link tints `brand-soft` once. Resource pages live at `/resources/{area}`, share the `ResourcePage` frame, and, like `welcome` and `surveys/`, render without the app layout (`app.tsx`). Document pages (Republic Acts, Issuances, Manuals) share `DocumentRow` / `.resource-row`: one row per document on hairlines under an ink rule, led by its artwork or a small document tile (`data-media="icon"`), a cream number pill, and an outline "Read the …" button (no primary button, since a page has several) with "PDF · size" or the host site written underneath. Links to related laws are small bordered chips.
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
