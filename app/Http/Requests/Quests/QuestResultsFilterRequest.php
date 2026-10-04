<?php

namespace App\Http\Requests\Quests;

use App\Models\Quest;
use App\Support\PlaceFilters;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Arr;

/** A quest's results, narrowed to the region and HEI its players played from. */
class QuestResultsFilterRequest extends FormRequest
{
    public function authorize(): bool
    {
        $quest = $this->route('quest');

        return $quest instanceof Quest && ($this->user()?->can('results', $quest) ?? false);
    }

    /** @return array<string, array<mixed>> */
    public function rules(): array
    {
        return Arr::only(PlaceFilters::rules(), ['region', 'hei', 'page']);
    }
}
