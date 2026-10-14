<?php

namespace App\Http\Requests\Admin;

use App\Models\GadEvent;
use App\Models\GadEventCertificate;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Staff giving a guest one of the event's released certificates. Whether
 * they may release it is checked against the certificate itself.
 */
class GiveGuestCertificateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('release', $this->eventCertificate()) ?? false;
    }

    /** @return array<string, array<mixed>> */
    public function rules(): array
    {
        /** @var GadEvent $event */
        $event = $this->route('event');

        return [
            'certificate' => ['required', 'string', Rule::exists('gad_event_certificates', 'id')->where('gad_event_id', $event->id)],
        ];
    }

    public function eventCertificate(): ?GadEventCertificate
    {
        /** @var GadEvent $event */
        $event = $this->route('event');

        return $event->certificates()->whereKey($this->string('certificate')->toString())->first();
    }
}
