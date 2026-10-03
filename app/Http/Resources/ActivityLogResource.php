<?php

namespace App\Http\Resources;

use App\Models\ActivityLog;
use App\Support\ActivitySubjects;
use App\Support\DeviceName;
use App\Support\InstitutionName;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Str;

/**
 * An activity log entry as the list and the API show it. Load `user`,
 * `subject`, `region` and `hei` first. The raw user agent stays
 * on the server; only the device it names is sent.
 *
 * @mixin ActivityLog
 */
class ActivityLogResource extends JsonResource
{
    /** Field and detail names that read badly as headlines. */
    private const LABELS = [
        'survey_region_id' => 'Region',
        'survey_cluster_id' => 'Cluster',
        'survey_hei_id' => 'HEI',
        'national_access' => 'Central Office access',
        'is_active' => 'Active',
        'is_all_day' => 'All day',
        'uii' => 'UII',
        'instant_registration' => 'No approval needed',
        'instant_registration_until' => 'No approval needed until',
        'requires_text' => 'Asks to specify',
        'details' => 'Report details saved',
        'requirements' => 'Requirements saved',
        'moderated' => 'Removed by a moderator',
        'reply' => 'A reply',
    ];

    /** Why a sign-in was refused, by the code the log keeps. */
    private const FAILURE_REASONS = [
        'credentials' => 'wrong email or password',
        'two_factor' => 'wrong two-factor code',
        'pending' => 'account awaiting approval',
        'inactive' => 'account deactivated',
    ];

    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'action' => [
                'code' => $this->action->value,
                'label' => $this->action->label(),
                'tone' => $this->action->tone(),
            ],
            'module' => [
                'code' => $this->module->value,
                'label' => $this->module->label(),
            ],
            'sentence' => $this->sentence(),
            'actor' => [
                'id' => $this->user_id,
                'name' => $this->actor_name,
                'avatar' => $this->user?->avatar,
            ],
            'subject' => [
                'type' => $this->subject_type,
                'id' => $this->subject_id,
                // Only while the record exists and the viewer may open its page.
                'url' => $this->subject !== null && $request->user() !== null
                    ? ActivitySubjects::url($this->subject, $request->user())
                    : null,
            ],
            'place' => [
                'region' => $this->region?->name,
                'hei' => $this->hei !== null ? InstitutionName::display($this->hei->name) : null,
            ],
            'changes' => collect($this->changes ?? [])->map(fn (array $change, string $field): array => [
                'field' => $this->label($field),
                'before' => $this->text($change[0] ?? null),
                'after' => $this->text($change[1] ?? null),
            ])->values(),
            'details' => collect($this->properties ?? [])
                ->except('reason')
                ->reject(fn (mixed $value): bool => $value === null || $value === [] || $value === false)
                ->map(fn (mixed $value, string $key): array => [
                    'label' => $this->label($key),
                    'value' => $key === 'reaction' ? Str::ucfirst((string) $value) : $this->text($value),
                ])->values(),
            'device' => DeviceName::from($this->user_agent),
            'ip_address' => $this->ip_address,
            'created_at' => $this->created_at->toIso8601ZuluString(),
        ];
    }

    /**
     * The sentence around the subject's name, which the page sets in bold.
     *
     * @return array{before: string, subject: string|null, after: string}
     */
    private function sentence(): array
    {
        // Someone acting on their own account: "Updated their own account".
        $self = $this->subject_type === 'user' && $this->user_id !== null
            && (string) $this->user_id === $this->subject_id;
        $text = str_replace(':noun', $self ? '' : ActivitySubjects::noun($this->subject_type), $this->action->sentence());
        $text = Str::squish($self ? str_replace(':subject', 'their own account', $text) : $text);
        [$before, $after] = array_pad(explode(':subject', $text, 2), 2, '');
        $reason = self::FAILURE_REASONS[$this->properties['reason'] ?? ''] ?? null;

        return [
            'before' => rtrim($before),
            'subject' => str_contains($text, ':subject') ? $this->subject_label : null,
            'after' => trim($after.($reason !== null ? " ({$reason})" : '')),
        ];
    }

    private function label(string $key): string
    {
        return self::LABELS[$key] ?? Str::ucfirst(str_replace('_', ' ', Str::snake($key)));
    }

    private function text(mixed $value): ?string
    {
        return match (true) {
            $value === null || $value === '' => null,
            is_bool($value) => $value ? 'Yes' : 'No',
            is_array($value) => implode(', ', array_map(fn (mixed $item): string => (string) $item, $value)),
            default => (string) $value,
        };
    }
}
