<?php

namespace App\Http\Requests\Monitoring;

use App\Support\PlaceFilters;
use Illuminate\Foundation\Http\FormRequest;

class ChecklistFilterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /** @return array<string, array<mixed>> */
    public function rules(): array
    {
        return PlaceFilters::rules();
    }
}
