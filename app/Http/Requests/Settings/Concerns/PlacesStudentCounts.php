<?php

namespace App\Http\Requests\Settings\Concerns;

use App\Enums\StudentCountKind;
use App\Models\SurveyRegion;
use App\Models\User;
use Illuminate\Validation\Rule;

/**
 * Which region's enrollment and graduate figures a change is for. A regional
 * office always changes its own region's, whatever is sent; the Central
 * Office names the region.
 */
trait PlacesStudentCounts
{
    /** @return array<string, array<mixed>> */
    protected function placeRules(): array
    {
        return [
            'kind' => ['required', Rule::enum(StudentCountKind::class)],
            'region' => $this->writer()->national_access
                ? ['required', 'integer', 'exists:survey_regions,id']
                : ['nullable'],
        ];
    }

    /** @return array<string, string> */
    protected function placeMessages(): array
    {
        return ['region.required' => __('Choose the region these figures belong to.')];
    }

    public function kind(): StudentCountKind
    {
        return StudentCountKind::from((string) $this->validated('kind'));
    }

    public function region(): SurveyRegion
    {
        $user = $this->writer();

        return SurveyRegion::query()->findOrFail($user->national_access ? (int) $this->validated('region') : $user->survey_region_id);
    }

    /** Only staff with an office change figures, since figures belong to a region. */
    protected function canPlace(string $permission): bool
    {
        $user = $this->user();

        return $user instanceof User && $user->can($permission) && $user->hasOffice();
    }

    private function writer(): User
    {
        /** @var User */
        return $this->user();
    }
}
