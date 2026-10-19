<?php

namespace App\Http\Middleware;

use App\Models\User;
use App\Services\NotificationInbox;
use App\Support\LiveChannels;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            // The office running this site, for the footer and help pages.
            'operator' => config('phlgadis.operator'),
            'auth' => [
                // Its own fields only: the roles and permissions that permission
                // checks load on it go out once, as `permissions` below.
                'user' => fn (): ?User => $user?->withoutRelations(),
                'roles' => fn (): array => $user?->roles()->pluck('slug')->all() ?? [],
                'permissions' => fn (): array => $user?->permissionSlugs() ?? [],
                // HEI roles only: the HEI home and header shell.
                'heiOnly' => fn (): bool => $user?->isHeiOnly() ?? false,
                // GAD Quest: everyone with the permission but administrators.
                'playsQuests' => fn (): bool => $user?->playsQuests() ?? false,
                // Where the account belongs, under its name: its institution
                // or its CHED office.
                'affiliation' => fn (): ?string => $user?->affiliation(),
                // A staff account's regional office; null for the Central
                // Office and HEI accounts.
                'officeRegion' => fn (): ?string => $user?->officeRegion?->name,
            ],
            // The bell's count, kept fresh by live updates (docs/realtime.md).
            'inbox' => fn (): ?array => $user !== null ? app(NotificationInbox::class)->summary($user) : null,
            // Live updates (docs/realtime.md): where to listen, and the channels
            // this person may follow, by module. Null while they are off.
            'realtime' => fn (): ?array => $user !== null ? $this->realtime($user) : null,
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }

    /**
     * @return array{key: string, host: string, port: int, scheme: string, cluster: string, user: string, modules: array<string, list<string>>}|null
     */
    private function realtime(User $user): ?array
    {
        /** @var array{key: ?string, host: ?string, port: int, scheme: string, cluster: string} $client */
        $client = config('broadcasting.connections.pusher.client');

        if (config('broadcasting.default') !== 'pusher' || blank($client['key']) || blank($client['host'])) {
            return null;
        }

        return [
            'key' => (string) $client['key'],
            'host' => (string) $client['host'],
            'port' => $client['port'],
            'scheme' => $client['scheme'],
            'cluster' => $client['cluster'],
            'user' => "App.Models.User.{$user->id}",
            'modules' => LiveChannels::followedBy($user),
        ];
    }
}
