<?php

namespace App\Policies;

use App\Models\SiteFeedback;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class SiteFeedbackPolicy
{
    /**
     * Staff who delete feedback, for feedback their office may read. Feedback
     * out of reach is answered as not found, so its existence is never
     * confirmed.
     */
    public function delete(User $user, SiteFeedback $feedback): Response
    {
        if (! SiteFeedback::query()->visibleTo($user)->whereKey($feedback->getKey())->exists()) {
            return Response::denyAsNotFound();
        }

        return $user->hasPermissionTo('feedback.delete') ? Response::allow() : Response::deny();
    }
}
