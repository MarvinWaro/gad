# Notifications

The bell in the header (both shells, every role) tells people about what
concerns them. It shows a red count while anything is unread, and opens a
panel of the newest notifications. The panel loads five at a time as it
scrolls, and has "Mark all as read" and "View all notifications".
`/notifications` lists everything in a centred column, with All / Unread
tabs, a search, and Type and Module filters. It loads 15 at a time as the
reader scrolls.

Opening a notification marks it read and goes to its record. The ⋯ menu on
each one marks it read or unread, or deletes it after asking.

## Who is told what

| Module                            | Notification                                  | Who is told                                                                                                                                                  |
| --------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Gender Mainstreaming              | Someone commented on your post                | The post's author                                                                                                                                            |
|                                   | Someone replied to your comment               | The person the reply answers (instead of the comment notice)                                                                                                 |
|                                   | Someone reacted to your post                  | The author, for the first reaction only. A changed reaction updates the notice; a reaction taken back removes it.                                            |
|                                   | Someone shared your post                      | The original post's author, also when a share is shared                                                                                                      |
|                                   | Someone tagged you in a post                  | The people tagged                                                                                                                                            |
|                                   | A moderator removed your post or comment      | Its author                                                                                                                                                   |
| Monitoring reports                | An HEI submitted its signed report            | Accounts with `monitoring.review` whose office covers the report's region, and the Central Office                                                            |
|                                   | CHED marked a report reviewed, or returned it | The HEI's accounts with `monitoring.submit`. A return carries the reviewer's comment.                                                                        |
| GAD Training & Compliance Surveys | An HEI submitted or updated a GAD survey      | Reviewers whose office covers the HEI's region, and the Central Office                                                                                       |
| Users                             | Someone registered and waits for approval     | Accounts with `users.update` whose office covers the HEI's region, and the Central Office. Nothing is sent when the region is open for instant registration. |
|                                   | Your account was approved                     | The person approved                                                                                                                                          |
| GAD events                        | CHED added a GAD event                        | Every active account except its creator                                                                                                                      |
| Survey responses                  | New answers to a law survey                   | Accounts with `survey-responses.view` whose office covers the region the respondent chose (all of them when no region was chosen), and the Central Office    |
| Website feedback                  | A visitor sent website feedback               | Accounts with `feedback.view` (administrators) whose office covers the region the sender named (all of them when none was named), and the Central Office     |

Nobody is told about their own actions. Pending and deactivated accounts are
told nothing.

**Survey answers are grouped.** A survey drive can bring hundreds of answers,
so there is one notification per survey that counts up while it is unread:
"12 new responses to …". Once it is read, the next answer starts a new one.
It names no respondent and keeps nothing about them, only how many answered.
Website feedback is grouped the same way, in one notice that opens the list
(`/admin/feedback`): "3 new website feedback responses". It never names the
sender (`docs/feedback.md`).

Notifications are kept for good, like the activity log. Deleting one removes
it from that person's list only.

## How fresh it is

PHLGADIS has no live updates (Reverb) yet, so the browser asks for the count
every 30 seconds while the tab is in view, and at once when the reader comes
back after 30 seconds or more (`hooks/use-inbox.ts`). Opening the bell loads
the newest at once. Every page also brings the count, as the shared prop
`inbox`. When something new arrives on `/notifications`, the list reloads in
place near the top; further down, a "New notifications" button waits.

When Reverb arrives, a broadcast from `Notifier` to a private user channel can
replace the 30-second check. The count and the panel already update from one
place (`setInbox`).

## How it works

- **The activity log behind it.** Almost every notification is "someone did
  something that concerns you", and the activity log already records who did
  what, to which record, where and when. A row in `notifications` therefore
  points at its activity entry (`activity_log_id`) and adds only who is
  told, the kind, and whether it was read. Nothing is stored twice.
  Anonymous survey answers are never logged, so their grouped notice points
  at the survey itself (`subject_type`, `subject_id`) and counts up (`count`).
- **`App\Services\Notifier` is the only writer, and the one place that
  decides who is told about what.** Call it after the change and its activity
  entry, with the entry `ActivityRecorder` returned. A notice that cannot be
  written is reported, never thrown, so it can never undo the change it tells
  of. One notice per person per entry (a unique index), so retries never
  repeat one.
- **New GAD events** reach every account, tens of thousands at national
  scale, so `App\Jobs\NotifyAllAccounts` writes them in the background, in
  chunks. `composer dev` runs a queue listener. On a server, run
  `php artisan queue:work`, or rely on the scheduler, which drains the queue
  every minute (`routes/console.php`).
- **`App\Enums\NotificationKind`** holds each kind's code (stored, never
  reused), its label for the Type filter, its module (an `ActivityModule`),
  its colour and its sentence.
- **`App\Services\NotificationInbox`** is the reading side: the count, the
  filtered list, reading and clearing. The page, the bell and a future API
  share it.
- **`NotificationResource`** is the one shape. Its fields:
    - `id` (ULID), `kind` and `module` as codes with labels
    - `actor` (null for survey answers)
    - `sentence` (before, the record's name in bold, after)
    - `quote` (a reviewer's comment), `reaction`, `count`
    - `url`: only while the record exists and the reader may open its page, through `ActivitySubjects::url`
    - `read_at`, `notified_at`: ISO 8601 UTC

    The activity entry's address and device never leave the server.

- **Private.** `NotificationPolicy` answers anyone else's notification as not
  found.

### Endpoints (signed in)

| Method and path                | What                                                                                      |
| ------------------------------ | ----------------------------------------------------------------------------------------- |
| `GET /notifications`           | The page. Filters: `status=unread`, `search`, `kind`, `module`.                           |
| `GET /notifications/recent`    | JSON, five a page, cursor-paginated, with `inbox`. Throttled to 60 a minute.              |
| `GET /notifications/summary`   | JSON `{unread, latest_at}`. Throttled to 60 a minute.                                     |
| `GET /notifications/{id}`      | Marks it read, then redirects to its record, or back with a note when the record is gone. |
| `PATCH /notifications/{id}`    | `{read: true\|false}`. Answers with the notification and `inbox`.                         |
| `POST /notifications/read-all` | Answers with `inbox`.                                                                     |
| `DELETE /notifications/{id}`   | Answers with `inbox`.                                                                     |

### Adding a notification

1. Add a case to `NotificationKind`, with its label, module, colour and sentence.
2. Add a method to `Notifier` that picks the recipients, and call it where the
   change and its activity entry are made.
3. Give the kind a mark in `kindIcons` (`components/notifications/notification-item.tsx`).
4. Add a case to `tests/Feature/Notifications/NotifierTest.php`.
