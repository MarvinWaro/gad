<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Events\ManageEventRegistration;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AddEventPersonRequest;
use App\Http\Requests\Admin\EventAttendanceRequest;
use App\Http\Requests\Admin\EventRegistrationStatusRequest;
use App\Http\Requests\ListFilterRequest;
use App\Http\Requests\PeopleSearchRequest;
use App\Http\Resources\EventCertificateResource;
use App\Http\Resources\EventGuestResource;
use App\Http\Resources\EventRegistrationResource;
use App\Http\Resources\GadEventResource;
use App\Http\Resources\PersonResource;
use App\Models\GadEvent;
use App\Models\GadEventCertificate;
use App\Models\GadEventCheckIn;
use App\Models\GadEventRegistration;
use App\Models\User;
use App\Support\EventAttendance;
use App\Support\PageRange;
use App\Support\PeopleSearch;
use App\Support\PlaceFilters;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Who joined a GAD event, for its staff (docs/event-registration.md):
 * the list, its guests, closing or reopening registration, and keeping the
 * list by hand: adding someone, marking the days they came, taking someone
 * off. The rules live in ManageEventRegistration.
 */
class EventRegistrationController extends Controller
{
    /** People on the list per page. */
    private const PER_PAGE = 20;

    public function index(ListFilterRequest $request, GadEvent $event): Response
    {
        /** @var User $user */
        $user = $request->user();
        $filters = $request->filters();
        $search = $filters['search'] ?? '';
        $event->load('region:id,name')->loadCount('registrations');

        // The whole list, for everyone who may open it (GadEventPolicy::
        // viewRegistrations): a region's event is its own office's, and an
        // event for every region shows everyone who joined, from every
        // region, so offices see who else is going (decided 2026-10-14).
        $base = GadEventRegistration::query()->whereBelongsTo($event, 'event');
        $attended = fn (Builder $query) => $query->whereExists(GadEventCheckIn::query()
            ->selectRaw('1')
            ->whereColumn('gad_event_check_ins.gad_event_id', 'gad_event_registrations.gad_event_id')
            ->whereColumn('gad_event_check_ins.user_id', 'gad_event_registrations.user_id'));

        $people = (clone $base)
            ->when($search !== '', fn (Builder $query) => $query->whereHas('user', fn (Builder $query) => $query
                ->where('name', 'like', '%'.addcslashes($search, '%_\\').'%')));
        PlaceFilters::apply($people, $filters);

        $page = PageRange::within($people
            ->with(EventRegistrationResource::RELATIONS)
            ->addSelect(['days_attended' => GadEventCheckIn::query()
                ->selectRaw('count(*)')
                ->whereColumn('gad_event_check_ins.gad_event_id', 'gad_event_registrations.gad_event_id')
                ->whereColumn('gad_event_check_ins.user_id', 'gad_event_registrations.user_id')])
            ->latest('joined_at')
            ->latest('id')
            ->paginate(self::PER_PAGE)
            ->withQueryString());
        $this->withDays($event, $page->getCollection());

        $guests = $event->guests()
            ->with(['days', 'certificates:id,gad_event_guest_id,gad_event_certificate_id'])
            ->orderBy('name')
            ->paginate(self::PER_PAGE, pageName: 'guests_page')
            ->withQueryString();

        return Inertia::render('admin/events/registrations', [
            'event' => GadEventResource::make($event)->resolve($request),
            'counts' => [
                'joined' => (clone $base)->count(),
                'checked_in' => $attended(clone $base)->count(),
                'guests' => $guests->total(),
            ],
            'registrations' => EventRegistrationResource::collection($page),
            'guests' => EventGuestResource::collection($guests),
            // The days staff may mark: the event's own, up to today.
            'days' => EventAttendance::markableDays($event),
            // The event's certificates, for the staff who release them.
            'certificates' => EventCertificateResource::collection($event->certificates()
                ->with(['design', 'releaser:id,name'])
                ->withCount('certificates')
                ->get()
                ->each(fn (GadEventCertificate $use) => $use->setRelation('event', $event))
                ->filter(fn (GadEventCertificate $use): bool => $user->can('release', $use))
                ->values())->resolve($request),
            'can' => [
                'update' => $user->can('update', $event),
            ],
            'filters' => $filters,
            // At an event for every region, any region can be picked.
            ...PlaceFilters::options($user, $filters, everyRegion: $event->survey_region_id === null),
        ]);
    }

    public function update(EventRegistrationStatusRequest $request, GadEvent $event, ManageEventRegistration $registrations): RedirectResponse
    {
        $open = $request->boolean('open');
        $registrations->setOpen($event, $open);

        Inertia::flash('toast', ['type' => 'success', 'message' => $open
            ? __('Registration for :event is open until the event ends.', ['event' => $event->title])
            : __('Registration for :event is closed.', ['event' => $event->title])]);

        return back();
    }

    /**
     * People to add, for the Add people search: active accounts in any
     * region (PeopleSearch's order), but not those already on the list.
     */
    public function people(PeopleSearchRequest $request, GadEvent $event): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        return PersonResource::collection(PeopleSearch::query($user, $request->search())
            ->whereNotIn('users.id', $event->registrations()->select('user_id'))
            ->limit(8)
            ->get())->response();
    }

    public function store(AddEventPersonRequest $request, GadEvent $event, ManageEventRegistration $registrations): RedirectResponse
    {
        /** @var User $staff */
        $staff = $request->user();
        $person = $request->person();
        $registrations->add($staff, $person, $event, $request->days());

        Inertia::flash('toast', ['type' => 'success', 'message' => __(':name was added to :event.', ['name' => $person->name, 'event' => $event->title])]);

        return back();
    }

    public function attendance(EventAttendanceRequest $request, GadEvent $event, GadEventRegistration $registration, ManageEventRegistration $registrations): RedirectResponse
    {
        /** @var User $staff */
        $staff = $request->user();
        $registration->setRelation('event', $event)->load('user');
        $registrations->setAttendance($staff, $registration, $request->days());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Attendance saved.')]);

        return back();
    }

    public function destroy(Request $request, GadEvent $event, GadEventRegistration $registration, ManageEventRegistration $registrations): RedirectResponse
    {
        /** @var User $staff */
        $staff = $request->user();
        $registration->setRelation('event', $event)->load('user');
        $registrations->remove($staff, $registration);

        Inertia::flash('toast', ['type' => 'deleted', 'message' => __(':name was taken off the list.', ['name' => $registration->user->name])]);

        return back();
    }

    /**
     * Each row's days, Y-m-d, in one query for the page.
     *
     * @param  iterable<GadEventRegistration>  $registrations
     */
    private function withDays(GadEvent $event, iterable $registrations): void
    {
        $rows = collect($registrations);
        $days = $event->checkIns()
            ->whereIn('user_id', $rows->pluck('user_id'))
            ->orderBy('attended_on')
            ->get(['user_id', 'attended_on'])
            ->groupBy('user_id');

        $rows->each(fn (GadEventRegistration $registration) => $registration->setAttribute(
            'days',
            $days->get($registration->user_id)?->pluck('attended_on')->values()->all() ?? [],
        ));
    }
}
