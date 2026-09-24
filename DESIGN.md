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
- **Flag red** (`{colors.signature-red}` #ce1126), the "IS" letters. Reserved for destructive actions, errors, and the "campaign" event category.

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

- **Destructive** `{colors.signature-red}`: delete buttons, error toasts, and error alerts (red text on a card, never white-on-white).
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
- Whitespace is the atmosphere. No gradient, mesh or glow backdrops, with one exception: the pastel callout gradient on the HEI law-surveys panel.
- **Dot texture** (`dot-backdrop` utility in `app.css`): a faint 14px halftone dot grid (ink at 16%) that fades in from the top-right corner, and softly from the bottom-left, of a surface's first screen. It is applied to the page surfaces (HEI shell, admin inset card, auth layout, public landing and survey pages) and never to cards, dialogs or menus. It's pure CSS, painted once, and sits between the surface background and its content.

## Elevation and shape

- Depth comes from **color blocks first, shadow second**. Cards are flat with a hairline border. Law cards lift with a soft shadow on hover and focus only.
- Radius: 12px (`rounded.lg`) for buttons, cards and signature surfaces; 10px for callouts and date badges; 6px for inputs; full for avatars and icon buttons. No pill-shaped buttons.

## Components

- **Primary button**: ink background, white text, 44px tall, 12px radius. One per view.
- **Outline button**: canvas background, `border-input` outline. The natural partner to the primary button.
- **Destructive button**: signature red with white text.
- **Signature violet card**: HEI home "next event". White text at 75–80% opacity for meta text, underlined links in `on-signature`.
- **Callout**: HEI law-surveys panel on `{colors.callout-gradient}`. Ink text, dividers in ink at 15% opacity.
- **Sidebar**: `surface-soft` background, cream active item.
- **App icon** (`app-logo-icon.tsx` → `public/assets/img/gadicon.png`): the official ⚥ icon supplied by CHED central office. It is used as-is in the sidebar, header, auth pages, the CHED official-post avatar and the favicons (`public/favicon.svg` embeds the same PNG, unmodified). Never redraw, recolor or replace official CHED/PHLGADIS assets.
- **Header actions** (`header-actions.tsx`): a notifications bell (placeholder until notifications ship) and a light/dark toggle, to the left of the account avatar in the HEI header and at the right end of the admin top bar.
- **Status badges**: live/active = emerald tint, draft/pending = amber tint, archived/inactive = muted. Admin tables all share this mapping.
- **HEI home right rail**: sticky via `useStickyRail`. It sticks under the header when it fits, otherwise it scrolls until its end is visible and holds. It never scrolls internally.
- **Event category dots**: training = brand, campaign = signature red, deadline = mustard, meeting = ink, other = muted.

## Dark mode

Dark mode uses the `dark` palette above: warm, faintly violet neutrals. Brand, violet and red are lifted for contrast on dark. The public site (`.public-theme`) pins its light palette and stays light.

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
