<?php

namespace App\Http\Requests\Monitoring;

use App\Models\MonitoringReport;
use App\Models\MonitoringRevision;
use App\Support\MonitoringTemplate;
use Illuminate\Foundation\Http\FormRequest;

/**
 * An autosave: each changed field with the value the person started from
 * (base) and the value they typed (value). Values arrive exactly as typed.
 */
class SaveMonitoringDraftRequest extends FormRequest
{
    public function authorize(): bool
    {
        $report = $this->route('report');

        return $report instanceof MonitoringReport && $this->user()?->can('edit', $report) === true;
    }

    /** @return array<string, array<int, string>> */
    public function rules(): array
    {
        /** @var MonitoringReport $report */
        $report = $this->route('report');
        $keys = MonitoringTemplate::keys($report->currentRevision->template_version ?? MonitoringTemplate::VERSION);

        return [
            'details' => ['sometimes', 'array:'.implode(',', MonitoringRevision::DETAIL_FIELDS)],
            'details.*' => ['array:base,value'],
            'details.*.base' => ['present', 'nullable', 'string'],
            'details.*.value' => ['present', 'nullable', 'string'],
            'details.address.value' => ['nullable', 'string', 'max:2000'],
            'details.accomplished_on.value' => ['nullable', 'date_format:Y-m-d'],
            'details.president_name.value' => ['nullable', 'string', 'max:255'],
            'details.focal_person_name.value' => ['nullable', 'string', 'max:255'],
            'answers' => ['sometimes', 'array:'.implode(',', $keys)],
            'answers.*' => ['array:base,value'],
            'answers.*.base' => ['present', 'nullable', 'string'],
            'answers.*.value' => ['present', 'nullable', 'string', 'max:20000'],
        ];
    }

    /** @return array<string, string> */
    public function attributes(): array
    {
        return [
            'details.address.value' => 'address',
            'details.accomplished_on.value' => 'date accomplished',
            'details.president_name.value' => "President's name",
            'details.focal_person_name.value' => "GAD Focal Person's name",
            'answers.*.value' => 'answer',
        ];
    }

    /**
     * @return array{details?: array<string, array{base: string|null, value: string|null}>, answers?: array<string, array{base: string|null, value: string|null}>}
     */
    public function changes(): array
    {
        /** @var array{details?: array<string, array{base: string|null, value: string|null}>, answers?: array<string, array{base: string|null, value: string|null}>} */
        return $this->safe()->only(['details', 'answers']);
    }
}
