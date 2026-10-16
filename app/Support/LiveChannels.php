<?php

namespace App\Support;

use App\Enums\ActivityAction;
use App\Enums\ActivityModule;
use App\Models\ActivityLog;
use App\Models\GadEvent;
use App\Models\GadEventCertificate;
use App\Models\GadEventCheckIn;
use App\Models\GadEventGuest;
use App\Models\GadEventRegistration;
use App\Models\Post;
use App\Models\PostComment;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;

/**
 * The live-update channels (docs/realtime.md): which ones a change is told
 * on, and which ones a person may follow. One rule serves both, so a page is
 * only ever offered channels its reader is allowed to join.
 *
 * - `live.{module}`: every change in a module, for the Central Office, or
 *   for everyone where the module is read the same in every region.
 * - `live.{module}.region.{id}` / `.region.none`: a region's changes, and
 *   those that belong to no region (such as events for every region).
 * - `live.{module}.hei.{id}`: one HEI's changes, for its own people, such as
 *   `live.colleagues.hei.{id}` for its accounts joining or changing.
 * - `record.post.{id}`, `record.event.{id}`: one post or event, for its page.
 *
 * The signals carry no data, but for the ids of changed posts on
 * `live.community` (every signed-in reader sees every post): a page that
 * hears one asks the server again.
 */
final class LiveChannels
{
    /** Read the same in every region: one channel for everyone. */
    private const EVERYONE = 'everyone';

    /** Seen by the people placed in a region, HEI accounts and staff alike. */
    private const MEMBERS = 'members';

    /** Staff work, by their office's region; an HEI's people see their own HEI's. */
    private const OFFICE = 'office';

    /** An HEI's own people, about each other: only their HEI's channel. */
    private const INSTITUTION = 'institution';

    /**
     * Module code => [audience, permissions that let one follow it (any of
     * them; none means every signed-in account)]. `activity-logs` is the
     * Activity logs page, which hears every module.
     *
     * @var array<string, array{0: string, 1: list<string>}>
     */
    private const MODULES = [
        'users' => [self::OFFICE, ['users.view']],
        'roles' => [self::OFFICE, ['roles.view']],
        'academic-years' => [self::OFFICE, ['academic-years.view']],
        'regions' => [self::OFFICE, ['survey-directories.view', 'region-offices.update']],
        'clusters' => [self::OFFICE, ['survey-directories.view']],
        'heis' => [self::OFFICE, ['survey-directories.view']],
        'respondent-groups' => [self::OFFICE, ['survey-directories.view']],
        'surveys' => [self::OFFICE, ['surveys.view', 'survey-responses.view']],
        'survey-responses' => [self::OFFICE, ['surveys.view', 'survey-responses.view', 'monitoring.submit']],
        'events' => [self::MEMBERS, []],
        'carousel' => [self::OFFICE, ['carousel.view']],
        'community' => [self::EVERYONE, []],
        'monitoring' => [self::OFFICE, ['monitoring.view', 'monitoring.submit']],
        'gad-surveys' => [self::OFFICE, ['monitoring.view', 'monitoring.submit']],
        'site-ratings' => [self::OFFICE, ['site-ratings.view']],
        'site-feedback' => [self::OFFICE, ['feedback.view']],
        'student-counts' => [self::OFFICE, ['student-counts.view']],
        'quests' => [self::MEMBERS, ['quests.view', 'quests.play']],
        'badges' => [self::EVERYONE, []],
        'people' => [self::EVERYONE, []],
        // "People at your institution": accounts that joined or changed there.
        'colleagues' => [self::INSTITUTION, []],
        'certificates' => [self::OFFICE, ['certificates.view', 'certificates.release']],
        'activity-logs' => [self::OFFICE, ['activity-logs.view']],
    ];

    /**
     * The channels a logged change is told on: its module's, by its place,
     * the Activity logs page's, and its post's or event's page.
     *
     * @return list<string>
     */
    public static function forEntry(ActivityLog $entry, ?Model $subject = null): array
    {
        $modules = match ($entry->module) {
            // A sign-up waits in the users list, or joins its HEI's people;
            // other sign-ins and account changes show only in the activity log.
            ActivityModule::Authentication => $entry->action === ActivityAction::Registered ? ['users', 'colleagues'] : [],
            ActivityModule::Users => ['users', 'colleagues'],
            ActivityModule::Account => [],
            default => [$entry->module->value],
        };
        $channels = [];

        foreach ([...$modules, 'activity-logs'] as $module) {
            $channels = [...$channels, ...self::placed($module, $entry->survey_region_id, $entry->survey_hei_id)];
        }

        $record = $subject !== null ? self::record($subject) : null;

        return $record !== null ? [...$channels, $record] : $channels;
    }

    /**
     * The channels a change in a module is told on, by where it happened.
     *
     * @return list<string>
     */
    public static function placed(string $module, ?int $regionId, ?int $heiId = null): array
    {
        if (! isset(self::MODULES[$module])) {
            return [];
        }

        if (self::MODULES[$module][0] === self::EVERYONE) {
            return ["live.{$module}"];
        }

        if (self::MODULES[$module][0] === self::INSTITUTION) {
            return $heiId !== null ? ["live.{$module}.hei.{$heiId}"] : [];
        }

        return [
            "live.{$module}",
            "live.{$module}.region.".($regionId ?? 'none'),
            ...($heiId !== null ? ["live.{$module}.hei.{$heiId}"] : []),
        ];
    }

    /**
     * The module channels a person follows: the whole module for the Central
     * Office; otherwise their region's and the region-less, and for an HEI's
     * people their own HEI's staff work.
     *
     * @return list<string>
     */
    public static function follow(User $user, string $module): array
    {
        [$audience, $permissions] = self::MODULES[$module] ?? [null, []];

        if ($audience === null || ($permissions !== [] && ! self::holdsAny($user, $permissions))) {
            return [];
        }

        if ($audience === self::INSTITUTION) {
            return $user->survey_hei_id !== null ? ["live.{$module}.hei.{$user->survey_hei_id}"] : [];
        }

        if ($audience === self::EVERYONE || $user->national_access) {
            return ["live.{$module}"];
        }

        $regionId = $audience === self::MEMBERS ? $user->regionId() : $user->survey_region_id;

        return [
            ...($regionId !== null ? ["live.{$module}.region.{$regionId}"] : []),
            ...($audience === self::MEMBERS || $regionId !== null ? ["live.{$module}.region.none"] : []),
            ...($audience === self::OFFICE && $user->survey_hei_id !== null ? ["live.{$module}.hei.{$user->survey_hei_id}"] : []),
        ];
    }

    /**
     * Every module channel a person follows, by module, for the pages to
     * pick from (HandleInertiaRequests).
     *
     * @return array<string, list<string>>
     */
    public static function followedBy(User $user): array
    {
        return array_filter(array_map(
            fn (string $module): array => self::follow($user, $module),
            array_combine(array_keys(self::MODULES), array_keys(self::MODULES)),
        ));
    }

    /** Whether a person may join a module channel. */
    public static function mayFollow(User $user, string $module, string $channel): bool
    {
        return in_array($channel, self::follow($user, $module), true);
    }

    /** The post a change is about, when it is about one: itself, or a comment's. */
    public static function postOf(Model $subject): ?string
    {
        return match (true) {
            $subject instanceof Post => (string) $subject->getKey(),
            $subject instanceof PostComment => $subject->post_id,
            default => null,
        };
    }

    /** The page a change shows on, when it has one: its post's or its event's. */
    private static function record(Model $subject): ?string
    {
        $post = self::postOf($subject);

        return match (true) {
            $post !== null => "record.post.{$post}",
            $subject instanceof GadEvent => "record.event.{$subject->getKey()}",
            $subject instanceof GadEventRegistration,
            $subject instanceof GadEventCheckIn,
            $subject instanceof GadEventGuest,
            $subject instanceof GadEventCertificate => "record.event.{$subject->gad_event_id}",
            default => null,
        };
    }

    /** @param  list<string>  $permissions */
    private static function holdsAny(User $user, array $permissions): bool
    {
        foreach ($permissions as $permission) {
            if ($user->hasPermissionTo($permission)) {
                return true;
            }
        }

        return false;
    }
}
