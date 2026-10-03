<?php

namespace App\Enums;

/**
 * What an activity log entry records. The codes are stored and sent to the
 * browser and the API as they are; never reuse one for a different action.
 */
enum ActivityAction: string
{
    case Login = 'login';
    case Logout = 'logout';
    case LoginFailed = 'login_failed';
    case Registered = 'registered';
    case PasswordReset = 'password_reset';
    case Created = 'created';
    case Updated = 'updated';
    case Deleted = 'deleted';
    case Activated = 'activated';
    case Deactivated = 'deactivated';
    case Approved = 'approved';
    case MarkedPending = 'marked_pending';
    case Published = 'published';
    case Archived = 'archived';
    case DraftSaved = 'draft_saved';
    case Finalized = 'finalized';
    case Reopened = 'reopened';
    case Submitted = 'submitted';
    case Reviewed = 'reviewed';
    case Returned = 'returned';
    case Exported = 'exported';
    case Downloaded = 'downloaded';
    case Synced = 'synced';
    case Imported = 'imported';
    case Shared = 'shared';
    case Commented = 'commented';
    case Reacted = 'reacted';
    case Unreacted = 'unreacted';
    case PasswordChanged = 'password_changed';
    case TwoFactorEnabled = 'two_factor_enabled';
    case TwoFactorDisabled = 'two_factor_disabled';
    case PasskeyAdded = 'passkey_added';
    case PasskeyRemoved = 'passkey_removed';

    /** The entry's badge. */
    public function label(): string
    {
        return match ($this) {
            self::Login => 'Login',
            self::Logout => 'Logout',
            self::LoginFailed => 'Failed login',
            self::Registered => 'Registered',
            self::PasswordReset => 'Password reset',
            self::Created => 'Created',
            self::Updated => 'Updated',
            self::Deleted => 'Deleted',
            self::Activated => 'Activated',
            self::Deactivated => 'Deactivated',
            self::Approved => 'Approved',
            self::MarkedPending => 'Set to pending',
            self::Published => 'Published',
            self::Archived => 'Archived',
            self::DraftSaved => 'Draft saved',
            self::Finalized => 'Finalized',
            self::Reopened => 'Reopened',
            self::Submitted => 'Submitted',
            self::Reviewed => 'Reviewed',
            self::Returned => 'Returned',
            self::Exported => 'Exported',
            self::Downloaded => 'Downloaded',
            self::Synced => 'Synced',
            self::Imported => 'Imported',
            self::Shared => 'Shared',
            self::Commented => 'Commented',
            self::Reacted => 'Reacted',
            self::Unreacted => 'Reaction removed',
            self::PasswordChanged => 'Password changed',
            self::TwoFactorEnabled => 'Two-factor on',
            self::TwoFactorDisabled => 'Two-factor off',
            self::PasskeyAdded => 'Passkey added',
            self::PasskeyRemoved => 'Passkey removed',
        };
    }

    /**
     * The entry's sentence. `:noun` is the kind of thing acted on ("user"),
     * left out when there is none; `:subject` is its name, shown in bold.
     */
    public function sentence(): string
    {
        return match ($this) {
            self::Login => 'Logged in',
            self::Logout => 'Logged out',
            self::LoginFailed => 'Failed to log in',
            self::Registered => 'Registered an account',
            self::PasswordReset => 'Reset their password from an emailed link',
            self::Created => 'Created :noun :subject',
            self::Updated => 'Updated :noun :subject',
            self::Deleted => 'Deleted :noun :subject',
            self::Activated => 'Activated :noun :subject',
            self::Deactivated => 'Deactivated :noun :subject',
            self::Approved => 'Approved :noun :subject',
            self::MarkedPending => 'Set :noun :subject back to pending',
            self::Published => 'Published :noun :subject',
            self::Archived => 'Archived :noun :subject',
            self::DraftSaved => 'Saved a draft of :noun :subject',
            self::Finalized => 'Finalized :noun :subject for signing',
            self::Reopened => 'Reopened :noun :subject for editing',
            self::Submitted => 'Submitted :noun :subject',
            self::Reviewed => 'Marked :noun :subject as reviewed',
            self::Returned => 'Returned :noun :subject for correction',
            self::Exported => 'Exported :subject',
            self::Downloaded => 'Downloaded :noun :subject',
            self::Synced => 'Synced :subject',
            self::Imported => 'Imported :subject',
            self::Shared => 'Shared :noun :subject',
            self::Commented => 'Commented on :noun :subject',
            self::Reacted => 'Reacted to :noun :subject',
            self::Unreacted => 'Took back their reaction to :noun :subject',
            self::PasswordChanged => 'Changed their password',
            self::TwoFactorEnabled => 'Turned on two-factor authentication',
            self::TwoFactorDisabled => 'Turned off two-factor authentication',
            self::PasskeyAdded => 'Added a passkey',
            self::PasskeyRemoved => 'Removed a passkey',
        };
    }

    /**
     * The entry's colour, by what the action did: positive (something began
     * or went through), info (a change), warning (something paused or sent
     * back), danger (removed or refused) or neutral (data read out, a logout).
     */
    public function tone(): string
    {
        return match ($this) {
            self::Login, self::Registered, self::Created, self::Activated, self::Approved,
            self::Published, self::Submitted, self::Reviewed => 'positive',
            self::Deactivated, self::MarkedPending, self::Archived, self::Reopened, self::Returned,
            self::Unreacted, self::TwoFactorDisabled, self::PasskeyRemoved => 'warning',
            self::Deleted, self::LoginFailed => 'danger',
            self::Logout, self::Exported, self::Downloaded => 'neutral',
            default => 'info',
        };
    }
}
