<?php

namespace App\Http\Requests\Quests;

use App\Models\Quest;
use App\Support\PlaceFilters;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Arr;

/** The staff list of quests: a search, and the region for the Central Office. */
class QuestListFilterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('manage', Quest::class) ?? false;
    }

    /** @return array<string, array<mixed>> */
    public function rules(): array
    {
        return Arr::only(PlaceFilters::rules(), ['region', 'search', 'page']);
    }
}
