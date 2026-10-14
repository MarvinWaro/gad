<?php

namespace App\Actions\Certificates;

use App\Enums\ActivityAction;
use App\Enums\ActivityModule;
use App\Models\CertificateSignatory;
use App\Models\User;
use App\Services\ActivityRecorder;
use App\Support\CertificateFiles;
use Illuminate\Http\UploadedFile;
use Illuminate\Validation\ValidationException;

/**
 * Settings → Signatories: the people who sign an office's event
 * certificates, with the e-signature uploaded with their consent
 * (docs/certificates.md). A new signature never deletes the old file, which
 * released certificates may still print; a signatory on a design stays
 * until they are taken off it, and removing one keeps their record.
 *
 * @phpstan-type SignatoryInput array{name: string, position: string}
 */
final class ManageSignatory
{
    public function __construct(
        private readonly ActivityRecorder $activity,
    ) {}

    /** @param SignatoryInput $input */
    public function create(User $author, ?int $regionId, array $input, UploadedFile $signature): CertificateSignatory
    {
        $signatory = CertificateSignatory::query()->create([
            ...$input,
            'survey_region_id' => $regionId,
            'signature_path' => CertificateFiles::store($signature, 'signatures'),
            'created_by' => $author->id,
        ]);
        $this->activity->record(ActivityAction::Created, ActivityModule::Certificates, $signatory);

        return $signatory;
    }

    /** @param SignatoryInput $input */
    public function update(CertificateSignatory $signatory, ?int $regionId, array $input, ?UploadedFile $signature): CertificateSignatory
    {
        // A design signs with its own office's people.
        if ($regionId !== $signatory->survey_region_id && $signatory->designs()->exists()) {
            throw ValidationException::withMessages([
                'region' => __('Take :name off their certificate designs before moving them to another office.', ['name' => $signatory->name]),
            ]);
        }

        $signatory->update([
            ...$input,
            'survey_region_id' => $regionId,
            'signature_path' => $signature !== null ? CertificateFiles::store($signature, 'signatures') : $signatory->signature_path,
        ]);
        $this->activity->recordSave(
            ActivityModule::Certificates,
            $signatory,
            extra: $signature !== null ? ['signature' => [__('A signature'), __('A new signature')]] : [],
        );

        return $signatory;
    }

    public function delete(CertificateSignatory $signatory): void
    {
        $designs = $signatory->designs()->count();

        if ($designs > 0) {
            throw ValidationException::withMessages([
                'signatory' => trans_choice(
                    '{1} :name signs a certificate design. Take them off it first.|[2,*] :name signs :count certificate designs. Take them off those first.',
                    $designs,
                    ['name' => $signatory->name],
                ),
            ]);
        }

        $signatory->delete();
        $this->activity->record(ActivityAction::Deleted, ActivityModule::Certificates, $signatory);
    }
}
