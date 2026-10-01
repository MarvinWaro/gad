<?php

namespace App\Enums;

/**
 * What a notification tells someone. The codes are stored and sent to the
 * browser and the API as they are; never reuse one for a different kind.
 * App\Services\Notifier decides who is told about each.
 */
enum NotificationKind: string
{
    case PostCommented = 'post_commented';
    case CommentReplied = 'comment_replied';
    case PostReacted = 'post_reacted';
    case PostShared = 'post_shared';
    case PostTagged = 'post_tagged';
    case PostRemoved = 'post_removed';
    case CommentRemoved = 'comment_removed';
    case ReportSubmitted = 'report_submitted';
    case ReportReviewed = 'report_reviewed';
    case ReportReturned = 'report_returned';
    case GadSurveySubmitted = 'gad_survey_submitted';
    case AccountPending = 'account_pending';
    case AccountApproved = 'account_approved';
    case EventCreated = 'event_created';
    case SurveyResponses = 'survey_responses';

    /** Its name in the Type filter. */
    public function label(): string
    {
        return match ($this) {
            self::PostCommented => 'Comments on your posts',
            self::CommentReplied => 'Replies to your comments',
            self::PostReacted => 'Reactions to your posts',
            self::PostShared => 'Shares of your posts',
            self::PostTagged => 'Tags in posts',
            self::PostRemoved => 'Posts removed by a moderator',
            self::CommentRemoved => 'Comments removed by a moderator',
            self::ReportSubmitted => 'Monitoring reports submitted',
            self::ReportReviewed => 'Monitoring reports reviewed',
            self::ReportReturned => 'Monitoring reports returned',
            self::GadSurveySubmitted => 'GAD surveys submitted',
            self::AccountPending => 'Accounts awaiting approval',
            self::AccountApproved => 'Account approved',
            self::EventCreated => 'New GAD events',
            self::SurveyResponses => 'New survey responses',
        };
    }

    public function module(): ActivityModule
    {
        return match ($this) {
            self::PostCommented, self::CommentReplied, self::PostReacted, self::PostShared,
            self::PostTagged, self::PostRemoved, self::CommentRemoved => ActivityModule::Community,
            self::ReportSubmitted, self::ReportReviewed, self::ReportReturned => ActivityModule::Monitoring,
            self::GadSurveySubmitted => ActivityModule::GadSurveys,
            self::AccountPending, self::AccountApproved => ActivityModule::Users,
            self::EventCreated => ActivityModule::Events,
            self::SurveyResponses => ActivityModule::SurveyResponses,
        };
    }

    /** The badge's colour, as activity log entries are coloured. */
    public function tone(): string
    {
        return match ($this) {
            self::ReportSubmitted, self::ReportReviewed, self::GadSurveySubmitted,
            self::AccountApproved => 'positive',
            self::ReportReturned, self::AccountPending => 'warning',
            self::PostRemoved, self::CommentRemoved => 'danger',
            default => 'info',
        };
    }

    /**
     * What it says after the name of whoever acted. `:subject` is the
     * record's name, shown in bold; `:place` is the institution where it
     * happened; `:count` is how many, for notices that group.
     */
    public function sentence(?ActivityAction $action = null, int $count = 1): string
    {
        return match ($this) {
            self::PostCommented => 'commented on your post :subject',
            self::CommentReplied => 'replied to your comment on :subject',
            self::PostReacted => 'reacted to your post :subject',
            self::PostShared => 'shared your post :subject',
            self::PostTagged => 'tagged you in a post :subject',
            self::PostRemoved => 'removed your post :subject',
            self::CommentRemoved => 'removed your comment :subject',
            self::ReportSubmitted => 'submitted the monitoring report of :subject',
            self::ReportReviewed => 'marked the monitoring report of :subject as reviewed',
            self::ReportReturned => 'returned the monitoring report of :subject for correction',
            self::GadSurveySubmitted => ($action === ActivityAction::Updated ? 'updated' : 'submitted').' the :subject for :place',
            self::AccountPending => 'registered from :place and is waiting for approval',
            self::AccountApproved => 'approved your account',
            self::EventCreated => 'added a GAD event: :subject',
            self::SurveyResponses => $count === 1 ? '1 new response to :subject' : ':count new responses to :subject',
        };
    }

    /**
     * Notices that count up while unread instead of arriving one by one,
     * for things that can come by the hundreds.
     */
    public function groups(): bool
    {
        return $this === self::SurveyResponses;
    }

    /** @return list<self> */
    public static function inModule(ActivityModule $module): array
    {
        return array_values(array_filter(self::cases(), fn (self $kind): bool => $kind->module() === $module));
    }
}
