# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **HEI users.** GAD focal persons and staff of higher education institutions under CHED Regional Office XII (South Cotabato, Cotabato, Sarangani, Sultan Kudarat clusters). They register with their institution, wait for approval, then use PHLGADIS to follow regional GAD events, answer and promote the RA surveys, and share their campus's gender-and-development activities with other HEIs.
- **CHED Regional Office XII staff.** Administrators approve accounts, manage users, roles, directories, surveys, carousel content, and regional GAD events, and moderate the community feed. GAD focal persons at CHED create and maintain content and events.
- **Public visitors.** Students and employees who answer the anonymous law surveys and read the public homepage.

## Product Purpose

PHLGADIS (Philippine Higher Education Gender and Development Information System) is CHED RO XII's GAD information system: public awareness of the four GAD laws, anonymous surveys tagged by institution, and a logged-in space where HEIs and CHED share activities and follow regional GAD events. Success means HEIs participate: their students answer the surveys, and their focal persons post activities and attend events.

## Operating Context

- Accounts are approved by an administrator before first login; registration links each HEI user to one institution from the HEI directory (the directory is planned to sync from the CHED portal).
- Survey responses are anonymous but record the respondent's region, cluster, and HEI, so response counts per institution are real data.
- The community feed is visible to logged-in users only. Posts publish immediately; administrators can remove any post or comment.
- Regional GAD events (trainings, campaigns, deadlines, meetings) are created by CHED staff; HEI users view them.

## Capabilities and Constraints

- Surveys: RA 7877 (Anti-Sexual Harassment Act), RA 9262 (Anti-VAWC Act), RA 9710 (Magna Carta of Women), RA 11313 (Safe Spaces Act).
- Not built yet (show as coming soon, never as working): Upload Monitoring, Records, GAD Training Survey, GAD Compliance Survey.
- Stack: Laravel 13, Fortify, Inertia React, Tailwind 4, shadcn/ui. Role-based access through custom roles and permissions (`admin`, `gad-focal-person`, `hei`).

## Brand Commitments

- Name: PHLGADIS; owner: Commission on Higher Education Regional Office XII.
- Visual system: DESIGN.md (ink, cream, and signature surfaces). The earlier orange/violet palette and gradient banners of the old system are superseded.

## Evidence on Hand

- HEI directory: about 129 institutions seeded from a CHED list.
- No real community posts, events, or statistics are seeded; do not fabricate them in shipped UI.

## Product Principles

1. Institutional trust first: plain language, accurate status, nothing presented as working before it is.
2. Participation over decoration: every surface should make it easier for an HEI to act (answer, share, attend).
3. One region, many institutions: always show which HEI a person or post belongs to.
4. Privacy by default: survey data stays anonymous; community content stays behind login.

## Accessibility & Inclusion

- Target WCAG AA. Gender-responsive, inclusive language throughout.
