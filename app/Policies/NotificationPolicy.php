<?php

namespace App\Policies;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Auth\Access\Response;

/**
 * Notifications are private to the person told. Anyone else's is answered
 * as not found, so its existence is never confirmed.
 */
class NotificationPolicy
{
    public function view(User $user, Notification $notification): Response
    {
        return $this->own($user, $notification);
    }

    public function update(User $user, Notification $notification): Response
    {
        return $this->own($user, $notification);
    }

    public function delete(User $user, Notification $notification): Response
    {
        return $this->own($user, $notification);
    }

    private function own(User $user, Notification $notification): Response
    {
        return $notification->user_id === $user->id ? Response::allow() : Response::denyAsNotFound();
    }
}
