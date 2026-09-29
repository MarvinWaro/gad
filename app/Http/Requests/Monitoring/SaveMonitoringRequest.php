<?php

namespace App\Http\Requests\Monitoring;

use App\Models\MonitoringReport;
use App\Support\MonitoringTemplate;
use Illuminate\Foundation\Http\FormRequest;

class SaveMonitoringRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('report'));
    }

    /** @return array<string, array<mixed>> */
    public function rules(): array
    {
        $report = $this->route('report');
        abort_unless($report instanceof MonitoringReport, 404);
        $keys = MonitoringTemplate::keys($report->currentRevision()->template_version);

        return [
            'lock_version' => ['required', 'integer', 'min:0'],
            'address' => ['nullable', 'string', 'max:2000'],
            'accomplished_on' => ['nullable', 'date_format:Y-m-d'],
            'president_name' => ['nullable', 'string', 'max:255'],
            'focal_person_name' => ['nullable', 'string', 'max:255'],
            'answers' => ['present', 'array:'.implode(',', $keys)],
            'answers.*' => ['nullable', 'string', 'max:20000'],
        ];
    }
}
