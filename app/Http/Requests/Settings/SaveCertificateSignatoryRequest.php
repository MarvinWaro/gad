<?php

namespace App\Http\Requests\Settings;

use App\Models\CertificateSignatory;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\UploadedFile;

/**
 * A signatory as Settings → Signatories writes them: their name and position
 * as certificates print them, and their e-signature, uploaded only with the
 * consent they gave (docs/certificates.md). A regional office's signatory is
 * always its own region's; the Central Office picks a region, or none for
 * its own.
 */
class SaveCertificateSignatoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        $signatory = $this->route('signatory');

        return $signatory instanceof CertificateSignatory
            ? $this->user()?->can('update', $signatory) ?? false
            : $this->user()?->can('create', CertificateSignatory::class) ?? false;
    }

    /** @return array<string, array<mixed>> */
    public function rules(): array
    {
        $creating = ! $this->route('signatory') instanceof CertificateSignatory;

        return [
            'name' => ['required', 'string', 'max:120'],
            'position' => ['required', 'string', 'max:150'],
            'region' => $this->writer()->national_access
                ? ['nullable', 'integer', 'exists:survey_regions,id']
                : ['nullable'],
            // Raster pictures only: SVG can carry scripts. PDFs print PNG and JPG.
            'signature' => [$creating ? 'required' : 'nullable', 'file', 'mimes:png,jpg,jpeg', 'max:2048', 'dimensions:min_width=300,min_height=80,max_width=4000,max_height=4000'],
            'consent' => [$this->hasFile('signature') ? 'accepted' : 'nullable'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'signature.required' => __('Upload the signatory\'s e-signature.'),
            'signature.mimes' => __('Choose a PNG or JPG picture of the signature.'),
            'signature.max' => __('Choose a picture under 2 MB.'),
            'signature.dimensions' => __('Choose a picture at least 300 pixels wide and 80 tall, and at most 4000 either way.'),
            'consent.accepted' => __('Confirm that the signatory allowed their e-signature to be used.'),
        ];
    }

    /** @return array{name: string, position: string} */
    public function signatory(): array
    {
        return [
            'name' => trim((string) $this->validated('name')),
            'position' => trim((string) $this->validated('position')),
        ];
    }

    public function signature(): ?UploadedFile
    {
        $file = $this->file('signature');

        return $file instanceof UploadedFile ? $file : null;
    }

    /** A regional office's own region; the Central Office's pick, or none for its own. */
    public function regionId(): ?int
    {
        $user = $this->writer();

        if (! $user->national_access) {
            return $user->survey_region_id;
        }

        $region = $this->validated('region');

        return $region !== null ? (int) $region : null;
    }

    private function writer(): User
    {
        /** @var User */
        return $this->user();
    }
}
