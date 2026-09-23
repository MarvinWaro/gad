# PHLGADIS UI/UX Modernization Brief for Codex

## Project
Modernize the existing **PHLGADIS (Philippine Higher Education Gender and Development Information System)** frontend using a modern, minimalist, professional, institutional design inspired by **shadcn/ui**.

The current system is functional but uses an older frontend design/framework. The goal is **not** to remove or break existing functionality.

Before changing anything, inspect the existing project structure, routes, controllers/API calls, authentication, database integrations, JavaScript, forms, surveys, statistics, charts, and existing functionality.

Preserve all existing functionality unless a change is specifically required for the UI redesign.

Do not rewrite backend logic unnecessarily.
Do not change database behavior unnecessarily.
Do not remove existing routes or features.
Focus primarily on frontend architecture, layout, responsiveness, components, usability, accessibility, and visual consistency.

---

## Design Direction

Overall visual style:

- Modern
- Minimalist
- Professional
- Institutional
- Government digital-service inspired
- Data/analytics platform inspired
- Clean SaaS-like presentation without making it look like a commercial startup
- Spacious layouts
- Strong typography hierarchy
- Subtle borders
- Minimal shadows
- Consistent card styles
- Responsive
- Accessible
- Easy to customize later

Avoid:

- Excessive gradients
- Too many unrelated colors
- Heavy shadows
- Oversized colored cards everywhere
- Excessive rounded containers
- Cluttered interfaces
- Old-style dashboard visuals
- Multiple competing CTA colors
- Unnecessary animations
- Excessive carousels

---

## Tech / Component Direction

Use **shadcn/ui** as the primary UI/component system where appropriate.

Use reusable components rather than building every page independently.

Possible shadcn components:

- Navigation Menu
- Button
- Card
- Badge
- Tabs
- Select
- Dropdown Menu
- Sheet
- Dialog
- Popover
- Tooltip
- Accordion
- Command
- Input
- Textarea
- Form
- Table / Data Table
- Pagination
- Skeleton
- Separator
- Breadcrumb
- Carousel only when genuinely appropriate
- Chart components / Recharts
- Sidebar for authenticated/admin areas

Use **Lucide icons**.

Create reusable components such as:

- SiteHeader
- MobileNavigation
- SectionHeader
- StatCard
- LawCard
- ResourceCard
- ArticleCard
- CampaignCard
- ChartCard
- FilterBar
- EmptyState
- LoadingState
- FeedbackCTA
- SiteFooter

---

## Color System

Keep the existing PHLGADIS identity based around **orange and violet**, but modernize how they are used.

### Primary Orange
`#F97316`

Use for:
- Primary buttons
- Active navigation
- Important CTAs
- Selected elements
- Small brand accents

### Secondary Violet
`#7C3AED`

Use for:
- Secondary badges
- Supporting highlights
- Certain chart/data states
- GAD-related secondary accents

### Neutral Palette

Background:
`#FAFAFA`

Card / Surface:
`#FFFFFF`

Primary text:
`#18181B`

Secondary / muted text:
`#71717A`

Border:
`#E4E4E7`

Do not make every statistics card a different bright color.

Use mostly neutral surfaces with color used as an accent.

Create the colors through CSS variables / theme tokens so the system can easily be customized later.

Suggested tokens:

- `--primary`
- `--primary-foreground`
- `--secondary`
- `--secondary-foreground`
- `--accent`
- `--muted`
- `--muted-foreground`
- `--background`
- `--foreground`
- `--card`
- `--border`
- `--ring`
- `--chart-1`
- `--chart-2`

---

## Typography

Use a modern, highly readable sans-serif font.

Preferred:

- Geist
- Inter

Suggested hierarchy:

- Hero heading: 48px–64px desktop
- Section headings: 32px–40px
- Card titles: 18px–20px
- Body: 15px–16px
- Metadata / helper text: 13px–14px

Use font weight and whitespace to establish hierarchy rather than making everything bold.

---

## Layout

Use a consistent maximum page width.

Suggested:

`max-width: approximately 1280px`

Centered container with responsive horizontal padding.

Desktop:
24px–32px

Tablet:
20px–24px

Mobile:
16px

Use generous vertical spacing between sections.

Suggested:

- Desktop: 80px–120px
- Tablet: 56px–80px
- Mobile: 40px–64px

---

# Public Homepage Structure

## 1. Header / Navbar

Create a clean sticky navbar.

Left:
PHLGADIS logo

Navigation:

- Home
- Resources
- Surveys
- Data & Statistics
- About

Potential dropdowns can be used where necessary.

Right:

- Search icon if useful
- Login
- Register

Login should be visually secondary.

Register can be the primary orange CTA.

Mobile:
Use a shadcn Sheet / drawer navigation.

Keep the header relatively compact.

---

## 2. Hero Section

Replace the current approach where the homepage immediately focuses on a large carousel/banner.

Use a modern split hero.

### Left

Eyebrow:
**Philippine Higher Education Gender and Development Information System**

Main heading idea:

**Advancing gender-responsive higher education through data.**

Supporting description explaining the purpose of PHLGADIS.

Primary CTA:
**Explore GAD Data**

Secondary CTA:
**Take a Survey**

### Right

Use one of:

- Current GAD campaign visual
- Featured announcement
- Data/statistics visualization
- Current initiative

Do not overcrowd the hero.

---

## 3. Quick Access

Create four quick-access cards.

### GAD Laws
Understand key gender-related legislation.

### Surveys
Participate in available GAD surveys.

### Statistics
Explore higher education GAD data.

### Resources
Access reports, policies and learning materials.

Each card should contain:

- simple icon
- title
- short description
- subtle arrow/link

Use mostly white/neutral surfaces.

---

## 4. Know Your Rights

Keep the existing four laws.

### RA 7877
Anti-Sexual Harassment Act of 1995

### RA 9262
Anti-Violence Against Women and Their Children Act

### RA 9710
Magna Carta of Women

### RA 11313
Safe Spaces Act

Use modern resource/feature cards.

Each card can contain:

- image/illustration
- law number badge
- title
- short description
- Learn More link
- Survey action where appropriate

Avoid repeating oversized bright buttons inside every card.

Section heading:

**Know Your Rights**

Supporting text should explain that users can learn about the four GAD enabling laws and participate in related surveys.

---

## 5. GAD Statistics Overview

Create a modern analytics section.

Heading:

**CHEDRO XII Higher Education GAD Statistical Data**

Add Academic Year filtering.

Example:

`Academic Year [2025–2026 ▼]`

Use shadcn Select or equivalent.

Create three main stat cards:

- Total Enrolled Male — 95,737
- Total Enrolled Female — 132,086
- Grand Total Enrollment — 227,823

Do not use giant blue, pink and green backgrounds.

Instead use:

- white cards
- subtle border
- small icon/badge
- optional percentage
- optional tiny trend/helper text
- orange/violet/data accents only

Example:

**Male Students**
95,737
42.0% of enrollment

**Female Students**
132,086
58.0% of enrollment

**Total Enrollment**
227,823
100%

---

## 6. Enrollment Data Visualization

Place the chart inside a large clean `ChartCard`.

Header:

**Enrollment by Program**

Subtitle:

**Enrollment across academic programs**

Controls may include:

- Academic Year
- Program
- Sex
- Chart type
- Export

Potential segmented tabs:

- All
- Male
- Female

If appropriate, allow:

- Bar
- Line

Prefer a **grouped bar chart** or **horizontal bar chart** because programs are discrete categories.

Programs may include:

- Agricultural
- Architectural
- Business Administration
- Criminal Justice
- Education
- Engineering
- Fine and Applied Arts
- Humanities
- IT-Related
- Law and Jurisprudence
- Maritime
- Mass Communication
- Mathematics
- Medical and Allied
- Natural Science
- Other Disciplines
- Religion and Theology
- Service Trades
- Social and Behavioral

Use shadcn chart styles / Recharts.

Make chart labels readable and responsive.

Use accessible chart colors.

---

## 7. Data Explorer

Add a section allowing users to quickly explore major data groups.

Examples:

- Enrollment
- Graduates
- Faculty
- Programs

Each item can contain:

- icon
- metric
- short description
- link

Example:

**Enrollment**
227,823 students
View enrollment data →

**Graduates**
31,990 graduates
View graduate data →

Include:

**Open Data Explorer →**

---

## 8. Gender Mainstreaming / Featured Stories

Replace the current giant orange “Top 5 Featured Posts” section with a more editorial layout.

Heading:

**Gender Mainstreaming in Action**

Use a Bento / editorial layout.

Desktop example:

- Large featured article on the left
- Two smaller articles stacked on the right

Article cards contain:

- category
- date
- title
- short description
- image
- read article link
- optional engagement count

Avoid making the entire background bright orange.

Use orange as a small accent.

Avoid a carousel unless the content genuinely requires sliding.

---

## 9. Current Campaign

Keep important campaigns such as:

**18-Day Campaign to End Violence Against Women**

Display them as a dedicated campaign CTA/banner rather than dominating the entire homepage.

Suggested layout:

**18-Day Campaign to End VAW**

Learn more about the campaign, activities and related information.

`[Learn More]`

Campaign artwork/image on the right.

Use a light orange-tinted surface or subtle gradient.

---

## 10. Resources

Create a dedicated resources section.

Cards can include:

- GAD Laws
- Policies & Guidelines
- Publications
- Reports & Statistics
- Learning Materials
- Downloads

Each card:

- icon
- title
- short description
- link

---

## 11. Feedback CTA

Modernize the existing feedback section.

Heading:

**Help us improve PHLGADIS**

Description:

**Your feedback helps us improve the information and services available through the platform.**

Button:

**Share Feedback**

Use a centered CTA area with a subtle background.

---

## 12. Footer

Create a professional institutional footer.

Suggested structure:

### PHLGADIS
Philippine Higher Education Gender and Development Information System

### Explore
- Home
- Statistics
- Surveys
- Initiatives

### Resources
- GAD Laws
- Publications
- Reports
- Downloads

### Support
- Help Center
- Contact
- Feedback
- Privacy

### CHED Regional Office XII
Include existing hotline and email.

Email:
`chedro12@ched.gov.ph`

Include existing institutional logos where required.

Bottom row:

- © CHEDRO XII
- Privacy
- Accessibility
- Terms

Keep the footer clean and not excessively tall.

---

# Card Design System

Default cards:

- white background
- subtle neutral border
- 12px approximate radius
- little or no shadow
- generous internal padding

Suggested style concept:

- `rounded-xl`
- `border`
- `bg-card`
- `shadow-sm` only when necessary

Avoid heavy floating shadows.

Hover states may use:

- subtle border emphasis
- tiny elevation change
- icon/arrow movement if appropriate

Avoid exaggerated animations.

---

# Button System

Primary:
Orange filled

Secondary:
Neutral / outline

Ghost:
Navigation and tertiary actions

Destructive:
Only for genuinely destructive actions

Use one primary action per visual area whenever possible.

---

# Spacing

Use an 8px-based spacing system.

Suggested values:

- 4
- 8
- 12
- 16
- 24
- 32
- 40
- 48
- 64
- 80
- 96
- 120

Avoid inconsistent random margins.

---

# Responsiveness

The interface must work properly at:

- Mobile
- Tablet
- Laptop
- Desktop
- Large desktop

Cards should generally use:

Desktop:
3–4 columns

Tablet:
2 columns

Mobile:
1 column

Charts should not overflow horizontally unless absolutely necessary.

Tables may become horizontally scrollable on smaller devices.

Navbar should convert to Sheet navigation.

---

# Accessibility

Follow accessibility best practices.

Include:

- semantic HTML
- visible keyboard focus states
- accessible button labels
- alt text
- sufficient color contrast
- keyboard-accessible dropdowns/dialogs
- form labels
- ARIA attributes where appropriate
- do not rely only on color to communicate meaning

Target WCAG AA where practical.

---

# Animation

Use animations sparingly.

Possible:

- small hover transitions
- subtle card movement
- button transitions
- accordion transitions
- dialog/sheet transitions

Avoid:

- constant floating animations
- excessive motion
- unnecessary parallax
- distracting entrance animations

---

# Loading / Empty / Error States

Create reusable states.

Skeleton loaders for:

- statistics
- charts
- articles
- tables

Empty states for:

- No data available
- No survey available
- No posts available
- No search results

Error states should clearly communicate what failed and provide retry actions where appropriate.

---

# Authentication / Admin Direction

The same design language should later be usable for logged-in/admin pages.

For authenticated/dashboard pages, use a layout inspired by shadcn dashboard/sidebar blocks:

- Sidebar
- Top header
- Breadcrumb
- Page title
- Filter/actions
- Statistic cards
- Charts
- Data tables

Potential sidebar examples:

- Dashboard
- Statistics
- Surveys
- GAD Laws
- Resources
- Gender Mainstreaming
- Users
- Reports
- Settings

The exact navigation must follow existing system functionality.

Do not invent backend modules that do not exist.

---

# Component Architecture

Prefer reusable components and modular composition.

Do not create one giant homepage component.

Possible structure:

```text
components/
    layout/
        SiteHeader
        SiteFooter
        MobileNavigation

    home/
        HeroSection
        QuickAccess
        RightsSection
        StatisticsSection
        EnrollmentChart
        DataExplorer
        FeaturedStories
        CampaignSection
        ResourcesSection
        FeedbackCTA

    data/
        StatCard
        ChartCard
        FilterBar

    shared/
        SectionHeading
        ResourceCard
        ArticleCard
        EmptyState
        LoadingState
```

Adjust this structure according to the actual framework/project architecture.

---

# Important Implementation Rules

1. Inspect the project first.
2. Identify the current frontend framework and version.
3. Determine whether shadcn/ui can be introduced directly or whether the current frontend needs a staged migration.
4. Do not blindly replace working code.
5. Preserve:
   - authentication
   - surveys
   - statistical calculations
   - database queries
   - API requests
   - forms
   - validation
   - routing
   - permissions
   - existing backend functionality
6. Separate visual/UI refactoring from backend logic.
7. Reuse existing data sources.
8. Remove obsolete CSS only after confirming it is unused.
9. Do not hard-code statistics currently coming from the database.
10. Avoid hard-coding content that currently comes from the CMS/database.
11. Maintain existing SEO/meta information where appropriate.
12. Keep image optimization in mind.
13. Make all sections responsive.
14. Keep components customizable.
15. Prefer theme variables instead of hard-coded colors scattered throughout components.

---

# Design Goal

The final PHLGADIS frontend should feel like a modern public-sector digital service and higher-education data platform.

It should feel:

- trustworthy
- clean
- accessible
- data-driven
- professional
- modern
- organized
- gender-responsive
- institutional

The orange/violet brand identity should remain recognizable, but the majority of the UI should use clean neutral surfaces.

Color should support hierarchy rather than dominate the interface.

---

# Initial Workflow for Codex

Before coding the redesign:

### Step 1
Analyze the current project.

### Step 2
Report:

- frontend framework
- backend framework
- CSS framework
- JS libraries
- chart library
- route structure
- current reusable components
- authentication implementation
- potential migration risks

### Step 3
Propose the recommended shadcn-compatible architecture.

### Step 4
Create or revise theme tokens.

### Step 5
Build shared layout components:

- Header
- Container
- SectionHeading
- Buttons
- Cards
- Footer

### Step 6
Redesign the homepage one section at a time.

### Step 7
Verify that existing functionality remains intact after each major change.

Do not perform a massive uncontrolled rewrite.

Make incremental, testable changes.

---

## Screenshot Instruction

Use the existing PHLGADIS screenshots as the **before** reference.

Preserve the information and functionality visible in them, but do not copy the current visual layout.

Apply this design specification and modernize:

- information hierarchy
- component structure
- spacing
- responsiveness
- navigation
- statistics
- charts
- cards
- campaign sections
- featured posts
- footer

The redesign should preserve functionality while significantly improving usability, consistency, and visual quality.
