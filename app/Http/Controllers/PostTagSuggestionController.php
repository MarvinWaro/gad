<?php

namespace App\Http\Controllers;

use App\Enums\UserStatus;
use App\Models\User;
use App\Support\InstitutionName;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * People a post author can tag: active accounts only, found by name or by
 * school. The author's own school comes first, since that is who they
 * usually run activities with.
 */
class PostTagSuggestionController extends Controller
{
    public const LIMIT = 20;

    public function __invoke(Request $request): JsonResponse
    {
        /** @var User $viewer */
        $viewer = $request->user();
        $search = trim((string) $request->query('q', ''));
        // Typed % and _ are literal characters, not wildcards.
        $like = '%'.addcslashes($search, '%_\\').'%';

        $users = User::query()
            ->select(['id', 'name', 'survey_hei_id', 'avatar_path'])
            ->with('hei:id,name')
            ->where('status', UserStatus::Active)
            ->whereKeyNot($viewer->id)
            ->when($search !== '', fn (Builder $query) => $query->where(
                fn (Builder $match) => $match
                    ->where('name', 'like', $like)
                    ->orWhereHas('hei', fn (Builder $hei) => $hei->where('name', 'like', $like)),
            ))
            ->when($viewer->survey_hei_id !== null, fn (Builder $query) => $query->orderByRaw(
                'case when survey_hei_id = ? then 0 else 1 end',
                [$viewer->survey_hei_id],
            ))
            ->orderBy('name')
            ->limit(self::LIMIT)
            ->get();

        return response()->json($users->map(fn (User $user): array => [
            'id' => $user->id,
            'name' => $user->name,
            'avatar' => $user->avatar,
            'hei' => $user->hei ? InstitutionName::display($user->hei->name) : null,
        ])->values());
    }
}
