<?php

namespace App\Http\Requests\Monitoring;

use Illuminate\Foundation\Http\FormRequest;

class SubmitMonitoringRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('report'));
    }

    /** @return array<string, array<mixed>> */
    public function rules(): array
    {
        return ['lock_version' => ['required', 'integer', 'min:0'], 'confirmed' => ['accepted']];
    }
}
