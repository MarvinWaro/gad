<?php

namespace App\Enums;

/**
 * Account lifecycle. Public registrations start as pending and only reach
 * the application once an administrator approves them.
 */
enum UserStatus: string
{
    case Pending = 'pending';
    case Active = 'active';
    case Inactive = 'inactive';

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Pending',
            self::Active => 'Active',
            self::Inactive => 'Inactive',
        };
    }

    /** The reason shown on the login screen when this status blocks access. */
    public function loginMessage(): string
    {
        return match ($this) {
            self::Pending => __('Your account is awaiting approval by the administrator.'),
            self::Inactive => __('Your account has been deactivated. Please contact CHEDRO XII.'),
            self::Active => '',
        };
    }
}
