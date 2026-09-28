<?php

namespace App\Enums;

/**
 * The thrusts and enablers of CHED's A.C.H.I.E.V.E. Agenda, in the order the
 * acronym spells them. A post can say which items its activity supports.
 * The codes are stable identifiers; the titles live in
 * resources/js/data/achieve.ts, so keep the two in step.
 */
enum AchieveItem: string
{
    /** A: Advanced and Accessible Lifelong Learning (thrust). */
    case LifelongLearning = 'lifelong-learning';

    /** C: Centralized One-Nation Human Capital Development (thrust). */
    case HumanCapital = 'human-capital';

    /** H: Harmonized SDG-Based Research, Development, and Innovation (thrust). */
    case ResearchInnovation = 'research-innovation';

    /** I: Inclusive and Impact-driven Internationalization (thrust). */
    case Internationalization = 'internationalization';

    /** E: Expanded and Integrated Real-Time Data Collection and Analytics (enabler). */
    case DataAnalytics = 'data-analytics';

    /** V: Vitalized Policies, Internal Systems, and Governance (enabler). */
    case Governance = 'governance';

    /** E: Effective and Efficient Public Service (enabler). */
    case PublicService = 'public-service';

    /** Where the item sits in the acronym, from 0 (A) to 6 (the last E). */
    public function position(): int
    {
        return (int) array_search($this, self::cases(), true);
    }
}
