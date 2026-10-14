<?php

namespace App\Http\Requests\Settings;

use Illuminate\Foundation\Http\FormRequest;

/**
 * The office answering a certificate request: approve, which gives the
 * certificate, or decline, with a note for the person if it likes. The
 * route's policy decides who may.
 */
class DecideCertificateRequestRequest extends FormRequest
{
    /** The answers, as sent. */
    public const DECISIONS = ['approve', 'decline'];

    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<mixed>> */
    public function rules(): array
    {
        return [
            'decision' => ['required', 'string', 'in:'.implode(',', self::DECISIONS)],
            'note' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function approves(): bool
    {
        return $this->validated('decision') === 'approve';
    }

    public function note(): ?string
    {
        $note = trim((string) $this->validated('note'));

        return $note !== '' ? $note : null;
    }
}
