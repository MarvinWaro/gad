# Event check-in

Staff check people in at GAD events with the **QR Scanner** (`/admin/scanner`, `admin.scanner`). They pick one of today's events, then scan the person's Virtual ID (`docs/virtual-id.md`) or type its code. Only people who joined the event are checked in (`docs/event-registration.md`). The people checked in can then be given certificates (`docs/certificates.md`).

## Who can scan

- **The permission** is `events.check-in` ("Check people in to GAD events", in the GAD events group). Administrator, CHED Focal, CHED Employee and GAD Focal Person hold it. `RbacSeeder` gives it on a fresh install; `2026_10_20_000001_let_staff_check_people_in_to_events` gives it to those four roles on an existing one.
- **Where they can scan** (`GadEventPolicy::checkIn`): at the events they see (`GadEvent::scopeVisibleTo`). That means their own region's events and every region's events; the Central Office can scan at any event. Nobody checks in at a deadline.
- **Where staff find it:**
    - With the sidebar: at its foot, above the account (`components/nav-scanner.tsx`).
    - With top navigation: an icon beside the notifications (`HeaderActions`).

## The rules

- **Today's events only.** The list holds the events running today in Philippine time, multi-day and all-day ones included (`GadEvent::scopeOpenForCheckIn`, which reuses `between()`).
    - Check-in is open only on an event's own days. An event with no end time stays open to the end of its day.
    - A page left open overnight is refused: "Check-in for this event is open only on its own days."
- **Once a day.**
    - Each person can be checked in once per event per Philippine day. The table's unique key enforces this, so two scanners at once still make one row (`createOrFirst`).
    - A second scan says "Already checked in today", with the first time and who checked them in.
    - On the next day of a multi-day event, they check in again.
- **People who joined, with an active account,** from any region (`docs/event-registration.md`).
    - Someone who didn't join is refused by name. While registration is open, the message says they can join on PHLGADIS now and scan again. After it closes, it says to sign the paper attendance sheet.
    - Pending and deactivated accounts are refused, each with its own reason.
    - A code no account holds is refused with "No account has this Participant ID."
- **Typed codes are forgiving** (`ParticipantCode::parse`): case, spaces, dashes and the `GAD-` prefix don't matter, and I and L read as 1, O as 0. The prefix is dropped only when eight characters follow it, because a code's own characters may begin with G, A and D.

## What is kept

- **`gad_event_check_ins`.** One row per person per event per day:
    - the event, the person, and `attended_on` (the Philippine day, `Y-m-d`). It is kept as text with no date cast, so `createOrFirst` finds the row it wrote on SQLite too.
    - `checked_in_at` (UTC, the model's `CREATED_AT`) and `checked_in_by`.
    - `method`, which is `scan` or `typed`, or `manual` for a day staff marked on the list of who joined (`docs/event-registration.md`).
    - The person's region and HEI at that moment, as `quest_attempts` keeps them, for attendance by place later.
    - Deleting the event or the account deletes its check-ins. Deleting the staff member leaves the check-in with no checker.
- **The activity log.** Each new check-in is logged as "Checked in Ana Dela Cruz at <event>" (`ActivityAction::CheckedIn` under GAD events, subject type `event-check-in`), filed under the place the person belongs to. A repeat is not logged. Nobody is notified.

## The page

`pages/admin/scanner.tsx`, with its parts in `components/scanner/`. The layout follows the registration table's laptop:

- **On a computer:** the event, Participant ID and Recent in a row, then the camera on the left and the result on the right.
- **On a phone:** the camera and the result come right after the event, so a scan's result is in view, and typing and Recent follow.
- **The camera** (`hooks/use-qr-scanner.ts`):
    - Phones start on the back camera, and a switch button appears when there is more than one camera.
    - A laptop's or front camera shows as in a mirror; the frames read stay as the camera sees them.
    - It starts by itself when the browser already allows the camera; otherwise it waits for "Start camera".
    - Browsers offer the camera to https pages only (and `localhost`). On a plain `http://` address the page says so, and typing still works.
- **Reading** (`lib/qr-decoder.ts`):
    - Where the browser has its own reader (`BarcodeDetector`: Chrome on Android, macOS and ChromeOS), it uses that.
    - Elsewhere (Windows laptops, iPhones, Firefox), it uses zxing-wasm 3.1.5 (zxing-cpp in WebAssembly). That reader is loaded only then, from this site's build, never a CDN: about 1 MB of wasm, 420 KB compressed, cached after the first visit.
    - It reads a frame at a time, at most every 150 ms, and not while the tab is hidden. The same code read again within 4 seconds is ignored, so holding a phone in view checks in once.
    - A QR that is not a Virtual ID is turned away in the browser without asking the server.
- **The result:**
    - It shows large beside the camera: the photo, name, institution or office, region (for HEI people) and roles.
    - It is green for checked in, amber for already checked in today, and red for why not (`lib/scanner.ts` holds the plain-language messages).
    - The camera's outline takes the same colour for a moment, and screen readers hear each result.
- **Recent:** a drawer, from the right on a computer and from the bottom on a phone. It lists today's check-ins at the event from every scanner, newest first, 20 at a time with "Show more". It reloads each time it opens.
    - **Undo** on each row takes back a check-in made by mistake, after asking (`CheckInParticipant::undo`). Only today's, and never once the person holds the event's certificate. It is logged as "Undid the check-in of …" (`ActivityAction::CheckInUndone`). Earlier days are put right on the list of who joined. A cancelled event takes no check-ins.
- **Sound** (`lib/scan-sounds.ts`, `hooks/use-scan-sound.ts`): each result sounds, so staff at a busy table hear it without looking.
    - **The sounds:** a bright rising chirp for checked in, one soft tone for already checked in today, and a low falling double buzz when it did not go through.
    - **How they are made:** short tones made by the browser (Web Audio), with no sound files to load, kept quiet for a day at the table.
    - **Turning it off:** "Sound on" / "Sound off" in the header. This browser remembers the choice, and sound is on by default. Turning it on chirps once.
    - **Browsers keep a page silent until someone touches it,** so results before the first tap, click or key on the page make no sound.
- **Kiosk mode** (computers only, from 1024 px; `hooks/use-kiosk-mode.ts`):
    - The browser goes fullscreen, and `setLayoutProps({ kiosk })` makes the app layouts drop the sidebar and the top bar (`AppLayout`'s `kiosk`).
    - The page keeps its place in the tree, so the camera and the result stay.
    - Esc, "Exit kiosk mode" and leaving the page all end it. Where the browser refuses fullscreen, the scanner still fills the window.
    - Everything else stays, since it is staff-run.

## Endpoints

These are session-authenticated, on the web routes, and ready to move under `/api/v1`. They run the same action (`App\Actions\Events\CheckInParticipant`) and send the same resource.

| Request                                            | Name                             | What it does                                                                                                                                                   |
| -------------------------------------------------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /admin/scanner`                               | `admin.scanner`                  | The page: `events` (today's, each `toCalendarArray()` plus its region's name), `event` (the one in `?event=`, or the only one) and `checkedIn` (today's count) |
| `POST /admin/events/{event}/check-ins`             | `admin.events.check-ins.store`   | `{code, method: scan\|typed}`. Returns 201 `{status: 'checked_in', check_in, count}` or 200 `already_checked_in`; 422 on `code` or `event`; 403; 120 a minute  |
| `DELETE /admin/events/{event}/check-ins/{checkIn}` | `admin.events.check-ins.destroy` | Undo one of today's. Returns `{count}`; 422 on `check_in` for another day or once a certificate was given; 60 a minute                                         |
| `GET /admin/events/{event}/check-ins`              | `admin.events.check-ins.index`   | Today's check-ins, newest first, 20 per cursor page, with `count`; 60 a minute                                                                                 |

`GadEventCheckInResource` sends:

- `id`, `checked_in_at` (ISO 8601, UTC) and `method`
- `person`: `name`, `avatar`, `affiliation`, `region` and `roles`
- `checked_in_by`

It never sends the participant code, email, mobile or sex.

## Tests

- `tests/Feature/Admin/EventCheckInTest.php`: the list, once a day, typed codes, refusals (walk-ins among them), the event's own days, access by place, permissions, the Recent list and its privacy, and the migration.
- `tests/Unit/ParticipantCodeTest.php`
- `tests/Feature/Settings/ActivityLogTest.php`
- `tests/frontend/scanner.test.ts`
- `tests/browser/scanner.spec.ts`:
    - typing, the drawer, a blocked camera, kiosk mode, and both themes at 375 and 1440 px
    - **the camera:** a fake stream shows a participant's own Virtual ID, and the scanner reads it. The fixtures are in `tests/browser/server.php`.

## Not built yet

- Vibration on a scan.
- Attendance lists and exports by event, region and HEI.
