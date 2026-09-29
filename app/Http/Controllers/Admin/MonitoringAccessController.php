<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Monitoring\MonitoringAccessRequest;
use App\Models\SurveyRegion;
use App\Models\User;
use App\Support\MonitoringAccess;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class MonitoringAccessController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->validate(['search' => ['nullable', 'string', 'max:150']])['search'] ?? '';
        $users = User::query()->whereHas('roles.permissions', fn ($q) => $q->where('slug', 'monitoring.view'))
            ->when($search !== '', fn ($q) => $q->where(fn ($q) => $q->where('name', 'like', '%'.$search.'%')->orWhere('email', 'like', '%'.$search.'%')))
            ->orderBy('name')->paginate(15)->withQueryString();
        MonitoringAccess::prime($users->items());
        $users->through(fn (User $user) => [
            'id' => $user->id, 'name' => $user->name, 'email' => $user->email,
            'national_access' => MonitoringAccess::national($user), 'regions' => MonitoringAccess::regions($user),
        ]);

        return Inertia::render('monitoring/access', ['users' => $users, 'regions' => SurveyRegion::query()->orderBy('name')->get(['id', 'name']), 'search' => $search]);
    }

    public function update(MonitoringAccessRequest $request, User $user): RedirectResponse
    {
        abort_unless($user->hasPermissionTo('monitoring.view'), 422, 'Assign a role with monitoring access first.');
        $data = $request->validated();
        DB::transaction(function () use ($user, $data) {
            User::query()->whereKey($user->id)->lockForUpdate()->firstOrFail();
            DB::table('monitoring_reviewer_access')->updateOrInsert(['user_id' => $user->id], ['national_access' => $data['national_access'], 'updated_at' => now(), 'created_at' => now()]);
            DB::table('monitoring_reviewer_regions')->where('user_id', $user->id)->delete();
            foreach ($data['regions'] as $region) {
                DB::table('monitoring_reviewer_regions')->insert(['user_id' => $user->id, 'survey_region_id' => $region]);
            }
        });

        return back();
    }
}
