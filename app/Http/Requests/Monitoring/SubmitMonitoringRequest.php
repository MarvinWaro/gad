<?php

namespace App\Http\Requests\Monitoring;

use App\Models\MonitoringReport;
use Closure;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\UploadedFile;

/** The signed copy of a finalized report, sent with the submission. */
class SubmitMonitoringRequest extends FormRequest
{
    /** The largest signed PDF accepted, in kilobytes. */
    public const MAX_KILOBYTES = 20480;

    public function authorize(): bool
    {
        $report = $this->route('report');

        return $report instanceof MonitoringReport && $this->user()?->can('edit', $report) === true;
    }

    /** @return array<string, array<int, Closure|string>> */
    public function rules(): array
    {
        return [
            'lock_version' => ['required', 'integer', 'min:0'],
            'confirmed' => ['accepted'],
            'file' => ['bail', 'required', 'file', 'mimes:pdf', 'mimetypes:application/pdf', 'max:'.self::MAX_KILOBYTES, function (string $attribute, mixed $value, Closure $fail): void {
                // A renamed image or document is not a signed PDF.
                if (! $value instanceof UploadedFile || mime_content_type($value->getPathname()) !== 'application/pdf'
                    || ! str_starts_with((string) file_get_contents($value->getPathname(), false, null, 0, 5), '%PDF-')) {
                    $fail(__('Upload a PDF document, not a renamed file.'));
                }
            }],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'confirmed.accepted' => __('Confirm that the PDF is signed and shows this report’s document code.'),
            'file.required' => __('Choose the signed PDF to upload.'),
            'file.max' => __('The signed PDF must be 20 MB or smaller.'),
        ];
    }

    public function version(): int
    {
        return (int) $this->validated('lock_version');
    }

    public function signedCopy(): UploadedFile
    {
        /** @var UploadedFile */
        return $this->file('file');
    }
}
