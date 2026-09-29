<?php

namespace App\Http\Requests\Monitoring;

use App\Models\MonitoringReport;
use Illuminate\Foundation\Http\FormRequest;

class CreateMonitoringRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', MonitoringReport::class);
    }

    /** @return array<string, array<mixed>> */
    public function rules(): array
    {
        return [
            'academic_year' => ['required', 'regex:/^\d{4}-\d{4}$/', function ($attribute, $value, $fail) {
                if (preg_match('/^(\d{4})-(\d{4})$/', $value, $parts) && ((int) $parts[2] !== (int) $parts[1] + 1 || (int) $parts[1] < 2000 || (int) $parts[1] > 2100)) {
                    $fail('Use consecutive years between 2000 and 2101, such as 2026-2027.');
                }
            }],
            'semester' => ['required', 'integer', 'in:1,2'],
        ];
    }
}
