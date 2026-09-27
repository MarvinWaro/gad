# Respondent support

**Status:** planned, not built. Build it after the current polish pass, once
CHED RO XII has answered the [decisions](#decisions-for-ched-ro-xii) below.
Written 2026-09-25.

Survey respondents sometimes describe harassment or violence. This feature
lets them find help, and lets them ask CHED RO XII to contact them, without
making their survey answers identifiable. It has two parts:

1. **Help contacts**: a "Need help now?" box on the survey confirmation page,
   listing hotlines and offices that CHED manages in Settings. It collects no
   personal data.
2. **Support requests**: a separate, optional form where someone asks CHED to
   reach them. It is stored apart from survey answers and seen only by named
   CHED staff.

## Why the survey gets no email field

An optional email field on the questionnaire was considered and rejected:

- **Safety.** Abusers often read the victim's email. A CHED message about a
  violence survey can put the respondent in danger, above all under RA 9262.
- **Trust.** Every survey promises "No name or email is collected", and the
  confirmation page repeats it. People disclose honestly because of it.
- **Legal weight.** An email beside an abuse disclosure turns an anonymous
  response into identifiable sensitive personal information under RA 10173,
  with stricter security and breach-reporting duties.
- **Duty to act.** Holding a victim's contact details with no process to follow
  up is worse than never asking.

Survey responses stay anonymous. The questionnaire, `survey_responses`, and the
CSV export never gain contact fields, and nothing links a response to a
support request.

## Part 1: Help contacts

### What respondents see

- The confirmation page (`Confirmation` in `resources/js/pages/surveys/show.tsx`)
  shows a "Need help now?" box under the reference code.
- Each contact shows its name, one line on what it helps with, and
  tap-to-call, email, or website links. The emergency contact comes first.
- A contact applies to every survey or only to some laws: for example, VAW
  desks for RA 9262, and the school's Committee on Decorum and Investigation
  (CODI) for RA 7877 and RA 11313.
- The box is hidden while no contact is active, so an empty or unverified list
  never shows.
- Nothing is recorded when someone opens or taps a contact.

### Administration

**Settings → Help contacts**, built like Settings → Respondent groups:

- Add, edit, reorder, deactivate, and delete, with `ConfirmPopover` and the
  `@/lib/toast` messages.
- Fields: name, description, phone, email, website, surveys (all or selected),
  active, and order.
- Reuses the `survey-directories.*` permissions.
- Seed no phone numbers. CHED enters and verifies each one.

### Safety touches

- A **Quick exit** button on the survey and help pages. It replaces the current
  page with a neutral site (`location.replace`), so Back does not return to it.
- A short note on the help page about staying safe online: private browsing and
  clearing history.
- Neutral page titles and URLs, such as "Contact CHED RO XII" at `/help`,
  never "Report abuse". They show up in browser history.

## Part 2: Support requests

### What respondents see

"Ask CHED to contact me" appears on the confirmation page and in the help box.
It opens a public page, `/help/request`, with no login.

| Field                            | Rules                                                                                            |
| -------------------------------- | ------------------------------------------------------------------------------------------------ |
| How can we reach you?            | Email, mobile number, or both. At least one.                                                     |
| Is it safe to contact you there? | Yes / Only at certain times (then: when) / No.                                                   |
| What should we call you?         | Optional. A nickname is fine.                                                                    |
| What would help?                 | Optional: talk to someone, referral to support services, help reporting to my school, other.     |
| Survey reference                 | Optional, explained as "Add this only if you want us to read your survey answers."               |
| Anything else?                   | Optional, up to 500 characters, with a note not to include details they don't want CHED to keep. |
| Consent                          | Required, and specific to being contacted.                                                       |

- **"No, it isn't safe"** stores nothing. The page shows the help contacts and
  CHED's email for when it is safe.
- **Under 18:** until CHED sets a protocol, show child-protection contacts
  instead of the form. A guardian-consent step can't be required here, because
  the person harming a child may be their guardian.
- **After submitting**, the page shows:
    - a request code with a neutral prefix, such as `R12-7KQ2M9XD` (never "HELP");
    - what happens next: "CHED RO XII aims to reach you within N working days,
      at the times you gave";
    - how to withdraw: email chedro12@ched.gov.ph with the code;
    - the emergency contact again.
- Throttled like survey submissions (`throttle:5,60`), with a honeypot field and
  no CAPTCHA.

### What staff see

**Admin → Support requests**, for users with `support-requests.view`:

- **The list** shows the code, when it was received, status (New, In progress,
  Closed), assignee, and safe times. It never shows contact details.
- **The detail page** shows the contact details, safe-contact notes, the help
  wanted, the message, and internal notes. Staff can assign the request, change
  its status, and close it with an outcome: Reached, Referred, Couldn't reach,
  or Withdrawn. "Delete now" handles withdrawals, confirmed with
  `ConfirmPopover`.
- **A survey reference**, when given, links to the response only for staff who
  also have `survey-responses.view`.
- **Every view and change is logged**, and the history is shown on the request.
- **Reminders on the detail page:** neutral email subjects and texts, no
  voicemail that mentions the survey, and respect for the safe times.
- **Version 1 sends nothing to requesters.** Staff reach them by hand from
  official CHED channels.
- **New requests** show a count in the sidebar. An optional email to a CHED
  mailbox says only "A new support request is waiting in PHLGADIS", with no
  personal details. In production this needs mail configured and a queue
  worker (`QUEUE_CONNECTION=database`).

## Data

These are three new tables, each with a new create migration. Adding a table is
not an edit of an existing migration.

- **`help_contacts`**: id; name; description, phone, email, and url, all
  nullable; `survey_slugs` as JSON, where null means every survey; sort_order;
  is_active; timestamps.
- **`support_requests`**:
    - ULID `id`, like `survey_responses`, and a unique `code`;
    - status, outcome, `closed_at`, and `assigned_to` (users, null on delete);
    - `safe_to_contact` and `help_types` (JSON);
    - with the `encrypted` cast: email, mobile, preferred_name, contact_times,
      message, and survey_reference;
    - no foreign key to `survey_responses`: the optional reference is kept as
      text, and looked up only when a permitted user opens the request.
- **`support_request_events`**: request (cascade), user (null on delete), type
  (viewed, assigned, status, note), body (encrypted, for notes), and
  created_at. It holds the audit trail and the notes.

Encryption uses `APP_KEY`. Rotate it with `APP_PREVIOUS_KEYS`, never by
replacing the key, or every stored contact becomes unreadable. Never log
contact fields or put them in exception context. Encrypted columns can't be
searched, and the list doesn't need to.

## Retention

- `support-requests:prune` runs daily, scheduled next to
  `surveys:prune-expired` in `routes/console.php`.
- Closed requests are deleted N days after closing. The default is 90 days,
  and CHED decides. Their events go with them.
- Open requests are never deleted automatically. The list highlights any older
  than 30 days.
- Yearly counts of requests and outcomes, with no personal data, are kept for
  statistics, the same way as the survey totals.

## Notices

- The support form has its own privacy notice. It says:
    - what is collected;
    - its single purpose, contacting you about the help you asked for;
    - who sees it: named CHED RO XII staff;
    - how long it is kept;
    - that it is separate from your survey answers unless you add your
      reference;
    - how to withdraw, and whom to contact.
- The survey notices can add: "If you ask CHED to contact you, that request is
  kept separately from your answers."
- The survey promise "No name or email is collected" stays true.

## Permissions

Add a "Support requests" group to `database/seeders/RbacSeeder.php`:

- `support-requests.view`: list and open requests.
- `support-requests.manage`: assign, add notes, change status, close, and
  delete.

Don't grant these to HEI users or GAD focal persons. Give them through a
dedicated role to named CHED staff.

## Decisions for CHED RO XII

| Decision                                  | Why it matters                                              | Suggested default                   |
| ----------------------------------------- | ----------------------------------------------------------- | ----------------------------------- |
| Who handles requests, and a backup        | Every request needs an owner                                | One named officer and one backup    |
| How fast they respond                     | Shown to the requester; never promise more than CHED can do | 3 working days                      |
| Which hotlines and offices to list        | The help box shows only these, verified                     | 911 plus the offices CHED confirms  |
| How long closed requests are kept         | Goes in the notice and the prune                            | 90 days after closing               |
| May requesters add their survey reference | It makes their answers identifiable to staff                | Yes, optional and clearly explained |
| Protocol for under-18s                    | A guardian may be the one causing harm                      | Child-protection contacts, no form  |
| Do Administrators see requests            | Fewer people seeing them is safer                           | No, only the dedicated role         |
| DPO review, impact assessment, NPC filing | Required by RA 10173 for this processing                    | Done before launch                  |

## Build order

1. **Help contacts and the help box.** They can ship alone, since they hold no
   personal data.
2. **Support requests:** the form, staff inbox, events, prune, notices, and
   permissions.
3. **Later:** each HEI's own CODI contact on the confirmation page (once HEI
   profiles hold it), a self-service withdrawal page, and SMS if CHED gets a
   gateway.

## Tests to write

Pest:

- `survey_responses` has no contact columns and no link to `support_requests`.
- Contact fields are stored encrypted.
- Only `support-requests.view` can list or open requests. Everyone else gets
  403, and HEI users never see the menu.
- Opening a request records a viewed event.
- "Not safe to contact" stores nothing.
- The form needs consent and is throttled.
- The prune removes closed requests after the retention period and keeps open
  ones.
- Help contacts: inactive contacts and other laws' contacts are hidden, and the
  box is hidden when the list is empty.

Playwright:

- The confirmation page shows the help box and the request link, and passes
  the axe checks the survey specs already run.
- A submitted request appears for a permitted admin but not for an HEI user.
- Quick exit lands on the neutral site.
