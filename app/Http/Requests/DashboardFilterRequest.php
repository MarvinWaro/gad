<?php

namespace App\Http\Requests;

use App\Enums\FeedScope;
use App\Models\SurveyHei;
use App\Support\PlaceFilters;
use App\Support\ReportingPeriod;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Arr;
use Illuminate\Validation\Rule;

/** The staff dashboard's period, place, ownership and law filters. */
class DashboardFilterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /** @return array<string, array<mixed>> */
    public function rules(): array
    {
        // HEI accounts get the HEI home instead, whose calendar reads its own
        // "2026-10" month (EventCalendar falls back from anything else), and
        // whose feed shows everyone's posts or the people they follow.
        if ($this->user()?->isHeiOnly()) {
            return ['feed' => FeedScope::rules()];
        }

        return [
            ...Arr::only(PlaceFilters::rules(), ['academic_year', 'region', 'hei']),
            'view' => ['nullable', Rule::in(ReportingPeriod::VIEWS)],
            'semester' => ['nullable', 'integer', Rule::in([1, 2])],
            'month' => ['nullable', 'integer', 'between:1,12'],
            'ownership' => ['nullable', Rule::in(SurveyHei::OWNERSHIPS)],
            'survey' => ['nullable', 'integer', 'exists:surveys,id'],
        ];
    }
}
