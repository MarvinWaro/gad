<?php

namespace App\Http\Requests\Settings;

use App\Http\Requests\Settings\Concerns\PlacesStudentCounts;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\UploadedFile;

/** An enrollment or graduates file to import for one region. */
class ImportStudentCountsRequest extends FormRequest
{
    use PlacesStudentCounts;

    public function authorize(): bool
    {
        return $this->canPlace('student-counts.import');
    }

    /** @return array<string, array<mixed>> */
    public function rules(): array
    {
        return [
            ...$this->placeRules(),
            'file' => ['required', 'file', 'extensions:xlsx,csv', 'max:2048'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            ...$this->placeMessages(),
            'file.required' => __('Choose the file to import.'),
            'file.extensions' => __('Choose an Excel workbook (.xlsx) or a CSV file.'),
            'file.max' => __('The file must be 2 MB or smaller.'),
        ];
    }

    public function sheet(): UploadedFile
    {
        /** @var UploadedFile */
        return $this->file('file');
    }
}
