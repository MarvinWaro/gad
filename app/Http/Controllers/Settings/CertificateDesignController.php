<?php

namespace App\Http\Controllers\Settings;

use App\Actions\Certificates\ManageCertificateDesign;
use App\Actions\Certificates\ManageEventCertificate;
use App\Enums\CertificateKind;
use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\CertificateFilterRequest;
use App\Http\Requests\Settings\SaveCertificateDesignRequest;
use App\Http\Requests\Settings\UseCertificateDesignRequest;
use App\Http\Resources\CertificateDesignResource;
use App\Http\Resources\CertificateSignatoryResource;
use App\Http\Resources\EventCertificateResource;
use App\Models\CertificateDesign;
use App\Models\CertificateSignatory;
use App\Models\GadEvent;
use App\Models\GadEventCertificate;
use App\Models\GadEventCheckIn;
use App\Models\SurveyRegion;
use App\Models\User;
use App\Support\PageRange;
use App\Support\PlaceFilters;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Settings → Certificates: an office's certificate designs, the editor with
 * its live preview, and using a design on an event (docs/certificates.md).
 * The rules live in ManageCertificateDesign and ManageEventCertificate.
 */
class CertificateDesignController extends Controller
{
    /** Events offered by "Use on an event". */
    public const EVENTS = 20;

    public function index(CertificateFilterRequest $request): Response
    {
        /** @var User $user */
        $user = $request->user();
        $filters = $request->filters();
        $search = $filters['search'] ?? '';
        $region = $user->national_access ? $request->regionId() : null;

        $designs = PageRange::within(CertificateDesign::query()
            ->withinReachOf($user)
            ->when($region !== null, fn (Builder $query) => $query->where('survey_region_id', $region))
            ->when($search !== '', fn (Builder $query) => $query->where('name', 'like', '%'.addcslashes($search, '%_\\').'%'))
            ->with(['region:id,name', 'signatories'])
            ->withCount(['uses', 'uses as released_uses_count' => fn (Builder $query) => $query->whereNotNull('released_at')])
            ->latest('updated_at')
            ->latest('id')
            ->paginate(20)
            ->withQueryString());

        return Inertia::render('settings/certificates', [
            'designs' => CertificateDesignResource::collection($designs),
            'filters' => $filters,
            'regions' => PlaceFilters::options($user, [])['regions'],
            'nationalAccess' => (bool) $user->national_access,
            'hasOffice' => $user->hasOffice(),
            'permissions' => ['create' => $user->can('create', CertificateDesign::class)],
        ]);
    }

    public function create(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();

        return Inertia::render('settings/certificate', [
            'design' => null,
            'uses' => [],
            ...$this->editor($user),
        ]);
    }

    public function store(SaveCertificateDesignRequest $request, ManageCertificateDesign $manager): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $design = $manager->create($user, $request->regionId(), $request->design(), $request->signatoryIds(), $request->newLogos());

        Inertia::flash('toast', ['type' => 'success', 'message' => __(':name created. Use it on an event when it is ready.', ['name' => $design->name])]);

        return to_route('settings.certificates.show', $design);
    }

    /** The editor, with the events the design is used on. */
    public function show(Request $request, CertificateDesign $design): Response
    {
        /** @var User $user */
        $user = $request->user();
        $design->load(['region:id,name', 'signatories'])->loadCount('uses');
        $uses = $design->uses()
            ->with(['event.region:id,name', 'releaser:id,name'])
            ->withCount('certificates')
            ->addSelect(['eligible_count' => GadEventCheckIn::query()
                ->selectRaw('count(distinct user_id)')
                ->whereColumn('gad_event_check_ins.gad_event_id', 'gad_event_certificates.gad_event_id')])
            ->latest()
            ->get()
            ->each(fn (GadEventCertificate $use) => $use->setRelation('design', $design));

        return Inertia::render('settings/certificate', [
            'design' => CertificateDesignResource::make($design)->resolve($request),
            'uses' => EventCertificateResource::collection($uses)->resolve($request),
            ...$this->editor($user),
        ]);
    }

    public function update(SaveCertificateDesignRequest $request, CertificateDesign $design, ManageCertificateDesign $manager): RedirectResponse
    {
        $manager->update($design, $request->regionId(), $request->design(), $request->signatoryIds(), $request->keptLogos(), $request->newLogos());

        Inertia::flash('toast', ['type' => 'success', 'message' => __(':name saved.', ['name' => $design->name])]);

        return back();
    }

    public function duplicate(Request $request, CertificateDesign $design, ManageCertificateDesign $manager): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $copy = $manager->duplicate($user, $design);

        Inertia::flash('toast', ['type' => 'success', 'message' => __(':name created.', ['name' => $copy->name])]);

        return to_route('settings.certificates.show', $copy);
    }

    public function destroy(CertificateDesign $design, ManageCertificateDesign $manager): RedirectResponse
    {
        $manager->delete($design);

        Inertia::flash('toast', ['type' => 'deleted', 'message' => __(':name deleted.', ['name' => $design->name])]);

        return $this->backToList('settings.certificates.index');
    }

    /**
     * Events the design can be used on, by title: its office's, not a
     * deadline, and not already giving a certificate of its kind. Newest
     * first.
     */
    public function events(Request $request, CertificateDesign $design): JsonResponse
    {
        $search = trim((string) $request->query('q', ''));

        $events = GadEvent::query()
            ->where('category', '!=', 'deadline')
            ->when(
                $design->survey_region_id === null,
                fn (Builder $query) => $query->whereNull('survey_region_id'),
                fn (Builder $query) => $query->where('survey_region_id', $design->survey_region_id),
            )
            ->whereDoesntHave('certificates', fn (Builder $query) => $query->whereHas(
                'design',
                fn (Builder $query) => $query->where('kind', $design->kind),
            ))
            ->when($search !== '', fn (Builder $query) => $query->where('title', 'like', '%'.addcslashes($search, '%_\\').'%'))
            ->orderByDesc('starts_at')
            ->limit(self::EVENTS)
            ->get();

        return response()->json($events->map(fn (GadEvent $event): array => $event->toCalendarArray())->values());
    }

    public function use(UseCertificateDesignRequest $request, CertificateDesign $design, ManageEventCertificate $certificates): RedirectResponse
    {
        $event = $request->event();
        $use = $certificates->attach($design, $event);

        Inertia::flash('toast', ['type' => 'success', 'message' => __(':kind for :event is ready to release.', ['kind' => $design->kind->title(), 'event' => $event->title])]);

        return to_route('settings.event-certificates.show', $use);
    }

    /**
     * What the editor offers: the kinds and their words, the backgrounds and
     * blanks, the signatories the account may choose from, and each
     * office's letterhead for the preview.
     *
     * @return array<string, mixed>
     */
    private function editor(User $user): array
    {
        $offices = SurveyRegion::query()->withinReachOf($user)->orderBy('name')->get(['id', 'name', 'office_city']);

        return [
            'kinds' => array_map(fn (CertificateKind $kind): array => [
                'value' => $kind->value,
                'title' => $kind->title(),
                'lead' => $kind->lead(),
                'body' => $kind->defaultBody(),
            ], CertificateKind::cases()),
            'backgrounds' => CertificateDesign::BACKGROUNDS,
            'blanks' => CertificateDesign::BLANKS,
            'signatories' => CertificateSignatoryResource::collection(CertificateSignatory::query()
                ->withinReachOf($user)
                ->with('region:id,name')
                ->orderBy('name')
                ->get())->resolve(),
            'offices' => $offices->map(fn (SurveyRegion $region): array => [
                'id' => $region->id,
                'name' => $region->name,
                'city' => $region->office_city,
            ])->values(),
            'nationalAccess' => (bool) $user->national_access,
            'ownRegion' => $user->national_access ? null : $user->survey_region_id,
        ];
    }
}
