<?php

namespace App\Http\Requests\Settings;

use Illuminate\Foundation\Http\FormRequest;

/** Withdrawing a certificate given by mistake, or restoring it. */
class CertificateStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<mixed>> */
    public function rules(): array
    {
        return [
            'withdrawn' => ['required', 'boolean'],
        ];
    }
}
