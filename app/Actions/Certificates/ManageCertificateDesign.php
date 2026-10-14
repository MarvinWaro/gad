<?php

namespace App\Actions\Certificates;

use App\Enums\ActivityAction;
use App\Enums\ActivityModule;
use App\Enums\CertificateKind;
use App\Models\CertificateDesign;
use App\Models\CertificateSignatory;
use App\Models\User;
use App\Services\ActivityRecorder;
use App\Support\CertificateFiles;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Settings → Certificates: an office's certificate designs
 * (docs/certificates.md). A design signs with one to three of its own
 * office's signatories. Once used on an event its kind and office stay, and
 * once released it can't be deleted; released certificates keep what they
 * were released with either way. Logo files are never deleted.
 *
 * @phpstan-type DesignInput array{kind: CertificateKind, name: string, background: string, body: string}
 */
final class ManageCertificateDesign
{
    public function __construct(
        private readonly ActivityRecorder $activity,
    ) {}

    /**
     * @param  DesignInput  $input
     * @param  list<string>  $signatoryIds  In the order they sign.
     * @param  list<UploadedFile>  $logos
     */
    public function create(User $author, ?int $regionId, array $input, array $signatoryIds, array $logos): CertificateDesign
    {
        $signatories = $this->signatories($regionId, $signatoryIds);

        $design = DB::transaction(function () use ($author, $regionId, $input, $signatories, $logos): CertificateDesign {
            $design = CertificateDesign::query()->create([
                ...$input,
                'survey_region_id' => $regionId,
                'logo_paths' => array_map(fn (UploadedFile $logo): string => CertificateFiles::store($logo, 'logos'), $logos),
                'created_by' => $author->id,
            ]);
            $this->sign($design, $signatories);

            return $design;
        });
        $this->activity->record(ActivityAction::Created, ActivityModule::Certificates, $design);

        return $design;
    }

    /**
     * @param  DesignInput  $input
     * @param  list<string>  $signatoryIds  In the order they sign.
     * @param  list<string>  $keptLogos  The keys (CertificateFiles::key) of the logos that stay, in order.
     * @param  list<UploadedFile>  $newLogos  Added after them.
     */
    public function update(CertificateDesign $design, ?int $regionId, array $input, array $signatoryIds, array $keptLogos, array $newLogos): CertificateDesign
    {
        if ($design->uses()->exists()) {
            $problem = match (true) {
                $input['kind'] !== $design->kind => ['kind' => __('This design is used on events, so it stays a :kind. Duplicate it to make the other kind.', ['kind' => $design->kind->title()])],
                $regionId !== $design->survey_region_id => ['region' => __('This design is used on events, so it stays with its office.')],
                default => null,
            };

            if ($problem !== null) {
                throw ValidationException::withMessages($problem);
            }
        }

        $signatories = $this->signatories($regionId, $signatoryIds);
        $before = $design->signatories()->pluck('name')->all();
        $kept = collect($keptLogos)
            ->map(fn (string $key): ?string => collect($design->logo_paths)->first(fn (string $path): bool => CertificateFiles::key($path) === $key))
            ->filter()
            ->unique()
            ->values()
            ->all();
        $logos = [...$kept, ...array_map(fn (UploadedFile $logo): string => CertificateFiles::store($logo, 'logos'), $newLogos)];
        $logoChange = $logos !== $design->logo_paths ? [$this->logoCount($design->logo_paths), $this->logoCount($logos)] : null;

        DB::transaction(function () use ($design, $regionId, $input, $signatories, $logos): void {
            $design->update([...$input, 'survey_region_id' => $regionId, 'logo_paths' => $logos]);
            $this->sign($design, $signatories);
        });

        $this->activity->recordSave(ActivityModule::Certificates, $design, extra: array_filter([
            'signatories' => $this->activity->listChange($before, array_map(fn (CertificateSignatory $signatory): string => $signatory->name, $signatories)),
            'logos' => $logoChange,
        ]));

        return $design;
    }

    /** A copy to change, such as for the other kind or a new director. */
    public function duplicate(User $author, CertificateDesign $design): CertificateDesign
    {
        $copy = DB::transaction(function () use ($author, $design): CertificateDesign {
            $copy = CertificateDesign::query()->create([
                'survey_region_id' => $design->survey_region_id,
                'kind' => $design->kind,
                'name' => Str::limit(__('Copy of :name', ['name' => $design->name]), 120, ''),
                'background' => $design->background,
                'body' => $design->body,
                // The same files: they are never deleted.
                'logo_paths' => $design->logo_paths,
                'created_by' => $author->id,
            ]);
            $this->sign($copy, $design->signatories()->get()->all());

            return $copy;
        });
        $this->activity->record(ActivityAction::Created, ActivityModule::Certificates, $copy);

        return $copy;
    }

    /**
     * Makes its pair, of the other kind (docs/certificates.md): the same
     * office, background, logos and signatories, with that kind's own
     * wording to edit. The two are used on events and released together.
     *
     * @throws ValidationException
     */
    public function pair(User $author, CertificateDesign $design): CertificateDesign
    {
        if ($design->partner() !== null) {
            throw ValidationException::withMessages([
                'design' => __(':name already has its :kind.', ['name' => $design->name, 'kind' => $design->kind->other()->title()]),
            ]);
        }

        $kind = $design->kind->other();
        $pair = DB::transaction(function () use ($author, $design, $kind): CertificateDesign {
            $pair = CertificateDesign::query()->create([
                'survey_region_id' => $design->survey_region_id,
                'kind' => $kind,
                'paired_with_id' => $design->id,
                'name' => Str::limit($design->name.' ('.Str::after($kind->title(), 'Certificate of ').')', 120, ''),
                'background' => $design->background,
                'body' => $kind->defaultBody(),
                // The same files: they are never deleted.
                'logo_paths' => $design->logo_paths,
                'created_by' => $author->id,
            ]);
            $this->sign($pair, $design->signatories()->get()->all());

            return $pair;
        });
        $this->activity->record(ActivityAction::Created, ActivityModule::Certificates, $pair);

        return $pair;
    }

    /** Taken off the events it waits on; released certificates keep it. */
    public function delete(CertificateDesign $design): void
    {
        if ($design->uses()->whereNotNull('released_at')->exists()) {
            throw ValidationException::withMessages([
                'design' => __('Certificates were released with :name, so it stays. Duplicate it to make a new one.', ['name' => $design->name]),
            ]);
        }

        DB::transaction(function () use ($design): void {
            $design->uses()->delete();
            $design->delete();
        });
        $this->activity->record(ActivityAction::Deleted, ActivityModule::Certificates, $design);
    }

    /**
     * The signatories chosen, in order: one to three of the design's own
     * office's, not removed.
     *
     * @param  list<string>  $ids
     * @return list<CertificateSignatory>
     */
    private function signatories(?int $regionId, array $ids): array
    {
        $found = CertificateSignatory::query()
            ->whereKey($ids)
            ->when($regionId === null, fn ($query) => $query->whereNull('survey_region_id'), fn ($query) => $query->where('survey_region_id', $regionId))
            ->get()
            ->keyBy('id');
        $chosen = array_values(array_filter(array_map(fn (string $id): ?CertificateSignatory => $found->get($id), array_unique($ids))));

        if ($chosen === [] || count($chosen) !== count(array_unique($ids)) || count($chosen) > CertificateDesign::MAX_SIGNATORIES) {
            throw ValidationException::withMessages([
                'signatories' => __('Choose one to three signatories of this certificate\'s office.'),
            ]);
        }

        return $chosen;
    }

    /** @param  list<string>  $paths */
    private function logoCount(array $paths): string
    {
        return trans_choice('{0} No logos|{1} 1 logo|[2,*] :count logos', count($paths));
    }

    /** @param  array<int, CertificateSignatory>  $signatories  In the order they sign. */
    private function sign(CertificateDesign $design, array $signatories): void
    {
        // Positions are unique, so a reorder starts afresh.
        $design->signatories()->detach();
        $design->signatories()->attach(collect($signatories)->values()->mapWithKeys(
            fn (CertificateSignatory $signatory, int $index): array => [$signatory->id => ['position' => $index + 1]],
        )->all());
    }
}
