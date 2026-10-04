<?php

namespace App\Http\Resources;

use App\Enums\NotificationKind;
use App\Models\Notification;
use App\Support\ActivitySubjects;
use App\Support\InstitutionName;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * A notification as the bell, the Notifications page and the API show it.
 * Load NotificationInbox::RELATIONS first. Only what its reader may see: the
 * activity entry's address and device stay on the server, and the link is
 * there only when the reader may open its page.
 *
 * @mixin Notification
 */
class NotificationResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $entry = $this->activity;
        $module = $this->kind->module();
        $viewer = $request->user();

        return [
            'id' => $this->id,
            'kind' => [
                'code' => $this->kind->value,
                'label' => $this->kind->label(),
                'tone' => $this->kind->tone(),
            ],
            'module' => [
                'code' => $module->value,
                'label' => $module->label(),
            ],
            // Null when no one acted, as with survey answers, or when the
            // system did, as with a badge someone earned.
            'actor' => $entry === null || ! $this->kind->showsActor() ? null : [
                'id' => $entry->user_id,
                'name' => $entry->actor_name,
                'avatar' => $entry->user?->avatar,
            ],
            'sentence' => $this->sentence(),
            // The reviewer's comment on a report.
            'quote' => in_array($this->kind, [NotificationKind::ReportReviewed, NotificationKind::ReportReturned], true)
                ? $this->property('comment')
                : null,
            'reaction' => $this->kind === NotificationKind::PostReacted ? $this->property('reaction') : null,
            'count' => $this->count,
            'url' => $viewer !== null ? $this->linkFor($viewer) : null,
            'read_at' => $this->read_at?->toIso8601ZuluString(),
            'notified_at' => $this->notified_at->toIso8601ZuluString(),
        ];
    }

    /**
     * What it says after the actor's name, around the record's name, which
     * is shown in bold.
     *
     * @return array{before: string, subject: string|null, after: string}
     */
    private function sentence(): array
    {
        $entry = $this->activity;
        $about = $entry !== null
            ? $entry->subject_label
            : ($this->subject !== null ? ActivitySubjects::label($this->subject) : null);
        $place = $entry?->hei !== null ? InstitutionName::display($entry->hei->name) : null;
        $text = $this->kind->sentence($entry?->action, $this->count);
        $text = $place === null
            ? (string) preg_replace('/ (?:from|for) :place/', '', $text)
            : str_replace(':place', $place, $text);
        $text = str_replace(':count', number_format($this->count), $text);
        [$before, $after] = array_pad(explode(':subject', $text, 2), 2, '');

        return [
            'before' => rtrim($before),
            'subject' => str_contains($text, ':subject') ? ($about ?? 'a record that was removed') : null,
            'after' => trim($after),
        ];
    }

    private function property(string $key): ?string
    {
        $value = $this->activity?->properties[$key] ?? null;

        return is_scalar($value) && $value !== '' ? (string) $value : null;
    }
}
