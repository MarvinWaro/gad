<?php

namespace App\Http\Controllers\Settings;

use App\Actions\Certificates\ManageSignatory;
use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\CertificateFilterRequest;
use App\Http\Requests\Settings\SaveCertificateSignatoryRequest;
use App\Http\Resources\CertificateSignatoryResource;
use App\Models\CertificateSignatory;
use App\Models\User;
use App\Support\PageRange;
use App\Support\PlaceFilters;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\UploadedFile;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Settings → Signatories: who signs an office's event certificates, with
 * their e-signatures (docs/certificates.md). The rules live in
 * ManageSignatory.
 */
class CertificateSignatoryController extends Controller
{
    public function index(CertificateFilterRequest $request): Response
    {
        /** @var User $user */
        $user = $request->user();
        $filters = $request->filters();
        $search = $filters['search'] ?? '';
        $region = $user->national_access ? $request->regionId() : null;

        $signatories = PageRange::within(CertificateSignatory::query()
            ->withinReachOf($user)
            ->when($region !== null, fn (Builder $query) => $query->where('survey_region_id', $region))
            ->when($search !== '', fn (Builder $query) => $query->where(fn (Builder $query) => $query
                ->where('name', 'like', '%'.addcslashes($search, '%_\\').'%')
                ->orWhere('position', 'like', '%'.addcslashes($search, '%_\\').'%')))
            ->with('region:id,name')
            ->withCount('designs')
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString());

        return Inertia::render('settings/certificate-signatories', [
            'signatories' => CertificateSignatoryResource::collection($signatories),
            'filters' => $filters,
            'regions' => PlaceFilters::options($user, [])['regions'],
            'nationalAccess' => (bool) $user->national_access,
            'hasOffice' => $user->hasOffice(),
            'permissions' => ['create' => $user->can('create', CertificateSignatory::class)],
        ]);
    }

    public function store(SaveCertificateSignatoryRequest $request, ManageSignatory $manager): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        /** @var UploadedFile $signature The request requires it. */
        $signature = $request->signature();
        $signatory = $manager->create($user, $request->regionId(), $request->signatory(), $signature);

        Inertia::flash('toast', ['type' => 'success', 'message' => __(':name added.', ['name' => $signatory->name])]);

        return $this->backToList('settings.certificate-signatories.index');
    }

    public function update(SaveCertificateSignatoryRequest $request, CertificateSignatory $signatory, ManageSignatory $manager): RedirectResponse
    {
        $manager->update($signatory, $request->regionId(), $request->signatory(), $request->signature());

        Inertia::flash('toast', ['type' => 'success', 'message' => __(':name saved.', ['name' => $signatory->name])]);

        return $this->backToList('settings.certificate-signatories.index');
    }

    public function destroy(CertificateSignatory $signatory, ManageSignatory $manager): RedirectResponse
    {
        $manager->delete($signatory);

        Inertia::flash('toast', ['type' => 'deleted', 'message' => __(':name removed.', ['name' => $signatory->name])]);

        return $this->backToList('settings.certificate-signatories.index');
    }
}
