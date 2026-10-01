# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **HEI users.** GAD focal persons and staff of higher education institutions across the Philippines, grouped by CHED region and cluster. The first deployment covers CHED Regional Office XII (South Cotabato, Cotabato, Sarangani, Sultan Kudarat clusters). They register with their institution, wait for approval, then use PHLGADIS to follow regional GAD events, answer and promote the RA surveys, and share their campus's gender-and-development activities with other HEIs.
- **CHED staff.** Regional office administrators approve accounts, manage users, roles, directories, surveys, carousel content, and regional GAD events for their region, and moderate the community feed. Central office staff oversee every region. GAD focal persons at CHED create and maintain content and events. Today CHED Regional Office XII is the only office using it.
- **Public visitors.** Students and employees who answer the anonymous law surveys and read the public homepage.

## Product Purpose

PHLGADIS (Philippine Higher Education Gender and Development Information System) is a GAD information system for Philippine higher education, run first by CHED RO XII and built to hold data for every region: public awareness of the four GAD laws, anonymous surveys tagged by institution, and a logged-in space where HEIs and CHED share activities and follow regional GAD events. Success means HEIs participate: their students answer the surveys, and their focal persons post activities and attend events.

## Operating Context

- Accounts are approved by an administrator before first login, except while a region opens on-the-spot registration for an event (Settings → Users → Registration); registration links each HEI user to one institution from the HEI directory (the directory is planned to sync from the CHED portal).
- Survey responses are anonymous but record the respondent's region, cluster, and HEI, so response counts per institution are real data.
- The community feed is visible to logged-in users only. Posts publish immediately; administrators can remove any post or comment.
- Regional GAD events (trainings, campaigns, deadlines, meetings) are created by CHED staff; HEI users view them.
- National scope: every HEI belongs to a cluster and a region, and the data is meant to cover all 17 CHED regions. Staff access is to be scoped by region, with central office staff seeing all regions. Other systems will read and write the data through a versioned JSON API. Rules for both, and the current gaps, are in CLAUDE.md and docs/national-and-api-readiness.md.

## Capabilities and Constraints

- Surveys: RA 7877 (Anti-Sexual Harassment Act), RA 9262 (Anti-VAWC Act), RA 9710 (Magna Carta of Women), RA 11313 (Safe Spaces Act).
- Monitoring reports: one shared HEI report per academic year and semester, filled in online with autosave, finalized under a document code, downloaded as a PDF in CHED's official form layout for signing, and submitted with the signed copy. CHED reviews it or returns it for correction as a new revision. Records holds the history. Reviewers see the regions their office covers (Settings → Users → Office).
- GAD Training Survey and GAD Compliance Survey: the old portal's two checklists, word for word. HEI Focal accounts answer each once per academic year (submitting again replaces the answer) under Records → Training Survey and Compliance Survey; CHED staff read the answers for the regions their office covers.
- Stack: Laravel 13, Fortify, Inertia React, Tailwind 4, shadcn/ui. Role-based access through custom roles and permissions (`admin`, `ched-focal`, `ched-employee`, `gad-focal-person`, `hei-focal`, `hei`). CHED roles are placed by their office's region; HEI roles by their HEI.

## Brand Commitments

- Name: PHLGADIS; run by the Commission on Higher Education Regional Office XII today, for use across all CHED regions.
- Visual system: DESIGN.md (ink, cream, and signature surfaces). The earlier orange/violet palette and gradient banners of the old system are superseded.

## Evidence on Hand

- HEI directory: about 129 institutions seeded from a CHED list (Region XII only so far; other regions arrive through the CHED portal sync).
- No real community posts, events, or statistics are seeded; do not fabricate them in shipped UI.

## Product Principles

1. Institutional trust first: plain language, accurate status, nothing presented as working before it is.
2. Participation over decoration: every surface should make it easier for an HEI to act (answer, share, attend).
3. Every region, every institution: always show which HEI a person, post or response belongs to, and which region once more than one region is in play. Never assume Region XII.
4. Privacy by default: survey data stays anonymous; community content stays behind login.
5. National and API-ready: build for all regions' data and volume, and for other systems to use the same rules and shapes through an API.

## Accessibility & Inclusion

- Target WCAG AA. Gender-responsive, inclusive language throughout.
