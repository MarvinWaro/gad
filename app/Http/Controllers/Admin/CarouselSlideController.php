<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreCarouselSlideRequest;
use App\Http\Requests\Admin\UpdateCarouselSlideRequest;
use App\Models\CarouselSlide;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class CarouselSlideController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));

        $slides = CarouselSlide::query()
            ->with('creator:id,name')
            ->when($search !== '', function ($query) use ($search): void {
                $query->where(function ($query) use ($search): void {
                    $query
                        ->where('title', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
            })
            ->orderBy('sort_order')
            ->latest('id')
            ->paginate(10)
            ->withQueryString()
            ->through(fn (CarouselSlide $slide): array => [
                'id' => $slide->id,
                'title' => $slide->title,
                'description' => $slide->description,
                'image_url' => Storage::disk('public')->url($slide->image_path),
                'link' => $slide->link,
                'is_active' => $slide->is_active,
                'sort_order' => $slide->sort_order,
                'created_by' => $slide->creator?->name,
                'updated_at' => $slide->updated_at?->toISOString(),
            ]);

        return Inertia::render('admin/carousels/index', [
            'slides' => $slides,
            'filters' => ['search' => $search],
            'permissions' => [
                'create' => $request->user()->can('carousel.create'),
                'update' => $request->user()->can('carousel.update'),
                'delete' => $request->user()->can('carousel.delete'),
            ],
        ]);
    }

    public function store(StoreCarouselSlideRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $validated['image_path'] = $request->file('image')->store('carousel', 'public');
        $validated['alt_text'] = $validated['title'];
        $validated['created_by'] = $request->user()->id;
        unset($validated['image']);

        CarouselSlide::query()->create($validated);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Carousel slide created.'),
        ]);

        return to_route('admin.carousels.index');
    }

    public function update(
        UpdateCarouselSlideRequest $request,
        CarouselSlide $carouselSlide,
    ): RedirectResponse {
        $validated = $request->validated();
        $validated['alt_text'] = $validated['title'];
        $oldImagePath = $carouselSlide->image_path;

        if ($request->hasFile('image')) {
            $validated['image_path'] = $request->file('image')->store('carousel', 'public');
        }
        unset($validated['image']);

        $carouselSlide->update($validated);

        if (isset($validated['image_path'])) {
            Storage::disk('public')->delete($oldImagePath);
        }

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Carousel slide updated.'),
        ]);

        return to_route('admin.carousels.index');
    }

    public function destroy(CarouselSlide $carouselSlide): RedirectResponse
    {
        $imagePath = $carouselSlide->image_path;
        $carouselSlide->delete();
        Storage::disk('public')->delete($imagePath);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Carousel slide deleted.'),
        ]);

        return to_route('admin.carousels.index');
    }
}
