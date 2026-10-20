<?php

namespace App\Notifications;

use App\Models\User;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * The email a new account's holder gets when a user manager creates it with
 * an emailed password (PasswordDelivery::Email): where to sign in, with
 * which email and password. The password works once: the first sign-in asks
 * for their own (EnsurePasswordIsChanged). Sent at once, so the manager
 * learns there and then if it could not go out.
 */
class AccountCreated extends Notification
{
    public function __construct(private readonly string $password) {}

    /** @return list<string> */
    public function via(User $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(User $notifiable): MailMessage
    {
        $app = (string) config('app.name');

        return (new MailMessage)
            ->subject(__('Your :app account', ['app' => $app]))
            ->greeting(__('Hello, :name!', ['name' => $notifiable->name]))
            ->line(__('An account on :app, the Philippine Higher Education Gender and Development Information System, was created for you.', ['app' => $app]))
            // The lines are Markdown: an underscore in an address would turn
            // part of it italic.
            ->line(__('Sign in with your email address, :email, and this password: **:password**', [
                'email' => str_replace(['_', '*'], ['\_', '\*'], $notifiable->email),
                'password' => $this->password,
            ]))
            ->action(__('Sign in to :app', ['app' => $app]), route('login'))
            ->line(__('The first time you sign in, you will choose a password of your own, and this one stops working.'));
    }
}
