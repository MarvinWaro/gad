# GAD Quest (Beta)

GAD Quest is a short quiz for a GAD activity, campaign or event. A CHED office writes five easy questions, opens the quest, and the people of its region play it one question at a time. Each answer is explained as soon as it is given, and finishing earns a badge that stays on the player's profile. Staff see who played and how they did, split by sex.

It follows the idea in `PHLGADIS_GAD_Quest_Idea.md`: interaction first, gaming second. There is no timer, no public ranking and no streak. Everything that names it carries a **Beta** tag (`components/beta-tag.tsx`, `NavItem.beta`).

**Where things live**

| Piece              | File                                                                                                                                     |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Tables             | `quests`, `quest_questions`, `quest_choices`, `quest_attempts`, `quest_answers` (migration `2026_10_05_000000_create_quests_tables.php`) |
| Models             | `Quest`, `QuestQuestion`, `QuestChoice`, `QuestAttempt`, `QuestAnswer`; `App\Enums\QuestStatus`, `App\Enums\QuestLevel`                  |
| Rules              | `App\Actions\Quests\SaveQuest` (writing), `ManageQuest` (open, close, retakes, delete), `PlayQuest` (the game)                           |
| Who may do what    | `App\Policies\QuestPolicy`, `User::playsQuests()`, `User::regionId()`                                                                    |
| Shapes             | `App\Support\QuestPlayState` (the player's), `QuestAchievements` (badges), `QuestResults` (staff figures), `QuestResource` (staff's)     |
| Controllers (thin) | `QuestController` (players), `ManageQuestController` (staff), with the Form Requests in `app/Http/Requests/Quests/`                      |
| Routes             | `routes/quests.php`                                                                                                                      |
| Pages              | `resources/js/pages/quests/` (`index`, `play`, `manage/index`, `manage/edit`, `manage/show`) and `components/quests/`                    |

## The flow

1. **Write.** An Administrator or CHED Focal writes a quest under GAD Quest → Manage → New quest: a title, an optional description, and exactly five questions. Each question has 2–4 choices, the correct one marked, and an explanation players read after answering. A new quest is a **draft**, which nobody else sees.
2. **Open.** "Open quest" publishes it to the people of its region. "Close" stops new plays; players keep their badges. "Open again" reopens it.
3. **Play.** A player opens the quest from the HEI home's GAD Quest card, the "GAD Quest" tab, or `/quests`. They see an introduction, then one question per screen. Choosing a choice sends it; the screen then shows "Correct." or "Not quite.", the right answer, and the explanation, then "Next question". The last answer leads to the score and the badge, and a review of every answer.
4. **Badge.** The best finished attempt sets the badge, drawn with the medal every badge shares, or its level's picture. Each level's name, description and picture are its row in Settings → Badges (`docs/badges.md`). It shows on My Profile (Achievements) and on `/quests`, and opens its details: the level and what it means, the score, the date earned and the organizer. A finish that earns the badge, or a higher level of it on a replay, reaches the player's notifications: "You earned the … Champion badge. See it on your profile."
5. **Results.** The quest's page in Manage shows players, finished, perfect scores and the average score, who finished by sex, and the participants, best score first, filtered by HEI (and region, for a quest for every region).

## Who and where

| Permission      | Allows                                         | Seeded for                                                |
| --------------- | ---------------------------------------------- | --------------------------------------------------------- |
| `quests.play`   | playing quests and earning badges              | every role; Administrators hold it but never play (below) |
| `quests.view`   | Manage, and a quest's results with its answers | Administrators, CHED Focals                               |
| `quests.create` | writing a quest                                | Administrators, CHED Focals                               |
| `quests.update` | editing, opening, closing and retakes          | Administrators, CHED Focals                               |
| `quests.delete` | deleting a quest nobody has played             | Administrators, CHED Focals                               |

- **Administrators run quests; they do not play.** They hold every permission, so the "nothing above your own access" rule of Settings → Users still lets them manage every account. `User::playsQuests()` is the one place that decides playing: `quests.play`, and not an Administrator. The browser reads it as `auth.playsQuests`.
- **Place follows the office.** A regional office writes and runs its own region's quests, whatever region a request names. The Central Office picks a region, or none for **every region**; only national accounts run those.
- **Players play their region's quests and those for every region.** An HEI account's region comes through its HEI; staff's through their office (`User::regionId()`). Central Office staff play quests for every region.
- **A quest's author does not play it.** They wrote the answers. Other staff of the region may.
- A staff account with both sides (a CHED Focal) sees Play and Manage tabs.

## Rules worth knowing

- **Answers stay on the server.** Inspecting the page (DevTools, the network tab, the page's data) shows each question and its choices, never which choice is right.
    - The correct choice and the explanation arrive only for questions already answered (`QuestPlayState`), and `PlayQuest` checks every answer.
    - **Choices go by an opaque key, not their id** (`QuestAttempt::keyFor`, an HMAC of the attempt and the choice with the app key). Ids count up in the order the author wrote the choices, and the form starts with A marked correct, so an id would often point at the answer. The player sends the key back and the server finds the choice.
    - `PlayQuestTest` and `gad-quest.spec.ts` check this: the second reads every response the browser receives before the first answer.
    - What it cannot stop: a player who finished can screenshot their review and share it, and someone with two accounts can play twice. The shuffled order makes shared answers less useful, as the idea document suggests, but this is a game, not an exam.
- **One attempt by default.** "Let players retake it" on the quest's page turns retakes on or off at any time. With retakes on, players who finished can play again, and their best attempt counts. An attempt left halfway carries on where it stopped.
- **Shuffled, but stable.** Each attempt sees the questions and choices in its own order, sorted by their keys, so a reload shows the same order and nothing extra is stored.
- **The questions lock once anyone has played.** After the first attempt, the questions and region stay as they were played, so scores and badges keep their meaning. The title and description can still change. A played quest cannot be deleted; close it instead.
- **Scores are never stored.** An attempt's score is the number of its answers whose choice is correct, counted in SQL (`QuestAttempt::withScore`).
- **Levels** (`QuestLevel`): **Participant** for finishing, **Advocate** for 80% or more (4 of 5), **Champion** for every answer right. Only the highest level shows, one badge per quest.
- **Place on every attempt.** An attempt records the region and HEI its player belonged to when they played, so results stay where they happened if an account moves.
- **Activity log** (module "GAD Quest"): created, updated (including retakes and edited questions), published (opened or reopened), closed, deleted, and each player's completed quest with its score and level.
- **Wording.** The game stays respectful: "Correct." and "Not quite.", no jokes, no celebration over sensitive scenarios, no timer.
- **Content.** Questions about laws should name their source in the explanation, as the form asks. PHLGADIS never ships quest content of its own; the test fixtures use placeholder wording.

## Not yet

Notifications when a quest opens, QR codes at events, question pools, a separate reviewer before opening, practice retakes that do not count, and a public leaderboard. The idea document lists them.

## Checks

`tests/Feature/Quests/ManageQuestTest.php`, `tests/Feature/Quests/PlayQuestTest.php`, and `tests/browser/gad-quest.spec.ts` (with a fixture quest in `tests/browser/server.php`). The pages are also in `tests/browser/mobile.spec.ts`.
