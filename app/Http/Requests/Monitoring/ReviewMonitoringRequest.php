<?php

namespace App\Http\Requests\Monitoring;

use Illuminate\Foundation\Http\FormRequest;

class ReviewMonitoringRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('review', $this->route('report'));
    }

    /** @return array<string, array<mixed>> */
    public function rules(): array
    {
        return ['lock_version' => ['required', 'integer', 'min:0'], 'decision' => ['required', 'in:reviewed,returned'], 'comment' => ['required_if:decision,returned', 'nullable', 'string', 'max:10000']];
    }
}
