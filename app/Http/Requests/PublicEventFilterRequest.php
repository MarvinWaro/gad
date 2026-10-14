<?php

namespace App\Http\Requests;

use App\Support\PublicEvents;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * The public GAD events page's filters: a region, and whether to list the
 * events on now and coming up (the default) or past ones. Anyone may ask.
 */
class PublicEventFilterRequest extends FormRequest
{
    /** Which events the list holds: on now and coming up, or past. */
    public const WHEN = ['current', 'past'];

    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<mixed>> */
    public function rules(): array
    {
        return [
            'region' => ['nullable', 'integer'],
            'when' => ['nullable', Rule::in(self::WHEN)],
            'page' => ['nullable', 'integer', 'min:1'],
        ];
    }

    /**
     * The filters in use: a region a visitor can pick, or null for every
     * region (PublicEvents::region), and which events.
     *
     * @return array{region: int|null, when: 'current'|'past'}
     */
    public function filters(): array
    {
        $region = $this->validated('region');

        return [
            'region' => PublicEvents::region($region !== null ? (int) $region : null),
            'when' => $this->validated('when') === 'past' ? 'past' : 'current',
        ];
    }
}
