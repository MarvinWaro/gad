<?php

namespace App\Policies;

use App\Enums\UserStatus;
use App\Models\User;
use Illuminate\Auth\Access\Response;

/**
 * People's profiles and following (docs/people-and-following.md). Every
 * signed-in member may open anyone's profile and follow anyone. Accounts
 * still waiting for approval have no profile yet, and are answered as not
 * found.
 */
class UserPolicy
{
    public function viewProfile(User $viewer, User $person): Response
    {
        return $person->status !== UserStatus::Pending ? Response::allow() : Response::denyAsNotFound();
    }

    /** Only active accounts follow, or are followed, and never themselves. */
    public function follow(User $viewer, User $person): bool
    {
        return $viewer->isActive() && $person->isActive() && ! $viewer->is($person);
    }
}
