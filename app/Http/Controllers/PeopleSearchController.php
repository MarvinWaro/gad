<?php

namespace App\Http\Controllers;

use App\Http\Requests\PeopleSearchRequest;
use App\Http\Resources\PersonResource;
use App\Models\User;
use App\Support\PeopleSearch;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Finding people by name or institution (App\Support\PeopleSearch): the
 * header's suggestions as the reader types, and the full results page.
 */
class PeopleSearchController extends Controller
{
    /** Suggestions under the header's field. */
    public const SUGGESTIONS = 8;

    /** People per page of results. */
    public const PER_PAGE = 20;

    public function index(PeopleSearchRequest $request): Response
    {
        /** @var User $viewer */
        $viewer = $request->user();
        $search = $request->search();

        return Inertia::render('search/index', [
            'query' => trim($request->string('q')->toString()),
            'people' => Inertia::scroll(fn () => PersonResource::collection(
                PeopleSearch::query($viewer, $search)->simplePaginate(self::PER_PAGE),
            )),
        ]);
    }

    public function suggestions(PeopleSearchRequest $request): JsonResponse
    {
        /** @var User $viewer */
        $viewer = $request->user();

        return PersonResource::collection(
            PeopleSearch::query($viewer, $request->search())->limit(self::SUGGESTIONS)->get(),
        )->response();
    }
}
