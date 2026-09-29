<?php

namespace App\Http\Requests\Monitoring;

use App\Models\MonitoringReport;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ReviewMonitoringRequest extends FormRequest
{
    public function authorize(): bool
    {
        $report = $this->route('report');

        return $report instanceof MonitoringReport && $this->user()?->can('review', $report) === true;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'lock_version' => ['required', 'integer', 'min:0'],
            'decision' => ['required', Rule::in(['reviewed', 'returned'])],
            'comment' => ['required_if:decision,returned', 'nullable', 'string', 'max:10000'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return ['comment.required_if' => __('Tell the HEI what to correct.')];
    }
}
