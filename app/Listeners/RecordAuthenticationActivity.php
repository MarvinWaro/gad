<?php

namespace App\Listeners;

use App\Enums\ActivityAction;
use App\Enums\ActivityModule;
use App\Models\ActivityLog;
use App\Models\User;
use App\Services\ActivityRecorder;
use App\Services\Notifier;
use Illuminate\Auth\Events\Failed;
use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Logout;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Auth\Events\Registered;
use Laravel\Fortify\Events\TwoFactorAuthenticationConfirmed;
use Laravel\Fortify\Events\TwoFactorAuthenticationDisabled;
use Laravel\Fortify\Events\TwoFactorAuthenticationFailed;
use Laravel\Fortify\Fortify;
use Laravel\Passkeys\Events\PasskeyDeleted;
use Laravel\Passkeys\Events\PasskeyRegistered;

/**
 * Logs signing in and out, failed attempts, registration and the account's
 * security settings, from the events Laravel, Fortify and Passkeys raise.
 */
class RecordAuthenticationActivity
{
    public function __construct(
        private readonly ActivityRecorder $activity,
        private readonly Notifier $notifier,
    ) {}

    public function handleLogin(Login $event): void
    {
        $this->forUser($event->user, ActivityAction::Login, ActivityModule::Authentication);
    }

    public function handleLogout(Logout $event): void
    {
        $this->forUser($event->user, ActivityAction::Logout, ActivityModule::Authentication);
    }

    /**
     * A wrong email or password. The typed email names the attempt; the
     * account it belongs to, if any, places it. The password is never kept.
     */
    public function handleFailed(Failed $event): void
    {
        $email = (string) ($event->credentials[Fortify::username()] ?? '');
        $this->failed($email, User::query()->where('email', $email)->first(), 'credentials');
    }

    public function handleTwoFactorFailed(TwoFactorAuthenticationFailed $event): void
    {
        $this->failed($event->user->email, $event->user, 'two_factor');
    }

    /** A registration waiting for approval also tells the people who approve it. */
    public function handleRegistered(Registered $event): void
    {
        $entry = $this->forUser($event->user, ActivityAction::Registered, ActivityModule::Authentication);

        if ($event->user instanceof User) {
            $this->notifier->accountRegistered($event->user, $entry);
        }
    }

    public function handlePasswordReset(PasswordReset $event): void
    {
        $this->forUser($event->user, ActivityAction::PasswordReset, ActivityModule::Authentication);
    }

    /** Two-factor counts as on once the first code is confirmed. */
    public function handleTwoFactorConfirmed(TwoFactorAuthenticationConfirmed $event): void
    {
        $this->forUser($event->user, ActivityAction::TwoFactorEnabled, ActivityModule::Account);
    }

    public function handleTwoFactorDisabled(TwoFactorAuthenticationDisabled $event): void
    {
        $this->forUser($event->user, ActivityAction::TwoFactorDisabled, ActivityModule::Account);
    }

    public function handlePasskeyRegistered(PasskeyRegistered $event): void
    {
        $this->forUser($event->user, ActivityAction::PasskeyAdded, ActivityModule::Account, ['passkey' => $event->passkey->name]);
    }

    public function handlePasskeyDeleted(PasskeyDeleted $event): void
    {
        $this->forUser($event->user, ActivityAction::PasskeyRemoved, ActivityModule::Account, ['passkey' => $event->passkey->name]);
    }

    /**
     * A refused sign-in, also called when a known account is pending or
     * deactivated. `$reason` is a code: credentials, two_factor or the
     * account's status.
     */
    public function failed(string $email, ?User $account, string $reason): void
    {
        $this->activity->record(
            ActivityAction::LoginFailed,
            ActivityModule::Authentication,
            subject: $account,
            properties: ['reason' => $reason],
            actorName: $email !== '' ? $email : 'Unknown',
        );
    }

    /** @param array<string, mixed> $properties */
    private function forUser(mixed $user, ActivityAction $action, ActivityModule $module, array $properties = []): ?ActivityLog
    {
        return $user instanceof User
            ? $this->activity->record($action, $module, properties: $properties, actor: $user)
            : null;
    }
}
