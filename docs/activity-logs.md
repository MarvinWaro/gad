# Activity logs

Settings → System configuration → **Activity logs** (`/settings/activity-logs`)
shows who did what in PHLGADIS, newest first: the person, the action, the
module, the record, where it happened (HEI → cluster → region), the time in
Philippine time, the device and the IP address. Edits fold out what changed,
field by field. Naming a person narrows the list to them; so does the clock
icon on each row of Settings → Users.

## Access

- The `activity-logs.view` permission ("View activity logs"). Administrators
  have it; give it to other roles in Settings → Roles & permissions.
- The Central Office sees every entry. A regional office sees the entries
  placed in its region (`BelongsToRegion::scopeWithinReachOf`). A staff account
  with no office sees none.
- An entry is placed where its record belongs (a report, an HEI, an account,
  a post), or, when the record has no place, where the person who acted
  belongs. Entries with no region, such as the Central Office's own sign-ins,
  show to the Central Office only.
- Everyone, HEI accounts included, sees their own entries (the ones they
  made) on My Profile → Activity (`MyProfileController`), without the
  permission.
- An entry's "View" link appears only when the viewer may open that page
  (`ActivitySubjects::url` checks the permission or policy); a change to your
  own account links to Settings → Profile.

## What is logged

| Module                            | Actions                                                                                                                                                                               |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authentication                    | Login, logout, failed login (wrong email or password, wrong two-factor code, account pending or deactivated), registration, password reset by email link                              |
| My account                        | Profile updated (with changes), photo changed or removed, password changed, two-factor on or off, passkey added or removed, own account deleted                                       |
| Users                             | Created, updated (fields, roles, office, HEI, "password changed"), approved, reactivated, deactivated, set back to pending, deleted; instant registration opened or closed per region |
| Roles & permissions               | Created, updated (permissions added or removed), deleted                                                                                                                              |
| Academic years                    | Created, updated, activated, deactivated, deleted                                                                                                                                     |
| Regions                           | Created, updated, activated, deactivated, deleted; office details updated                                                                                                             |
| Clusters                          | Created, updated, activated, deactivated, deleted                                                                                                                                     |
| HEIs                              | Created, updated, activated, deactivated, deleted; synced from the CHED portal (one entry with the counts)                                                                            |
| Respondent groups                 | Created, updated, activated, deactivated, deleted; follow-up questions saved                                                                                                          |
| Surveys                           | Created, draft updated, published, archived, made active again, deleted                                                                                                               |
| Survey responses                  | Deleted, exported (CSV, with the filters used)                                                                                                                                        |
| GAD events                        | Created, updated, deleted                                                                                                                                                             |
| Carousel                          | Created, updated, activated, deactivated, deleted                                                                                                                                     |
| Gender Mainstreaming              | Post created, edited, deleted (marked when a moderator removed it), shared; comment added or deleted; reaction given, changed or taken back                                           |
| Monitoring reports                | Started, draft autosaved (which fields, never their text), finalized, reopened, signed copy submitted, reviewed, returned for correction, signed copy downloaded                      |
| GAD Training & Compliance Surveys | Submitted, updated (how many items were checked)                                                                                                                                      |
| Site ratings                      | Rating deleted, ratings exported, the Rate PHLGADIS button turned on or off                                                                                                           |

**Never logged:** public survey answers and homepage ratings. Both are
anonymous, and an entry with an IP address and a time would undo that.

**Never stored:** passwords (typed or new), tokens, two-factor secrets, file
paths, and the text of monitoring answers. Long values in a change are cut at
500 characters.

Entries are kept for good; nothing prunes them. The table is append-only and
indexed by time, region, person, module and action for national volume.

## How it works

- `App\Services\ActivityRecorder` is the only writer. Call `record()` after
  the change has been made, with an `ActivityAction`, an `ActivityModule` and
  the record. `recordSave()` covers a create or an edit (an edit that only
  switches `is_active` is logged as activating or deactivating, and one that
  changed nothing is not logged). `changesOf()` turns a model's last save into
  `field => [before, after]`, leaving out hidden attributes and timestamps and
  naming regions, clusters and HEIs. A failed write is reported, never thrown,
  so logging can never undo the change it describes.
- Sign-ins, failed attempts, registration, password resets, two-factor and
  passkeys are logged by `App\Listeners\RecordAuthenticationActivity` from the
  events Laravel, Fortify and Passkeys raise. A pending or deactivated account
  is logged from `FortifyServiceProvider::authenticateUsing`.
- `App\Support\ActivitySubjects` is the one list of the records an entry can
  point at: the stored type code (`user`, `monitoring-report`, …, registered
  as Eloquent's morph map), how each is named, where it belongs and which page
  the entry's "View" link opens.
- Notifications point at these entries rather than copying them: a person
  told about a comment, a review or an approval reads the entry that
  recorded it (`docs/notifications.md`).
- `ActivityLogResource` is the one shape for the page and a future API: codes
  for the action, tone and module, the sentence around the record's name,
  place names, changes, details, the device ("Chrome on Windows 10/11", from
  `App\Support\DeviceName`; the raw user agent is not sent), the IP and an ISO
  8601 time. `ActivityLogFilterRequest` validates the filters.

### Logging a new action

1. Add the action or module to `ActivityAction` / `ActivityModule` if none
   fits. Codes are stored; never reuse one.
2. If it acts on a new kind of record, add the record to
   `ActivitySubjects::TYPES` and give it a noun, label, place and URL there.
3. Call the recorder after the change, from the action or service that makes
   it, so the web and a future API log the same way.
4. Add a case to `tests/Feature/Settings/ActivityLogTest.php`.
