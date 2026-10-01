<?php

namespace App\Http\Controllers\Settings;

use App\Enums\ActivityAction;
use App\Enums\ActivityModule;
use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\UpdateRegionRegistrationRequest;
use App\Models\GadEvent;
use App\Models\SurveyRegion;
use App\Services\ActivityRecorder;
use App\Support\ActivityPlace;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;

/**
 * Whether a region's new HEI accounts wait for approval, or sign in straight
 * away while the region registers people on the spot.
 */
class RegionRegistrationController extends Controller
{
    public function update(UpdateRegionRegistrationRequest $request, SurveyRegion $region, ActivityRecorder $activity): RedirectResponse
    {
        $region->update($request->settings());
        $until = $region->instant_registration_until?->setTimezone(GadEvent::TIMEZONE);
        $activity->record(
            $region->instant_registration ? ActivityAction::Activated : ActivityAction::Deactivated,
            ActivityModule::Users,
            changes: $activity->changesOf($region),
            label: __('instant registration in :name', ['name' => $region->name]),
            place: new ActivityPlace($region->id),
        );

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => match (true) {
                ! $region->instant_registration => __(':name: new accounts need approval again.', ['name' => $region->name]),
                $until !== null => __(':name: new accounts need no approval until :time.', [
                    'name' => $region->name,
                    'time' => $until->format('M j, g:i A'),
                ]),
                default => __(':name: new accounts need no approval until you switch it off.', ['name' => $region->name]),
            },
        ]);

        return back();
    }
}
