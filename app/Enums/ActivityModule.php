<?php

namespace App\Enums;

/**
 * The part of PHLGADIS an activity log entry belongs to. The codes are stored
 * and sent to the browser and the API as they are; never reuse one.
 */
enum ActivityModule: string
{
    case Authentication = 'authentication';
    case Account = 'account';
    case Users = 'users';
    case Roles = 'roles';
    case AcademicYears = 'academic-years';
    case Regions = 'regions';
    case Clusters = 'clusters';
    case Heis = 'heis';
    case RespondentGroups = 'respondent-groups';
    case Surveys = 'surveys';
    case SurveyResponses = 'survey-responses';
    case Events = 'events';
    case Carousel = 'carousel';
    case Community = 'community';
    case Monitoring = 'monitoring';
    case GadSurveys = 'gad-surveys';
    case SiteRatings = 'site-ratings';
    case SiteFeedback = 'site-feedback';
    case StudentCounts = 'student-counts';
    case Quests = 'quests';
    case Badges = 'badges';
    case People = 'people';

    public function label(): string
    {
        return match ($this) {
            self::Authentication => 'Authentication',
            self::Account => 'My account',
            self::Users => 'Users',
            self::Roles => 'Roles & permissions',
            self::AcademicYears => 'Academic years',
            self::Regions => 'Regions',
            self::Clusters => 'Clusters',
            self::Heis => 'HEIs',
            self::RespondentGroups => 'Respondent groups',
            self::Surveys => 'Surveys',
            self::SurveyResponses => 'Survey responses',
            self::Events => 'GAD events',
            self::Carousel => 'Carousel',
            self::Community => 'Gender Mainstreaming',
            self::Monitoring => 'Monitoring reports',
            self::GadSurveys => 'GAD Training & Compliance Surveys',
            self::SiteRatings => 'Site ratings',
            self::SiteFeedback => 'Website feedback',
            self::StudentCounts => 'Enrollment and graduates',
            self::Quests => 'GAD Quest',
            self::Badges => 'Badges',
            self::People => 'People',
        };
    }
}
