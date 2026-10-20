<?php

namespace App\Enums;

/**
 * How an account a user manager creates gets its first password: a random
 * one emailed to its holder, or the shared temporary password
 * (`auth.temporary_password`) the manager passes on. Either way it is
 * replaced at the first sign-in. Sent as `password_delivery`; the codes are
 * stable.
 */
enum PasswordDelivery: string
{
    case Email = 'email';
    case Temporary = 'temporary';
}
