<?php

namespace App\Http\Requests;

use App\Models\GadEvent;
use App\Models\GadEventCertificate;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Someone who missed a day asking for one of an event's certificates, and
 * why (docs/certificates.md). Whether they may is ManageCertificateRequest's
 * to say; the route lets in whoever sees the event.
 */
class StoreCertificateRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<mixed>> */
    public function rules(): array
    {
        /** @var GadEvent $event */
        $event = $this->route('event');

        return [
            'certificate' => ['required', 'string', Rule::exists('gad_event_certificates', 'id')->where('gad_event_id', $event->id)],
            'reason' => ['required', 'string', 'max:500'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'certificate.required' => __('Choose the certificate you need.'),
            'certificate.exists' => __('Choose one of this event\'s certificates.'),
            'reason.required' => __('Say why you need it, such as the day you came for.'),
        ];
    }

    public function eventCertificate(): GadEventCertificate
    {
        return GadEventCertificate::query()->whereKey($this->validated('certificate'))->firstOrFail();
    }

    public function reason(): string
    {
        return trim((string) $this->validated('reason'));
    }
}
