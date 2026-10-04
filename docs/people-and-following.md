# People: profiles, following and search

Every signed-in account has a profile others can open, can follow anyone, and can find people through the header search, as on Facebook. Built 2026-10-04.

## Profiles

- **Your own** is `/profile` (My Profile). **Anyone else's** is `/people/{id}`. Your own id there leads to `/profile`, keeping `?tab=`.
- **What others see:**
    - the name, photo and affiliation (`User::affiliation()`: the institution, or "CHED {office}", or "CHED Central Office")
    - follower and following counts, counting active accounts only
    - Achievements and the Badges tab
    - their Gender Mainstreaming posts, and About
- **Private:** email and roles never leave the server on someone else's profile, and the Activity tab is your own only. Your own profile adds Activity, your roles, and the badges you can still earn.
- **Who can open them:** every signed-in member opens anyone's profile, across regions, as the feed is national. Accounts waiting for approval have no profile, and answer "not found". A deactivated account's profile stays readable, marked "Deactivated account", with no Follow button.
- **Getting there:** names link to profiles on a post's byline, in comments, in the Reactions dialog, in People at your institution, in follower lists and in search results. A follow notification opens the follower's profile.

## Following

- **Follow and unfollow:** Follow, then "Following", whose menu holds "Unfollow", so a stray tap never unfollows. Nobody follows themselves; only active accounts follow or are followed. Anyone may stop following, even someone who can no longer sign in.
- **What it does:**
    - The feed gets **All posts · Following** tabs (`?feed=following`), on the HEI home and in Gender Mainstreaming for staff. Following shows only the posts of the people you follow, and the new-posts check counts only theirs. All posts stays every region's.
    - The person followed is told ("started following you"). Unfollowing removes that notice, so following again and again sends no pile of notices. Both are logged (module People: Followed, Unfollowed).
- **Lists:** "N followers · N following" on a profile open the people, the latest first, 20 at a time.

## Search

The header's field (from 768px in the top header and from 1024px in the sidebar layout's top bar; an icon below that) suggests people as you type. Enter, or "See all results", opens `/search?q=`, which lists everyone found, 20 at a time, each with a Follow button.

**How a name is matched** (`App\Support\PeopleSearch`, the one rule):

- Capitals, accents and punctuation don't matter: "PEÑA" finds Peña, "maria-pena" finds María Peña.
- Every word typed must **start** a word of the name, in any order: "mar wa" finds Marvin Waro; "arvin" finds nothing.
- From three letters, a word also matches a word that **sounds** alike (metaphone, with silent H's dropped): "Marven" finds Marvin, "Jhon" finds John, "Rheyman" finds Reymann.
- Someone whose **institution's** name holds the whole search matches too.
- At least two characters; at most the first five words count.

**Order:** the exact name, then a name that starts with the search, then every word matching by its letters, then by sound, then by institution only. Within each: people you follow, then your own institution, then your region, then by name.

**Keeping it quick:**

- Each account stores two search keys beside its name, `search_name` and `search_sounds`. They are derived from the name by the User model whenever it changes, never edited, and hidden from every response.
- Matching is plain SQL over those short columns, which takes milliseconds for tens of thousands of accounts.
- The browser waits 200ms after typing, cancels a search the next one replaces, and keeps the answers while the page is open.
- The suggestions endpoint is throttled to 90 a minute per person.
- Past a few hundred thousand accounts, put Laravel Scout with Meilisearch behind `PeopleSearch::query()`; nothing that calls it would change.

## Endpoints (signed in)

| Method and path                                              | What                                                                           |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| `GET /people/{id}`                                           | The profile page (`?tab=posts\|about\|badges`).                                |
| `GET /people/{id}/followers`, `/following`                   | JSON, `PersonResource`, 20 a page, the latest first. Throttled to 60 a minute. |
| `POST /people/{id}/follow`                                   | `{following, followers_count}`. Throttled to 30 a minute.                      |
| `DELETE /people/{id}/follow`                                 | The same.                                                                      |
| `GET /search/people?q=`                                      | JSON, the best 8, `PersonResource`. Throttled to 90 a minute.                  |
| `GET /search?q=`                                             | The results page, 20 at a time.                                                |
| `GET /dashboard?feed=following`, `/community?feed=following` | The Following feed.                                                            |

`PersonResource` carries `id`, `name`, `avatar`, `affiliation`, `following` (you follow them), `follows_you` and `is_you`; `PersonProfileResource` adds the counts, `deactivated` and `can_follow`. People are addressed by their integer id for now (`docs/national-and-api-readiness.md`).

## Where things live

| Piece       | File                                                                                                                                     |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Tables      | `follows`, and `users.search_name` and `search_sounds` (migration `2026_10_08_000000_create_follows_and_people_search.php`)              |
| Rules       | `App\Actions\People\FollowPerson`, `App\Support\PeopleSearch`, `App\Policies\UserPolicy`                                                 |
| Shapes      | `PersonResource`, `PersonProfileResource`, `App\Support\ProfilePage`                                                                     |
| Controllers | `PersonProfileController`, `FollowController`, `PeopleSearchController`, `MyProfileController`                                           |
| Pages       | `pages/profile/show.tsx`, `pages/search/index.tsx`, `components/people/`, `components/header-search.tsx`, `components/hei/feed-tabs.tsx` |

## Checks

`tests/Feature/People/` (following, profiles, search) and `tests/browser/people.spec.ts`. The search page and a profile are in `tests/browser/mobile.spec.ts`.
