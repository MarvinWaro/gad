<?php

namespace App\Http\Requests\Settings;

use App\Enums\CertificateKind;
use App\Models\CertificateDesign;
use App\Models\User;
use Closure;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\UploadedFile;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * A certificate design as Settings → Certificates writes it
 * (docs/certificates.md): its kind, name, background, wording with blanks,
 * extra logos (those kept, then new ones) and one to three signatories in
 * the order they sign. Whether they are the design's own office's is
 * ManageCertificateDesign's rule.
 */
class SaveCertificateDesignRequest extends FormRequest
{
    public function authorize(): bool
    {
        $design = $this->route('design');

        return $design instanceof CertificateDesign
            ? $this->user()?->can('update', $design) ?? false
            : $this->user()?->can('create', CertificateDesign::class) ?? false;
    }

    /** @return array<string, array<mixed>> */
    public function rules(): array
    {
        return [
            'kind' => ['required', Rule::enum(CertificateKind::class)],
            'name' => ['required', 'string', 'max:120'],
            'background' => ['required', Rule::in(CertificateDesign::BACKGROUNDS)],
            'body' => ['required', 'string', 'max:400', $this->knownBlanks(...)],
            'region' => $this->writer()->national_access
                ? ['nullable', 'integer', 'exists:survey_regions,id']
                : ['nullable'],
            'signatories' => ['required', 'array', 'min:1', 'max:'.CertificateDesign::MAX_SIGNATORIES],
            'signatories.*' => ['required', 'string', 'distinct', 'ulid'],
            'kept_logos' => ['nullable', 'array'],
            'kept_logos.*' => ['string', 'max:100'],
            'new_logos' => ['nullable', 'array'],
            // Raster pictures only: SVG can carry scripts. PDFs print PNG and JPG.
            'new_logos.*' => ['file', 'mimes:png,jpg,jpeg', 'max:1024', 'dimensions:min_width=64,min_height=64'],
        ];
    }

    /**
     * Up to three logos, kept and new together.
     *
     * @return array<int, Closure(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if (count((array) $this->input('kept_logos', [])) + count((array) $this->file('new_logos', [])) > CertificateDesign::MAX_LOGOS) {
                    $validator->errors()->add('new_logos', __('Add up to three logos. The CHED seal and Bagong Pilipinas are always printed.'));
                }
            },
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'signatories.required' => __('Choose at least one signatory.'),
            'signatories.min' => __('Choose at least one signatory.'),
            'signatories.max' => __('Choose up to three signatories.'),
            'new_logos.*.mimes' => __('Choose a PNG or JPG logo.'),
            'new_logos.*.max' => __('Choose a logo under 1 MB.'),
            'new_logos.*.dimensions' => __('Choose a logo at least 64 pixels wide and tall.'),
        ];
    }

    /** @return array{kind: CertificateKind, name: string, background: string, body: string} */
    public function design(): array
    {
        return [
            'kind' => CertificateKind::from((string) $this->validated('kind')),
            'name' => trim((string) $this->validated('name')),
            'background' => (string) $this->validated('background'),
            'body' => trim((string) $this->validated('body')),
        ];
    }

    /** @return list<string> */
    public function signatoryIds(): array
    {
        return array_values(array_map(strval(...), (array) $this->validated('signatories')));
    }

    /** @return list<string> */
    public function keptLogos(): array
    {
        return array_values(array_map(strval(...), (array) ($this->validated('kept_logos') ?? [])));
    }

    /** @return list<UploadedFile> */
    public function newLogos(): array
    {
        return array_values(array_filter((array) $this->file('new_logos', []), fn (mixed $file): bool => $file instanceof UploadedFile));
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

    /** Every blank is one certificates fill in. */
    private function knownBlanks(string $attribute, mixed $value, Closure $fail): void
    {
        $unknown = array_diff(CertificateDesign::blanksIn((string) $value), CertificateDesign::BLANKS);

        if ($unknown !== []) {
            $fail(__('{:blank} isn\'t a blank certificates fill in. Use :blanks.', [
                'blank' => reset($unknown),
                'blanks' => implode(', ', array_map(fn (string $blank): string => "{{$blank}}", CertificateDesign::BLANKS)),
            ]));
        }
    }

    private function writer(): User
    {
        /** @var User */
        return $this->user();
    }
}
