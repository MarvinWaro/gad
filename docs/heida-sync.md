# HEIDA directory sync

PHLGADIS's regions and HEIs come from **HEIDA**, CHED's national HEI directory (`https://v2.heida.ched.gov.ph`). A nightly sync copies them into our own tables:

| HEIDA     | PHLGADIS                             |
| --------- | ------------------------------------ |
| regions   | `survey_regions`                     |
| provinces | `survey_clusters`, kept out of sight |
| HEIs      | `survey_heis`                        |

Registration, the public surveys, website feedback and every staff filter read that copy. **No page calls HEIDA itself.**

## Why a copy, not live calls

- **Accounts, responses and posts point at our rows.** `users.survey_hei_id` and the other links need a row of ours, whatever HEIDA does.
- **Signing up keeps working** when HEIDA is slow or down.
- **HEIDA is not flooded.** Its developers asked us not to keep requesting from it, so one quiet nightly run makes about 27 calls.

## Running it

| Command                                   | What it does                           |
| ----------------------------------------- | -------------------------------------- |
| `php artisan surveys:sync-heis --dry-run` | Shows what would change, saves nothing |
| `php artisan surveys:sync-heis`           | Runs the sync                          |

- **Schedule:** it runs every night at 03:00 (`routes/console.php`), wherever the scheduler runs.
- **From Settings:** `POST /settings/survey-directories/sync-heis` (directory managers only) queues `SyncHeidaDirectory`. No page links to it yet.
- **One at a time:** a cache lock stops two runs from overlapping.

**Settings:** `HEIDA_API_URL`, which defaults to `https://v2.heida.ched.gov.ph`.

## What it reads

| Endpoint           | Calls                     |
| ------------------ | ------------------------- |
| `GET /api/regions` | 1                         |
| `GET /api/heis`    | every page, 100 to a page |

**Public endpoints only, so no token is sent.** HEIDA's central token (`HEIDA_API_TOKEN`) can also change and delete HEIDA's records, so the sync never uses it.

**Staying polite** (`app/Services/HeidaClient.php`):

- a 0.5-second pause between pages
- two retries on a dropped connection or a server error
- on a 429, one wait for as long as `Retry-After` asks, up to a minute

**Safe on failure:** everything is fetched before anything is written. If any call fails, nothing changes.

## How records are matched (`app/Services/HeidaDirectorySync.php`)

### Regions

- **Matched by PSGC code** (`survey_regions.code`).
    - The 17 offices carry theirs from `SurveyRegionSeeder::OFFICES`; the migration fills existing databases.
    - Regional Office IV is Region IV-A (CALABARZON).
- **Office names are never renamed.**
- **A region we lack is added under HEIDA's name.** Today that is only BARMM, which has no CHED regional office.

### HEIs

- **Matched by UII:** HEIDA's `code` is our `survey_heis.uii`.
- **A hand-entered HEI with no UII** in the same region is adopted by its name, not duplicated.
- **The name** is HEIDA's.
- **Ownership** comes from HEIDA's `hei_type`:
    - **Public:** CSCU-MAIN, CSCU-SAT, CSI, LGCU.
    - **Private:** PSS, PSN, PNS, PNN, PSF, PNF, PNSNPC.
    - **OT** (other) keeps what the HEI had.
- **Active** only while HEIDA's `status` is `active`.

### Placement

- **A new HEI** goes to the region whose code matches HEIDA's.
- **An HEI already on the list keeps its region.** HEIDA files HEIs by location, but a regional office may cover schools outside its region. The Cotabato City schools are under BARMM in HEIDA but stay with Regional Office XII.

### Clusters (kept out of sight)

Since 2026-10-03 no page shows or asks for a cluster: pickers and filters go region → HEI (DESIGN.md, "No clusters on screen"). The sync still files each HEI under one, because it is the link from an HEI to its region:

- **The cluster is HEIDA's province** within the region the HEI is filed under. The Cotabato City schools are under "Maguindanao del Norte" and "Maguindanao del Sur" in Regional Office XII.
- **Matching:** by code (`survey_clusters.code`), then by name. "Province of Cotabato" and "Cotabato" are the same place.
- **New provinces** become new clusters.
- **With no province from HEIDA:**
    - an HEI keeps the cluster it is in;
    - a new one goes beside its region's other HEIs when they share one cluster;
    - otherwise it goes to the holding cluster, "Unassigned".

**HEIs HEIDA does not list** stay as they are. After the first run in October 2026 that was 5 seeded Regional Office XII HEIs: SKSU-Glan, SKSU-SNA, Read Data Access, Microspan and International Cruise Ship College. Deactivate them under Settings → HEIs if they no longer operate.

**What the first run did:**

- It read 2,583 active HEIs in 27 calls.
- It skipped 4: one code HEIDA sends twice (`03329`), and three with no region (`8151`, `N/A`, `1023a`).
- **HEIDA lists active HEIs only.** One that closes simply drops off the list, so the sync deactivates it.

### Never deleted

Rows are never deleted. A HEI that an earlier sync brought in (`portal_synced_at` is set) and that HEIDA no longer lists is deactivated. A seeded or hand-entered HEI that HEIDA lacks is left as it is.

## What shows on the pages

- **Registration and website feedback** load a region's HEIs only once it is picked (`?region=`, an Inertia partial reload). The whole country's 2,600 HEIs would weigh the page down on phones.
- **Public surveys** still send them all; this is tracked in `docs/national-and-api-readiness.md`.

## Tests

`tests/Feature/HeidaDirectorySyncTest.php` fakes HEIDA with `Http::fake()` and `Sleep::fake()`. Tests never call the real API.
