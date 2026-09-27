<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;

abstract class Controller
{
    /**
     * Turn down an action the user asked for and say why, as a red toast on
     * the page they came from.
     */
    protected function refuse(string $message): RedirectResponse
    {
        Inertia::flash('toast', ['type' => 'error', 'message' => $message]);

        return back();
    }
}
