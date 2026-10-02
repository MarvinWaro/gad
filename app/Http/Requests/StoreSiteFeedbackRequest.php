<?php

namespace App\Http\Requests;

use App\Enums\FeedbackType;
use App\Support\FeedbackQuestions;
use Illuminate\Database\Query\Builder;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * A visitor's website feedback. Only the type and the feedback itself are
 * required, as on the old form; a given institution must sit in the given
 * region.
 */
class StoreSiteFeedbackRequest extends FormRequest
{
    /** Longest feedback or suggestion, in characters. */
    public const TEXT_MAX = 2000;

    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<mixed>> */
    public function rules(): array
    {
        $regionId = $this->integer('region_id');

        return [
            'type' => ['required', Rule::enum(FeedbackType::class)],
            'feedback' => ['required', 'string', 'max:'.self::TEXT_MAX],
            'suggestions' => ['nullable', 'string', 'max:'.self::TEXT_MAX],
            ...FeedbackQuestions::rules(),
            'email' => ['nullable', 'string', 'email', 'max:255'],
            'name' => ['nullable', 'string', 'max:160'],
            'region_id' => [
                'nullable',
                'integer',
                // An institution without its region would place nothing.
                Rule::requiredIf(fn (): bool => $this->filled('hei_id')),
                Rule::exists('survey_regions', 'id')->where('is_active', true),
            ],
            'hei_id' => [
                'nullable',
                'integer',
                Rule::exists('survey_heis', 'id')->where(fn (Builder $query) => $query
                    ->where('is_active', true)
                    ->whereIn('survey_cluster_id', fn (Builder $clusters) => $clusters
                        ->select('id')
                        ->from('survey_clusters')
                        ->where('survey_region_id', $regionId))),
            ],
            // Hidden from people; a bot that fills it is thanked but ignored.
            'website' => ['nullable', 'string', 'max:255'],
        ];
    }

    /** @return array<string, string> */
    public function attributes(): array
    {
        return [
            'type' => 'feedback type',
            'region_id' => 'region',
            'hei_id' => 'institution',
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'hei_id.exists' => 'Choose an institution from the selected region.',
            'region_id.required' => 'Choose the region of the institution.',
        ];
    }
}
