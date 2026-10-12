<?php

namespace App\Http\Requests\Settings;

use Illuminate\Foundation\Http\FormRequest;

/**
 * The search and place filters of the certificate lists in Settings:
 * designs, signatories, and an event certificate's holders. The routes'
 * policies decide who may open them.
 */
class CertificateFilterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<mixed>> */
    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:150'],
            'region' => ['nullable', 'integer', 'exists:survey_regions,id'],
            'hei' => ['nullable', 'integer', 'exists:survey_heis,id'],
            'page' => ['nullable', 'integer', 'min:1'],
        ];
    }

    public function search(): string
    {
        return trim((string) $this->validated('search'));
    }

    /**
     * The filters in use, as the page's filter bar holds them: text.
     *
     * @return array{search?: string, region?: string, hei?: string}
     */
    public function filters(): array
    {
        return array_filter([
            'search' => $this->search(),
            'region' => (string) $this->validated('region'),
            'hei' => (string) $this->validated('hei'),
        ], fn (string $value): bool => $value !== '');
    }

    /** The region picked, for the Central Office, whose lists span them all. */
    public function regionId(): ?int
    {
        $region = $this->validated('region');

        return $region !== null ? (int) $region : null;
    }
}
