<?php

namespace App\Http\Requests\Monitoring;

use App\Models\MonitoringReport;
use Illuminate\Foundation\Http\FormRequest;

/** A workflow step, such as finalizing, taken on the version of the report the person saw. */
class MonitoringVersionRequest extends FormRequest
{
    public function authorize(): bool
    {
        $report = $this->route('report');

        return $report instanceof MonitoringReport && $this->user()?->can('edit', $report) === true;
    }

    /** @return array<string, array<int, string>> */
    public function rules(): array
    {
        return ['lock_version' => ['required', 'integer', 'min:0']];
    }

    public function version(): int
    {
        return (int) $this->validated('lock_version');
    }
}
