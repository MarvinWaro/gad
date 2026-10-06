<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Support\EventCalendar;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/** The full-page GAD event calendar for signed-in users. */
class EventController extends Controller
{
    public function index(Request $request): Response
    {
        $month = $request->string('month')->toString() ?: null;
        /** @var User $user */
        $user = $request->user();

        return Inertia::render('hei/events', [
            'calendar' => fn (): array => EventCalendar::month($user, $month),
            'after' => fn (): array => EventCalendar::after($user, $month),
        ]);
    }
}
