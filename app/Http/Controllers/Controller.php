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

    /**
     * Back to the list a change was made from, as it was: its filters,
     * search, tab and page. A change made elsewhere, such as on the record's
     * own page, lands on the list itself. Only the query comes from the
     * browser; the address is the route's. A change made on a record's page
     * that still exists uses back().
     *
     * @param  mixed  $parameters  The list route's own parameters; no query.
     */
    protected function backToList(string $route, mixed $parameters = []): RedirectResponse
    {
        $list = route($route, $parameters);
        $from = parse_url((string) request()->headers->get('referer')) ?: [];
        $query = $from['query'] ?? '';
        $sameList = rtrim($from['path'] ?? '', '/') === rtrim((string) parse_url($list, PHP_URL_PATH), '/');

        return redirect()->to($sameList && $query !== '' ? "{$list}?{$query}" : $list);
    }
}
