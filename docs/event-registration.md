# Event registration (Join)

People join a GAD event before it from the event's page, or staff add them. Only people on its list are checked in by the QR Scanner (`docs/event-check-in.md`) and given the event's certificates (`docs/certificates.md`). Walk-ins sign the paper attendance sheet at the table; staff can put them on the list afterwards, with the days they came. Guests without an account, such as people from other agencies, are kept on the list too.

This is the third step of event registration by QR: the Virtual ID (`docs/virtual-id.md`), Join, the scanner, then certificates.

## The rules

The user decided these on 2026-10-12.

- **No limit and no approval.** Clicking Join is enough. Whether they come is up to them. There is no cap, so thousands can join one event.
- **Who can join:** anyone who sees the event (`GadEvent::scopeVisibleTo`). That means their own region's events and every region's. Nobody joins a deadline (`GadEventPolicy::join`).
- **Invitees from another region** (decided on 2026-10-14): staff add them by hand. Someone on an event's list sees it on their calendars and opens its page, whatever their region (`GadEvent::scopeOnCalendarOf`, `GadEventPolicy::view`). Staff powers still follow the region alone: being on a list never lets staff check people in or see who joined elsewhere. An invitee without an account is registered first by the CHED Focal or the Admin, under the usual account rules, or kept as a guest.
- **When registration closes:** staff set a closing time when they add or edit the event, or close it by hand.
    - With no closing time, it stays open until the event ends. Someone with an account can still join on their phone at the table. An event with no end time ends with its first day (`GadEvent::finishesAt`).
    - The closing time can't be after the event ends.
    - **Close registration** sets the closing time to now. **Reopen registration** clears it, so it is open until the event ends again. Both are in the event's "Manage registration" box and on the list of who joined (`admin.events.registration.update`, `GadEventPolicy::update`).
    - The one rule is `GadEvent::acceptsRegistrations()`.
- **Leaving:** "Leave event" works while registration is open and before the person is checked in. Once checked in, they attended. After registration closes, the list is final.
- **Joining twice** finds the first registration, even when two arrive at once (the unique key and `createOrFirst`).
- **At the scanner** (`CheckInParticipant`), someone who didn't join is refused. While registration is open, the message says they can join on PHLGADIS now and scan again. After it closes, it says to sign the paper attendance sheet.
- **Certificates** go by themselves, when the event ends, to people on its list who were checked in on every one of its days, guests included. Anyone who missed a day asks for one (`docs/certificates.md`).
- **People checked in before Join existed** count as having joined. `2026_10_22_000001_create_gad_event_registrations_table` gives each one a registration from their first check-in, so certificates still to be released reach them.
- **Who sees how many joined, and who** (decided on 2026-10-13, changed on 2026-10-14): the CHED Focal of the event's region and Administrators, everywhere, whoever added the event. That covers the event page, the staff events table and the list of who joined. The public website never shows it.
- **Cancelling** (decided on 2026-10-14): staff call an event off, or put it back on. A cancelled event keeps its list, but nobody joins or is checked in, and it gives no certificates. Everyone on its list is told either way. Deleting an event people joined tells them it is off.
- **When an event changes:** people on its list are told of a new date or time, venue or region (`App\Support\EventChanges`), never of a new title, description or registration closing. A region change keeps them on the list; the edit dialog warns before saving. Staff may also tell them on GC.

## Who manages it

- **Events belong to the CHED Focal of each region and to the Admin** (decided on 2026-10-14). The CHED Focal runs its region's events: `events.view`, `events.create` and `events.update`, without delete (`2026_10_22_000002_let_ched_focal_manage_events`). GAD Focal Persons no longer add or edit events but still check people in (`2026_10_22_000005_adjust_event_permissions`).
- **How many joined, and the list of who joined** (`GadEventPolicy::viewRegistrations`), are for whoever holds `events.view-registrations` and sees the event by region: Administrators and the CHED Focal (`2026_10_22_000004_let_admins_see_who_joined_events`, `…000005`). An Administrator can grant it to another role in Settings → Roles & permissions.
- **Keeping the list by hand** (adding people and guests, marking days, taking someone off, cancelling) is for staff who update the event (`GadEventPolicy::update`): the CHED Focal of its region and the Admin. Never at a deadline or a cancelled event (`App\Support\EventAttendance`).
    - Access follows place. A region's event's list is its own office's (and the Central Office's). An event for every region shows its whole list to every regional office that opens it, so offices see who else is going (decided on 2026-10-14), and its Region filter offers every region. Keeping that list (adding, marking days, cancelling) stays with the Central Office.

## What is kept

- **`gad_event_registrations`.** One row per person per event:
    - the event and the person, and `joined_at` (UTC, the model's `CREATED_AT`)
    - the person's region and HEI when they joined, as check-ins keep them, so the list filters by place without reading accounts
    - `added_by`: the staff member who put them on the list; null when they joined themselves (`2026_10_22_000007`)
    - Deleting the event or the account deletes its registrations.
- **Days marked by hand** are check-ins with `method` `manual` and the staff member as `checked_in_by` (`ManageEventRegistration::setAttendance`). Only the event's days up to today; a day is never taken from someone who holds the event's certificate.
- **`gad_event_guests`** (`2026_10_22_000008`): a guest's name, agency or organization, position and sex (the profile's choices), and who added them. **`gad_event_guest_days`** holds one row per guest per day they came. No Virtual ID, QR or notices. A guest who holds a certificate can't be removed.
- **`gad_events.cancelled_at`** (`2026_10_22_000006`): when staff cancelled it, in UTC; null while it is on. `GadEvent::statusAt` then says `cancelled`.
- **`gad_events.registration_closes_at`:** when joining stops, in Philippine wall-clock time like `starts_at`. Null means open until the event ends. A deadline has none.
- **`gad_events.ulid`:** the event page's public address (`/events/{ulid}`, and `/gad-events/{ulid}` on the public website), a link staff can share. `id` stays the key, so the admin and check-in routes don't change. `2026_10_22_000000_add_registration_to_gad_events_table` gave existing events one.
- **`gad_events.is_public`:** whether the event shows on the public website. It is on unless staff turn it off, as for an internal meeting, and deadlines never show whatever it says (`GadEvent::scopeOnPublicSite`, and `isOnPublicSite()` for an event in hand). `2026_10_22_000003_add_is_public_to_gad_events_table` made existing events public. It is indexed with `starts_at` for the public list, and `ends_at` has an index of its own for finding what is still on.
- **The activity log:**
    - Joining and leaving are logged as "Joined <event>" and "Left <event>" (`ActivityAction::Joined` and `Left`, subject type `event-registration`), filed under the place the person belongs to.
    - Closing and reopening are logged as updates of the event.
    - Staff adding, marking days and taking off are logged as "Added Ana Reyes to <event>", "Updated the attendance of …" and "Removed Ana Reyes from <event>" (`ActivityAction::Added`, `Updated`, `Removed`). Guests are logged the same way (subject type `event-guest`).
    - Cancelling and restoring are logged as `Cancelled` and `Restored`.
    - Nobody is notified of a join; someone staff add is told ("added you to the GAD event …").

## The pages

- **The event page** (`pages/hei/event.tsx`): the category, title, dates, time, venue and region, and the details.
    - **The Join card** (`components/events/join-card.tsx`) says where registration stands (`registrationNote` in `lib/event-dates.ts`). For the event's creator and Administrators, it also says how many joined.
        - Not joined: **Join event**.
        - Joined: when they joined (or that CHED added them), a reminder to show their Virtual ID at the table, and **Leave event** while registration is open.
        - Checked in: the days they attended, and their certificates to download once they go out. Someone who missed a day asks for one with **Request a certificate**, and sees where their request stands.
        - Cancelled: "This event was cancelled." and nothing to join.
        - Deadlines have no card.
    - **Manage registration**, for staff: **See who joined**, and **Close registration** or **Reopen registration**.
- **Links to it:**
    - each event in the calendar's day panel, the upcoming lists and the staff dashboard
    - "View and join" on the HEI home's next-event card
    - the title in the staff events table
    - the "added a GAD event" notification
    - Events you joined, in My certificates
- **The Joined mark** (`components/events/joined-mark.tsx`) shows on the events you joined in those lists.
- **Who joined** (`pages/admin/events/registrations.tsx`):
    - counts of who joined, who was checked in, and guests
    - each person, with their institution or office and region, when they joined, the days they attended, and "Added by staff" for those staff added
    - search by name, region and HEI filters, 20 a page
    - the event's certificates, linking to their release pages, for staff who release them
    - **Add people** (`components/events/add-person-dialog.tsx`): search any active account in the country by name or institution, leaving out those on the list, and tick the days they came
    - per person: **Attendance** (`attendance-dialog.tsx`), ticking the days they came, and **Take off the list** while no day is marked
    - **Guests** (`event-guests.tsx`, `guest-dialog.tsx`): add, edit and remove guests with their days, and **Give** a released certificate to a guest who missed a day
- **The staff events table** has a Joined column, linking to the list, with the count for the region's CHED Focal and Administrators and "—" for other staff. The add and edit dialog has "Registration closes (optional)" and **Show on the public website** (on by default, hidden for deadlines). The For column says "Not on the public site" when it is off.
    - **Cancel event** asks first and names how many will be told; **Restore event** needs no confirmation. Deleting an event people joined says they'll be told.
    - Editing an event people joined warns, before saving, that they will be told of the new date and time, venue or region.
- **Where each event stands:**
    - The events table shows each event's status: Happening now, Upcoming, Ended or Cancelled. That is `GadEvent::statusAt`, with `scopeInStatus` the same rule for queries. An event without an end is over with its first day.
    - A status select filters the table (`?status=ongoing|upcoming|ended|cancelled`), and the count says how many are happening now.
    - The event page, the calendar's day panel and the public site show it too. Cancelled events stay on the month grid and the public list, but leave the upcoming lists and the homepage strip.
- **Settings → My certificates** lists **Events you joined** under the certificates, newest first, 10 a page. Each shows its status (Upcoming, Happening now, Attended N days, Didn't check in) and "Certificate ready" once one is released.

## On the public website

Visitors who aren't signed in see the GAD events staff left public (decided on 2026-10-13). One class, `App\Support\PublicEvents`, picks them for every page below and for a future public API.

- **Which events:** those with **Show on the public website** on, never a deadline (`GadEvent::scopeOnPublicSite`).
- **In what order:** events on now come first, then the soonest upcoming. That is `GadEvent::scopeNotEndedAt` ordered by `starts_at`, the same rule `statusAt` keeps. Past events, newest first, are under **Past**.
- **By region:** a region shows its own events and those for every region (`GadEvent::scopeForRegion`). Only active regions are offered, and anything else means every region (`PublicEvents::region`).
- **Never** how many joined, who joined, who added the event, or its numeric id (`PublicEventResource`).

The pages:

- **The header's Events link** (`components/public/site-layout.tsx`), on desktop and in the phone menu, opens `/gad-events`.
- **GAD events** (`pages/gad-events/index.tsx`, `/gad-events`):
    - **Happening now & upcoming** and **Past** tabs, a **Region** select (`components/public/region-select.tsx`), and 12 events a page
    - each row (`PublicEventRow` in `components/public/public-event-card.tsx`): the date, title, status, when, venue, category and whose region
    - empty states that say so, with a link to Past
- **An event's page** (`pages/gad-events/show.tsx`, `/gad-events/{ulid}`):
    - the category, status, dates, time in Philippine time, venue and region, then the details
    - **Join this event** says where registration stands. While it is open, **Log in to join** goes to the event's own page (`/events/{ulid}`), so signing in lands there, ready to join, and **Register** goes to sign-up.
    - Someone signed in who sees the event is sent to its own page. Someone signed in from another region is told whose event it is, with a link to their calendar.
    - A hidden event, a deadline, an unknown address or a numeric id is a 404.
- **The homepage's GAD events strip** (`components/home/events.tsx`, `#events`, between the law surveys and Data & statistics): the next three events still on, its own **Region** select (`?events_region=`, reloading only the `events` prop and keeping the statistics' `?region=` through `withQueryValue` in `lib/query.ts`), and **See all events**.

## Endpoints

These are session-authenticated, on the web routes, and ready to move under `/api/v1`. They run `App\Actions\Events\ManageEventRegistration`.

| Request                                                             | Name                                     | What it does                                                                                                                            |
| ------------------------------------------------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /events/{ulid}`                                                | `events.show`                            | The page: `event` (`GadEventResource`), `registration` (yours or null), `attended` (your days), `certificates` (yours, released), `can` |
| `POST /events/{ulid}/registration`                                  | `events.registration.store`              | Join. 422 on `registration` once closed or ended; 403 at a deadline or another region's event; 30 a minute                              |
| `DELETE /events/{ulid}/registration`                                | `events.registration.destroy`            | Leave. 422 on `registration` once checked in or closed; 30 a minute                                                                     |
| `GET /admin/events/{event}/registrations`                           | `admin.events.registrations.index`       | Who joined: `counts`, `registrations` (paginated, `search`, `region`, `hei`), `certificates`                                            |
| `PUT /admin/events/{event}/registration`                            | `admin.events.registration.update`       | `{open: bool}`: close now, or reopen until the event ends                                                                               |
| `GET /admin/events/{event}/people`                                  | `admin.events.people`                    | `?q=`: up to 8 active accounts to add (`PersonResource`), not those on the list                                                         |
| `POST /admin/events/{event}/registrations`                          | `admin.events.registrations.store`       | `{person: ulid, days?: [Y-m-d]}`: add someone (`AddEventPersonRequest`)                                                                 |
| `PUT /admin/events/{event}/registrations/{registration}/attendance` | `admin.events.registrations.attendance`  | `{days: [Y-m-d]}`: every day they came (`EventAttendanceRequest`)                                                                       |
| `DELETE /admin/events/{event}/registrations/{registration}`         | `admin.events.registrations.destroy`     | Take off the list; 422 once a day is marked                                                                                             |
| `POST`, `PUT`, `DELETE /admin/events/{event}/guests[/{guest}]`      | `admin.events.guests.*`                  | Guests: `{name, organization, position?, sex?, days?}` (`SaveEventGuestRequest`, `ManageEventGuest`)                                    |
| `POST /admin/events/{event}/guests/{guest}/certificates`            | `admin.events.guests.certificates.store` | `{certificate}`: give a released certificate to a guest                                                                                 |
| `PUT /admin/events/{event}/cancellation`                            | `admin.events.cancellation.update`       | `{cancelled: bool}`: cancel or restore (`CancelEvent`)                                                                                  |

The public pages need no sign-in and allow 60 requests a minute each:

| Request                  | Name                  | What it does                                                                                                                          |
| ------------------------ | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /gad-events`        | `public-events.index` | `events` (paginated `PublicEventResource`, `region`, `when=current\|past`, `page`), `filters`, `regions` (`PublicEventFilterRequest`) |
| `GET /gad-events/{ulid}` | `public-events.show`  | `event` (`PublicEventResource`) and `signedIn`; a redirect to `events.show` for someone who sees the event                            |
| `GET /`                  | `home`                | The homepage's `events` prop: `region`, `regions` and `events` (the next three)                                                       |

- **`GadEventResource`:** `toCalendarArray()` (which now includes `ulid` and `registration_closes_at`), plus `region`, `ended`, `registration_open` and, only for the event's creator and Administrators, `joined_count`.
- **`PublicEventResource`:** `ulid`, `title`, `description`, `location`, `category`, `starts_at`, `ends_at` and `registration_closes_at` (Philippine wall-clock), `is_all_day`, `region` (its name, or null for every region), `status` and `registration_open`.
- **`EventRegistrationResource`:**
    - `id` and `joined_at` (ISO 8601, UTC)
    - `person`: `name`, `avatar`, `affiliation` and `region`
    - `days_attended`
    - It never sends the participant code, email, mobile or sex.
- **`EventRegistrationResource`** also sends `added`, and `days` (Y-m-d) on the staff list.
- **`EventGuestResource`:** `id`, `name`, `organization`, `position`, `sex`, `days` and `certificates` (the event certificate ids they hold).
- **`JoinedEventResource`:** the event, `joined_at`, `days_attended`, `status` (`upcoming`, `ongoing`, `attended`, `missed` or `cancelled`) and `has_certificate`.
- **The calendars** (`EventCalendar`) add `joined` to each event for the viewer, and `toCalendarArray()` sends `cancelled`.

## Tests

- `tests/Feature/Events/EventRegistrationTest.php`: joining once, deadlines and other regions, closing, leaving, the page's props, the calendars and the new-event notice.
- `tests/Feature/Admin/EventRegistrationListTest.php`: the list, its filters and privacy, access by place and role, the permission migrations, and closing and reopening.
- `tests/Feature/Admin/EventListKeepingTest.php`: adding people and invitees, the people search, attendance, taking off, guests and their certificates, cancelling, change and delete notices, and undoing a check-in.
- `tests/Feature/Admin/GadEventTest.php`: the closing time, the public website switch, and the migrations.
- `tests/Feature/Events/PublicEventsTest.php`: the public list, its order, region filter, Past and pages, what it sends, an event's page, the homepage strip and throttling.
- `tests/Feature/Admin/EventCheckInTest.php`: walk-ins are refused.
- `tests/Feature/Certificates/ReleaseTest.php`: only people who joined earn a certificate.
- `tests/Feature/Certificates/MyCertificatesTest.php`: Events you joined.
- `tests/frontend/event-registration.test.ts` and `tests/frontend/public-events.test.ts`
- `tests/browser/events.spec.ts`, with the fixture "Fixture Join Workshop" in `tests/browser/server.php`: joining, who joined, adding someone and a guest with their days, cancelling and restoring. A walk-in and Undo are in `scanner.spec.ts`.
- `tests/browser/public-events.spec.ts`: the homepage strip, the Events page and an event's page, signed out, in both themes.

## Not built yet

- Reminders before an event.
- A limit on how many can join, a waiting list, or approval.
- Attendance lists and exports by event, region and HEI, and counts of guests by sex.
- Finding someone by name at the scanner, scanning offline, and checks against misuse (decided on 2026-10-14: not yet).
