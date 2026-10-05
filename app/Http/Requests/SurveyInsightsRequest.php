<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/** The Surveys page's insights: the dashboard's period, place, ownership and law filters. */
class SurveyInsightsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /** @return array<string, array<mixed>> */
    public function rules(): array
    {
        return DashboardFilterRequest::staffRules();
    }
}
