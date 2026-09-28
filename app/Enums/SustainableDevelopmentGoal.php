<?php

namespace App\Enums;

/**
 * The UN's 17 Sustainable Development Goals, by their official number. A
 * post can say which goals its activity supports. The names and icons live
 * in resources/js/data/sdgs.ts; keep the two in step.
 */
enum SustainableDevelopmentGoal: int
{
    case NoPoverty = 1;
    case ZeroHunger = 2;
    case GoodHealthAndWellBeing = 3;
    case QualityEducation = 4;
    case GenderEquality = 5;
    case CleanWaterAndSanitation = 6;
    case AffordableAndCleanEnergy = 7;
    case DecentWorkAndEconomicGrowth = 8;
    case IndustryInnovationAndInfrastructure = 9;
    case ReducedInequalities = 10;
    case SustainableCitiesAndCommunities = 11;
    case ResponsibleConsumptionAndProduction = 12;
    case ClimateAction = 13;
    case LifeBelowWater = 14;
    case LifeOnLand = 15;
    case PeaceJusticeAndStrongInstitutions = 16;
    case PartnershipsForTheGoals = 17;
}
