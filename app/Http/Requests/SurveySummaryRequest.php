<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Arr;

/**
 * One survey's Summary: the period and places, narrowed by the respondents'
 * sex and group.
 */
class SurveySummaryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /** @return array<string, array<mixed>> */
    public function rules(): array
    {
        return [
            ...Arr::except(DashboardFilterRequest::staffRules(), ['ownership', 'survey']),
            'sex' => ['nullable', 'string', 'max:40'],
            'respondent_group' => ['nullable', 'string', 'max:60'],
        ];
    }
}
