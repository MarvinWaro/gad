<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

/**
 * A page of the public HEI browser (/hei), passed on to HEIDA. The page size
 * is capped so no visitor can ask HEIDA for its whole directory at once.
 */
class BrowseHeisRequest extends FormRequest
{
    public const PER_PAGE = 25;

    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<mixed>> */
    public function rules(): array
    {
        return [
            'page' => ['nullable', 'integer', 'min:1', 'max:10000'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'region_id' => ['nullable', 'alpha_dash', 'max:20'],
            'search' => ['nullable', 'string', 'max:100'],
        ];
    }

    /** @return array{page: int, per_page: int, region_id?: string, search?: string} */
    public function params(): array
    {
        $params = [
            'per_page' => $this->integer('per_page', self::PER_PAGE),
            'page' => $this->integer('page', 1),
        ];

        if ($this->filled('region_id')) {
            $params['region_id'] = (string) $this->validated('region_id');
        }

        $search = trim((string) $this->validated('search'));
        if ($search !== '') {
            $params['search'] = $search;
        }

        return $params;
    }
}
