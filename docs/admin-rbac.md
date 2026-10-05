# Administration and RBAC

The administration area uses the Laravel React starter kit shell. Access is
enforced by Laravel gates on the server and mirrored in the interface so users
only see actions they can perform.

## Initial roles

`RbacSeeder` defines the roles below. Administrators can change their
permissions in Settings → Roles & permissions.

| Role (slug)                           | Interface | Place        | What it can do                                                                                                                                                                                                                         |
| ------------------------------------- | --------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Administrator (`admin`)               | Staff     | Every region | Everything, including users, roles and settings; runs GAD quests but does not play them                                                                                                                                                |
| CHED Focal (`ched-focal`)             | Staff     | Office       | View and review its region's monitoring reports, see its GAD surveys; post in Gender Mainstreaming; write, run and play GAD quests; view the law surveys read-only (library, insights and Summary for its region; no single responses) |
| CHED Employee (`ched-employee`)       | Staff     | Office       | View its region's monitoring reports and GAD surveys; post in Gender Mainstreaming; play GAD quests                                                                                                                                    |
| GAD Focal Person (`gad-focal-person`) | Staff     | Office       | Create and update carousel slides, survey drafts and events; review reports; play GAD quests                                                                                                                                           |
| HEI Focal (`hei-focal`)               | HEI       | Its HEI      | Everything an HEI user has, plus the HEI's monitoring report and GAD surveys                                                                                                                                                           |
| HEI User (`hei`)                      | HEI       | Its HEI      | The HEI home, events, Gender Mainstreaming and GAD Quest (`quests.play` only)                                                                                                                                                          |

GAD Quest's permissions and its one exception (Administrators hold `quests.play`
so they can manage every account, but never play) are in `docs/gad-quest.md`.
Badge permissions (`badges.*`, Administrators only) are in `docs/badges.md`.

A staff account's **office** is one region, or the Central Office for all
regions (Settings → Users → Office), and it decides whose reports the account
sees. Administrators have no office to pick: they always cover every region
(since 2026-10-07; Settings → Users saves them as Central Office). CHED Focal
and CHED Employee accounts always belong to exactly one regional office
(`Role::REGIONAL_SLUGS`, `Role::needsRegion`, since 2026-10-05): the form offers
no "Central Office" or empty office for them, and the server refuses both, so
they see, and are told about, their own region's reports only. Other staff
roles (such as GAD Focal Person) may still be Central Office. An account's
office shows under its name in the sidebar and account menu, as a pill in the
Users list, and as a scope line on the Monitoring pages. HEI accounts never hold an office; their region comes through their HEI
and its cluster. `Role::HEI_SLUGS` lists the HEI roles: an account holding only
those gets the HEI home and header, and every other account gets the staff
interface.

The Add user and Edit user form follows the roles. Choosing an HEI role asks
for the Region, then the Institution, which is required: the institution is
what places the account, and the region only narrows the list. Choosing a CHED
role asks for the Office. A CHED-only account keeps no institution. Mobile
number and sex are not on this form; account holders add them in Settings →
Profile, and user management never overwrites them.

The users list filters by role and by place, applying each filter as soon as
it changes, the same way the monitoring lists do:

- Places run region, then HEI. Only the Central Office picks the region.
- HEI accounts are placed through their institution, and CHED staff through
  their regional office (`User::scopePlacedIn`).
- The status tabs count within the active filters and the search.

New public registrations receive the `hei` role after the RBAC seed has been
run. An administrator makes an HEI's GAD focal person an HEI Focal. The default seed creates `admin@gmail.com` with the initial password
`12345678` and assigns that account the `admin` role. Change the password after
the first login. Existing accounts without roles receive `hei`; no existing
account is promoted to Administrator just because it was created first.

**On-the-spot registration.** New registrations wait under Pending until a
user manager approves them. For an event, where there is no time to approve
each one, Settings → Users → **Registration** lets a region's HEIs in straight
away:

- It is set per region (`survey_regions.instant_registration`, optionally
  `instant_registration_until`, stored in UTC and entered in Philippine time).
  Other regions keep approval.
- Anyone with `users.update` can switch the regions their office covers: the
  Central Office any region, a regional office its own.
- While it is open, a registrant whose HEI is in that region is created
  active and goes straight to the HEI home. It closes when switched off or at
  the time set, whichever comes first.
- Everyone still joins as an HEI User (`hei`). A user manager makes the focal
  persons HEI Focal afterwards; nobody can give themselves Monitoring.
- Registration is not rate-limited by IP, because a venue's guests share one
  address. The closing time is the safeguard.

The named permissions are `carousel.view`, `carousel.create`,
`carousel.update`, and `carousel.delete`. Routes and form requests enforce the
matching permission for each operation.

User and role management live under Settings and use the `users.*` and
`roles.*` permission groups. Administrators can create users, assign one or
more roles, and define custom roles from the permissions registered by the
application. Permission definitions remain code-owned so the interface cannot
invent abilities that have no protected route or behavior.

**Temporary passwords.** An account created in Settings → Users starts with the
temporary password (`auth.temporary_password`, from `AUTH_TEMPORARY_PASSWORD`;
"password" unless set), which the form and the "User created" toast name for
the admin to pass on. A password an admin types for someone else in Edit user
is temporary too; one they type for their own account is not. Until its holder
chooses their own (`/password/change`, `TemporaryPasswordController`), the
account opens nothing else (`EnsurePasswordIsChanged`): the new password must
meet the password rules and differ from the temporary one. A forgotten-password
reset also replaces it. The flag is `users.must_change_password`, set only by
`User::giveTemporaryPassword()`.

The Administrator role is system locked. The application also prevents users
from deleting their own account, deleting an assigned role, or removing the
last Administrator assignment.

`activity-logs.view` opens Settings → Activity logs, the record of sign-ins
and changes across every module, scoped to the account's office like the
monitoring lists. Administrators have it. See `docs/activity-logs.md`.

## Carousel

Carousel records store a title, optional description, optional HTTPS
destination, active status, display order, and uploaded image. The required
title also provides the public image's accessible alternative text. Uploads
use Laravel's `public` disk under `carousel/`. Replacing or deleting a slide
also removes the old file.

The public homepage queries active slides by display order. If none exist, the
existing static homepage carousel remains visible as a fallback.

**Administrators from the command line.** `php artisan make:admin` asks for a
name, an email and a password (typed twice, never stored in `.env`) and creates
a verified Central Office administrator. Use it on a new server, or whenever
nobody can sign in. The seeded `admin@gmail.com` takes `ADMIN_PASSWORD` from
`.env`, and production refuses to seed without it.

For a new environment, run:

```bash
php artisan migrate --seed
php artisan storage:link
```

The typed routes Wayfinder writes (`resources/js/actions`, `routes` and
`wayfinder`) are kept in git. DigitalOcean App Platform builds the assets
before it installs PHP, so the build uses those files as committed
(`vite.config.ts` skips Wayfinder when `php` is missing). Every local build
regenerates them: commit them along with any route or controller change.

Uploads (profile and post photos, carousel slides, badges, signed monitoring
files) go to a DigitalOcean Spaces bucket when `FILESYSTEM_UPLOADS=spaces`,
because App Platform empties its own disk on every deploy. Photos are public;
monitoring files stay private and are only handed out by the app. Each
environment writes under its own folder (`SPACES_ROOT`, `APP_ENV` by default).
The settings are listed in `.env.example`.

`php artisan migrate:fresh --seed` recreates the tables and includes the
administrator, survey drafts, Region XII directory, the 129 HEIs supplied
from the CHED list, and a starter GAD Quest draft for every region ("GAD
Laws: The Basics"). In the local environment it also adds one demo account per
role, with the administrator's password: `ched-focal@phlgadis.test` and
`ched-employee@phlgadis.test` in the Region XII office, and
`hei-focal@phlgadis.test` and `hei@phlgadis.test` at a Region XII HEI
(`DemoUserSeeder`). Each HEI keeps its UII. The screenshots did not include a
province, so the initial HEIs wait in the region's holding cluster until the
HEIDA sync files them by province (`docs/heida-sync.md`). Running the seed again keeps
changed passwords, HEI edits, deactivations, and survey responses.
