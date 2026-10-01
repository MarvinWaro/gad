<?php

namespace App\Http\Controllers\Settings;

use App\Enums\ActivityAction;
use App\Enums\ActivityModule;
use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\UpdateRegionOfficeRequest;
use App\Models\SurveyRegion;
use App\Services\ActivityRecorder;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;

/**
 * A regional office's letterhead: the details printed on its documents, such
 * as monitoring reports. Kept apart from the directory's name and status.
 */
class RegionOfficeController extends Controller
{
    public function update(UpdateRegionOfficeRequest $request, SurveyRegion $region, ActivityRecorder $activity): RedirectResponse
    {
        $region->update($request->validated());
        $changes = $activity->changesOf($region);
        if ($changes !== []) {
            $activity->record(ActivityAction::Updated, ActivityModule::Regions, $region, $changes);
        }

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __(':name office details saved.', ['name' => $region->name]),
        ]);

        return back();
    }
}
