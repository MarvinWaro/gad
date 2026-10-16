# Live updates

Signed-in pages update by themselves when what they show changes: the bell, the community feed (new posts, and the comments, reactions and shares of the posts shown), a post's page, users waiting for approval, event lists, the scanner's count, monitoring reports, survey answers, certificates, the dashboard and the settings lists. Public pages (homepage, public events, survey forms) do not.

They go through the WebSocket (Soketi) app that Berth provisions for PHLGADIS. Soketi speaks the Pusher protocol, so the server uses Laravel's `pusher` broadcaster and the browser uses `pusher-js`.

## How it works

**Signals, not data.** A change sends a signal that carries nothing: no names, no content, only the channel it is sent on. A page that hears one asks the server again for its own props (an Inertia partial reload), so who may see what is still decided by the same controllers, policies and region scoping as any visit.

**The one exception: the feed.** A feed cannot reload its posts (they scroll, page by page), so the community channel also hears `posts`, which names the posts that changed: their ids, nothing else. Every signed-in reader may see every post, so the ids tell no one anything new. A feed asks `GET /posts/live?ids[]=…` (at most 20 at once) for just the posts it shows among them, as its reader sees them, and swaps them in place with `router.replaceProp('posts.data', …)` (`useLivePosts`). A post left out of the answer was deleted and leaves the feed. Cards not named keep their own state, and an open post keeps its comment draft.

- **Sending.** `App\Services\LiveUpdates` is the only place that broadcasts. `ActivityRecorder` hands it every logged change, `Notifier` and `NotificationInbox` every change to someone's notifications. Changes that are never logged tell it themselves: anonymous survey answers, website feedback and site ratings (`touched()`).
- **After the response.** Signals are gathered while a request, command or job runs, then sent once, together, with `defer()`. They use `ShouldBroadcastNow`, so no queue worker is needed. A failure is reported, never thrown, and the server gives up after 3 seconds: a slow or missing Soketi never holds up or undoes a change.
- **Channels** (`App\Support\LiveChannels`, authorised in `routes/channels.php`). All private.

| Channel                                                  | Told about                                                       | Who may follow                                                                                 |
| -------------------------------------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `App.Models.User.{id}`                                   | Their notifications changed (`inbox`)                            | That person                                                                                    |
| `live.{module}`                                          | Every change in a module                                         | The Central Office; everyone, for modules read the same everywhere (community, people, badges) |
| `live.{module}.region.{id}`, `live.{module}.region.none` | A region's changes; those that belong to no region               | Staff whose office covers it; for events and quests, everyone placed in it                     |
| `live.{module}.hei.{id}`                                 | One HEI's changes                                                | That HEI's people, for staff modules they hold (monitoring, GAD surveys, survey counts)        |
| `live.colleagues.hei.{id}`                               | An HEI's accounts joined or changed (People at your institution) | That HEI's own accounts                                                                        |
| `record.post.{id}`, `record.event.{id}`                  | One post (comments, reactions) or event (joins, check-ins)       | Anyone who may open it                                                                         |

Every page is sent `realtime` (HandleInertiaRequests): where to connect, the person's own channel, and the module channels they may follow. One rule (`LiveChannels::follow`) both offers the channels and authorises them, so a page never tries one it would be refused.

**The browser** (`resources/js/lib/realtime.ts`) opens one connection per tab, the first time a signed-in page listens; `pusher-js` loads only then. Channels are signed at `/broadcasting/auth` with the session's XSRF cookie. After a dropped connection, every listening page catches up once. The bell checks every 30 seconds only while live updates are off or down.

## Making a page live

One line in the page component:

```tsx
useLiveReload(useLiveModules('users'), ['users', 'statusCounts']);
```

- The modules are the codes in `LiveChannels::MODULES` (the activity log's module codes, plus `activity-logs`).
- The second argument lists the props to reload; an empty list reloads the whole page. Never list an `Inertia::scroll` prop: it would start over. The feed uses `useNewPosts` (new posts) and `useLivePosts` (the posts shown) instead.
- `{ gap }` limits busy pages (the dashboard reloads at most once a minute). Bursts of signals reload once, and a hidden tab reloads when it is looked at again.
- A post's or event's page follows its record: ``useLiveReload([`record.event.${event.id}`], [...])``. Things given to one person (certificates, badges) come with a notification: `useLiveReload(useOwnChannel(), [...], { event: 'inbox' })`.

Pages where someone types into a saved draft (the monitoring report and GAD survey forms) are deliberately not live.

## Setting it up

Take the `BROADCAST_*`, `PUSHER_*` and `VITE_PUSHER_*` lines from Berth: open the system, **WebSocket** tab, **Copy as .env**. The secret stays on the server; only the key (public by design) and the public host reach browsers. The `VITE_PUSHER_*` values are read by the server at run time and sent to the page, so the image needs no rebuild when they change.

- **On a laptop:** `BROADCAST_CONNECTION=pusher`, and the backend uses the public endpoint, because Soketi's internal name does not resolve outside Coolify: `PUSHER_HOST` = the `VITE_PUSHER_HOST` value, `PUSHER_PORT=443`, `PUSHER_SCHEME=https`. Then `php artisan config:clear`.
- **On Coolify:** the lines as Berth gives them (internal Soketi host, port 6001, http), as ordinary runtime variables. The app must run on the same server and Docker network as Soketi.
- **Off:** `BROADCAST_CONNECTION=log` (or leave the `VITE_PUSHER_*` lines out). Pages then work as before, and the bell checks every 30 seconds.

## Checking it

1. From the application's terminal: `curl -s "http://$PUSHER_HOST:$PUSHER_PORT"` answers `OK`.
2. `php artisan tinker --execute="dump(Broadcast::connection('pusher')->getPusher()->trigger('berth-check', 'ping', ['ok' => true]));"` answers an empty object. "The secret authentication failed" means `PUSHER_APP_SECRET` was rotated in Berth.
3. In the browser, DevTools → Network → WS shows `wss://<host>/app/<key>…` with `pusher:connection_established`, then `pusher:subscription_succeeded` for each channel.
4. With two browsers signed in, comment on someone's post: their bell and the post's page update without a refresh.
