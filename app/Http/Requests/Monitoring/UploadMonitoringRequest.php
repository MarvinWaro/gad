<?php

namespace App\Http\Requests\Monitoring;

use Illuminate\Foundation\Http\FormRequest;

class UploadMonitoringRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('report'));
    }

    /** @return array<string, array<mixed>> */
    public function rules(): array
    {
        return ['lock_version' => ['required', 'integer', 'min:0'], 'file' => ['bail', 'required', 'file', 'mimes:pdf', 'mimetypes:application/pdf', 'max:20480', function ($attribute, $value, $fail) {
            if (mime_content_type($value->getPathname()) !== 'application/pdf' || ! str_starts_with((string) file_get_contents($value->getPathname(), false, null, 0, 5), '%PDF-')) {
                $fail('Upload a PDF document, not a renamed file.');
            }
        }]];
    }
}
