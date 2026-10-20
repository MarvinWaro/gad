<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/**
 * The HEI home's guided tour was finished or closed: it no longer starts by
 * itself, and stays a click away in the account menu and the help links.
 */
class TourSeenController extends Controller
{
    public function __invoke(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();
        $user->markTourSeen();

        return response()->noContent();
    }
}
