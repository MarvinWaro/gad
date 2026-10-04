# Badges

Badges show on a person's profile, beside their GAD Quest badges: the greatest few as a row of medals above the tabs (Achievements), and all of them in the profile's Badges tab. Other members see them on the person's profile too (`docs/people-and-following.md`). Some are **earned** by sharing GAD work in Gender Mainstreaming; the rest are **custom** badges an office awards by hand, for things worth marking, such as speaking at a Women's Month forum. Every badge shares one flat medal style (`components/badges/medal.tsx`), or shows its uploaded picture.

**Where things live**

| Piece             | File                                                                                                                          |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Tables            | `badges`, `badge_awards` (migration `2026_10_06_000000_create_badges_tables.php`, which also adds the four earned badges)     |
| Models            | `Badge`, `BadgeAward`; `App\Enums\BadgeRule` (how each earned badge is earned)                                                |
| Rules             | `App\Actions\Badges\AwardEarnedBadges` (earning), `ManageBadge` (writing, pictures, on and off, awarding and taking back)     |
| Who may do what   | `App\Policies\BadgePolicy`                                                                                                    |
| Shapes            | `BadgeResource`, `BadgeAwardResource` (Settings), `App\Support\Achievements` (profiles: badges and GAD Quest badges together) |
| Controller (thin) | `Settings\BadgeController`, with `SaveBadgeRequest`, `BadgeStatusRequest`, `AwardBadgeRequest`, `BadgeSearchRequest`          |
| Pages             | `pages/settings/badges.tsx`, `pages/settings/badge.tsx`, `components/badges/`                                                 |
| Command           | `php artisan badges:award`                                                                                                    |

## Earned badges

Milestones, so one rich post earns one badge and the rest take time. A post with a photo, a caption and an SDG earns Community Spark only.

| Badge              | Earned when (`BadgeRule`)                                           | Medal    |
| ------------------ | ------------------------------------------------------------------- | -------- |
| Community Spark    | a first own photo post tagged with an SDG or an A.C.H.I.E.V.E. item | sparkles |
| Visual Storyteller | such posts on 5 different days, in Philippine time                  | camera   |
| SDG Connector      | own posts supporting 5 different SDGs                               | globe    |
| Agenda Builder     | own posts supporting 4 different A.C.H.I.E.V.E. items               | compass  |

- **What counts:** the person's own posts. Shares do not count, and neither do deleted posts. The tag requirement is on purpose: tagged posts feed the dashboard's "Where GAD work meets the goals".
- **When:** right after someone posts (`PostController::store` calls `AwardEarnedBadges`), and the toast names the badge: "Post shared. You earned the Community Spark badge." `php artisan badges:award` checks everyone who has posted; run it once at launch, and after switching an earned badge back on.
- **Told:** each badge earned also reaches the earner's bell, from the system rather than from them: "You earned the Community Spark badge. See it on your profile." It opens their profile's Badges tab (`/profile?tab=badges`). The composer reloads the bell's count with the post, so the count rises at once. `badges:award` tells each person it gives a badge to.
- **Kept:** a badge once earned stays, even if the post is deleted later.
- **Thresholds** are constants on `BadgeRule`. Changing a number is a code change, on purpose: a rule builder screen would be heavy and easy to break.
- **The SDG Connector medal is a plain globe.** The UN's colour wheel and goal icons are not for badges (DESIGN.md, post goals).

## Custom badges

- **Writing:** Settings → Community → Badges → New badge: a name, what it is for, an optional picture, and on or off. A regional office's badge is for its own region's people; the Central Office picks a region, or every region.
- **Pictures:** PNG, JPG or WebP. The browser shrinks the picture to a 256px square WebP, transparency kept, before it is sent (`lib/square-image.ts`), so a 1 MB generated PNG becomes about 10–20 KB. The server takes 512 KB at most and never SVG, which can carry scripts. Without a picture the badge uses its medal. Replacing or removing a picture deletes the old file.
- **Awarding:** on the badge's page, Award finds the person by name or institution: active accounts of the badge's region (or the office's region, for a national badge from a regional office) who do not hold it yet. An optional note says what for. The person is told in their notifications ("awarded you the … badge"), which open their Badges tab.
- **Taking back:** a hand award can be taken back from the badge's page. An earned badge cannot.
- **Off:** nobody earns or is awarded a badge that is switched off; those who hold it keep it.
- **Deleting:** custom badges only. It leaves everyone's profile, with its picture. Earned badges are switched off instead.

## On a profile

`App\Support\Achievements::for` returns everything a person holds **greatest first**: a GAD Quest Champion, then badges given by hand, then Advocate, then the earned milestones, then Participant, newest first within each. The highlights row shows the first six (then "+N"); each medal opens the Badges tab at that badge. On your own profile the Badges tab also lists **Still to earn**: the earned badges you don't hold yet that are switched on, with how to earn each (`Achievements::toEarn`), and a link to GAD Quest for those who play.

## Who and where

| Permission      | Allows                                     | Seeded for     |
| --------------- | ------------------------------------------ | -------------- |
| `badges.view`   | Settings → Badges, and who holds each one  | Administrators |
| `badges.create` | new custom badges                          | Administrators |
| `badges.update` | editing, pictures, on and off              | Administrators |
| `badges.delete` | deleting a custom badge                    | Administrators |
| `badges.award`  | awarding a custom badge and taking it back | Administrators |

Other roles can be given them in Settings → Roles & permissions.

**Place follows the office.** A regional office runs its own region's custom badges and sees the national ones (the earned badges included) read-only, with its own region's holders. Only the Central Office edits national badges. Regions with their own badges cannot be deleted.

## Activity log

Module "Badges": created, updated (including pictures and on or off), deleted, earned (with the person as actor), awarded (with the recipient) and taken back.

## Checks

`tests/Feature/Badges/EarnedBadgesTest.php`, `tests/Feature/Badges/BadgeManagementTest.php`, and `tests/browser/badges.spec.ts`. Settings → Badges is in `tests/browser/mobile.spec.ts`.
