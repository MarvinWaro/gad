<?php

namespace App\Http\Controllers;

use App\Enums\ActivityModule;
use App\Models\SiteRating;
use App\Models\SiteSetting;
use App\Services\LiveUpdates;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class SiteRatingController extends Controller
{
    /**
     * Saves a visitor's "Rate PHLGADIS" answer. Only the stars, the optional
     * suggestion and the time are kept: no name, email, IP address or
     * browser details, as the rating card promises.
     */
    public function store(Request $request, LiveUpdates $live): RedirectResponse
    {
        abort_unless(SiteSetting::ratingButtonEnabled(), 404);

        $validated = $request->validate([
            'rating' => ['required', 'integer', 'between:1,5'],
            'suggestion' => ['nullable', 'string', 'max:1000'],
            // Hidden from people; a bot that fills it is thanked but ignored.
            'website' => ['nullable', 'string', 'max:255'],
        ]);

        if (blank($validated['website'] ?? null)) {
            SiteRating::query()->create([
                'rating' => $validated['rating'],
                'suggestion' => filled($validated['suggestion'] ?? null)
                    ? trim($validated['suggestion'])
                    : null,
            ]);
            // Anonymous, so never logged: its page is told here.
            $live->touched(ActivityModule::SiteRatings, null);
        }

        return back();
    }
}
