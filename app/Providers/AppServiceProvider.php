<?php

namespace App\Providers;

use App\Models\User;
use App\Support\ActivitySubjects;
use Carbon\CarbonImmutable;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();

        // Activity logs store what they point at by these codes, not class names.
        Relation::morphMap(ActivitySubjects::TYPES);

        Gate::before(
            fn (User $user, string $ability): ?bool => $user->hasPermissionTo($ability)
                ? true
                : null,
        );

        // The public forms each count on their own, per visitor, with a far
        // higher ceiling for one network: at an event, a whole venue shares
        // one Wi-Fi address and must not lock itself out after five answers.
        RateLimiter::for('survey-answers', fn (Request $request): array => self::publicForm($request, 'survey', 10, 300));
        RateLimiter::for('ratings', fn (Request $request): array => self::publicForm($request, 'rating', 5, 300));
        RateLimiter::for('feedback', fn (Request $request): array => self::publicForm($request, 'feedback', 5, 100));
        // Signing up and password resets (ThrottleAccountForms): a venue may
        // register many people at once from one address.
        RateLimiter::for('account-forms', fn (Request $request): array => self::publicForm($request, 'account', 10, 300));
    }

    /**
     * A public form's limits an hour: `$perVisitor` for one browser (its
     * session, or its address when it sends no session cookie) and
     * `$perNetwork` for everyone behind one address.
     *
     * @return list<Limit>
     */
    private static function publicForm(Request $request, string $form, int $perVisitor, int $perNetwork): array
    {
        $visitor = $request->hasCookie((string) config('session.cookie')) && $request->hasSession()
            ? 'session|'.$request->session()->getId()
            : 'ip|'.$request->ip();

        return [
            Limit::perHour($perVisitor)->by("{$form}|{$visitor}"),
            Limit::perHour($perNetwork)->by("{$form}|network|{$request->ip()}"),
        ];
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}
