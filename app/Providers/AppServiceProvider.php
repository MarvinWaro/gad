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

        // The website feedback form counts on its own, so answering the law
        // surveys or rating the site never uses up a visitor's feedback.
        RateLimiter::for('feedback', fn (Request $request): Limit => Limit::perHour(5)->by('feedback|'.$request->ip()));
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
