<?php

namespace App\Support;

use App\Models\AcademicYear;
use App\Models\Badge;
use App\Models\CarouselSlide;
use App\Models\ChecklistResponse;
use App\Models\GadEvent;
use App\Models\MonitoringReport;
use App\Models\Post;
use App\Models\PostComment;
use App\Models\Quest;
use App\Models\Role;
use App\Models\SiteFeedback;
use App\Models\SiteRating;
use App\Models\Survey;
use App\Models\SurveyCluster;
use App\Models\SurveyHei;
use App\Models\SurveyRegion;
use App\Models\SurveyRespondentGroup;
use App\Models\SurveyResponse;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

/**
 * The records activity logs point at: their stored type codes, and how each
 * is named, placed and opened. The one place to extend when a new kind of
 * record is logged.
 */
class ActivitySubjects
{
    /**
     * Stored as `activity_logs.subject_type`; stable codes, never class names.
     *
     * @var array<string, class-string<Model>>
     */
    public const TYPES = [
        'user' => User::class,
        'role' => Role::class,
        'academic-year' => AcademicYear::class,
        'region' => SurveyRegion::class,
        'cluster' => SurveyCluster::class,
        'hei' => SurveyHei::class,
        'respondent-group' => SurveyRespondentGroup::class,
        'survey' => Survey::class,
        'survey-response' => SurveyResponse::class,
        'event' => GadEvent::class,
        'carousel-slide' => CarouselSlide::class,
        'post' => Post::class,
        'comment' => PostComment::class,
        'monitoring-report' => MonitoringReport::class,
        'gad-survey-answer' => ChecklistResponse::class,
        'site-rating' => SiteRating::class,
        'site-feedback' => SiteFeedback::class,
        'quest' => Quest::class,
        'badge' => Badge::class,
    ];

    /** The kind of record, as the entry's sentence names it. */
    public static function noun(?string $type): string
    {
        return match ($type) {
            'academic-year' => 'academic year',
            'hei' => 'HEI',
            'respondent-group' => 'respondent group',
            'survey-response' => 'survey response',
            'carousel-slide' => 'carousel slide',
            'post' => 'a post',
            'comment' => 'a comment',
            'monitoring-report' => 'the monitoring report of',
            'gad-survey-answer' => 'the',
            'site-rating' => 'a',
            'site-feedback' => 'website feedback',
            null => '',
            default => $type,
        };
    }

    /** The record's name when the entry is written. */
    public static function label(Model $subject): string
    {
        return match (true) {
            $subject instanceof User, $subject instanceof Role, $subject instanceof Badge,
            $subject instanceof SurveyRegion, $subject instanceof SurveyCluster => (string) $subject->getAttribute('name'),
            $subject instanceof SurveyHei => InstitutionName::display($subject->name),
            $subject instanceof AcademicYear => $subject->label,
            $subject instanceof SurveyRespondentGroup => (string) $subject->getAttribute('label'),
            $subject instanceof Survey, $subject instanceof GadEvent,
            $subject instanceof CarouselSlide, $subject instanceof Quest => (string) $subject->getAttribute('title'),
            $subject instanceof SurveyResponse => (string) ($subject->getAttribute('public_reference') ?? $subject->getKey()),
            $subject instanceof Post, $subject instanceof PostComment => self::excerpt($subject->getAttribute('body')),
            $subject instanceof MonitoringReport => sprintf(
                '%s, AY %s %s',
                InstitutionName::display($subject->institution_name),
                $subject->academic_year,
                $subject->semester === 1 ? 'First Semester' : 'Second Semester',
            ),
            $subject instanceof ChecklistResponse => sprintf('%s, AY %s', $subject->type->label(), $subject->academic_year),
            $subject instanceof SiteRating => sprintf('%d-star rating', (int) $subject->getAttribute('rating')),
            $subject instanceof SiteFeedback => self::excerpt($subject->feedback),
            default => (string) $subject->getKey(),
        };
    }

    /** Where the record belongs, or null when it belongs to no one place. */
    public static function place(Model $subject): ?ActivityPlace
    {
        return match (true) {
            $subject instanceof User => $subject->survey_hei_id !== null
                ? ActivityPlace::ofHei($subject->survey_hei_id)
                : ($subject->survey_region_id !== null ? new ActivityPlace($subject->survey_region_id) : null),
            $subject instanceof SurveyRegion => new ActivityPlace((int) $subject->getKey()),
            $subject instanceof SurveyCluster => new ActivityPlace((int) $subject->getAttribute('survey_region_id'), (int) $subject->getKey()),
            $subject instanceof SurveyHei => ActivityPlace::ofHei((int) $subject->getKey()),
            // A quest or badge for every region belongs to no one place.
            $subject instanceof Quest, $subject instanceof Badge => $subject->survey_region_id !== null ? new ActivityPlace($subject->survey_region_id) : null,
            $subject instanceof Post => ActivityPlace::ofHei($subject->getAttribute('survey_hei_id')),
            $subject instanceof PostComment => $subject->post !== null ? self::place($subject->post) : null,
            $subject instanceof MonitoringReport, $subject instanceof ChecklistResponse,
            $subject instanceof SurveyResponse, $subject instanceof SiteFeedback => new ActivityPlace(
                $subject->getAttribute('survey_region_id'),
                $subject->getAttribute('survey_cluster_id'),
                $subject->getAttribute('survey_hei_id'),
            ),
            default => null,
        };
    }

    /**
     * The page that shows the record, for the entry's "View" link, or null
     * when the viewer may not open one (an HEI account never gets a link to
     * an admin page).
     */
    public static function url(Model $subject, User $viewer): ?string
    {
        return match (true) {
            $subject instanceof User && $subject->is($viewer) => route('profile.edit'),
            $subject instanceof User => $viewer->can('users.view') ? route('settings.users.index', ['search' => $subject->email]) : null,
            $subject instanceof Role => $viewer->can('roles.view') ? route('settings.roles.index') : null,
            $subject instanceof AcademicYear => $viewer->can('academic-years.view') ? route('settings.academic-years.index') : null,
            ! $viewer->can('survey-directories.view') && ($subject instanceof SurveyRegion || $subject instanceof SurveyCluster
                || $subject instanceof SurveyHei || $subject instanceof SurveyRespondentGroup) => null,
            $subject instanceof SurveyRegion => route('settings.regions.index'),
            // Clusters are kept out of sight, so there is no page to open.
            $subject instanceof SurveyCluster => null,
            $subject instanceof SurveyHei => route('settings.heis.index', ['search' => $subject->name]),
            $subject instanceof SurveyRespondentGroup => route('settings.respondent-groups.index'),
            $subject instanceof Survey => $viewer->can('surveys.view') ? route('admin.surveys.edit', $subject) : null,
            $subject instanceof GadEvent => route($viewer->can('events.view') ? 'admin.events.index' : 'events.index'),
            $subject instanceof CarouselSlide => $viewer->can('carousel.view') ? route('admin.carousels.index') : null,
            $subject instanceof Post => route('posts.show', $subject),
            $subject instanceof PostComment => route('posts.show', $subject->getAttribute('post_id')),
            $subject instanceof MonitoringReport => $viewer->can('view', $subject) ? route('monitoring.show', $subject) : null,
            $subject instanceof ChecklistResponse => match (true) {
                $viewer->can('monitoring.view') => route('admin.checklists.index', $subject->type->value),
                $viewer->survey_hei_id === $subject->survey_hei_id && $viewer->can('monitoring.submit') => route('checklists.show', $subject->type->value),
                default => null,
            },
            $subject instanceof SiteRating => $viewer->can('site-ratings.view') ? route('settings.ratings.index') : null,
            $subject instanceof SiteFeedback => $viewer->can('feedback.view') ? route('admin.feedback.index') : null,
            // Whoever holds it sees it on their profile.
            $subject instanceof Badge => $viewer->can('badges.view') ? route('settings.badges.show', $subject) : route('my-profile'),
            $subject instanceof Quest => match (true) {
                $viewer->can('results', $subject) => route('quests.manage.show', $subject),
                $viewer->can('play', $subject) => route('quests.show', $subject),
                default => null,
            },
            default => null,
        };
    }

    /** A post, comment or feedback by its opening words, quoted. */
    private static function excerpt(?string $body): string
    {
        $text = Str::squish((string) $body);

        return $text === '' ? 'without text' : '“'.Str::limit($text, 60).'”';
    }
}
