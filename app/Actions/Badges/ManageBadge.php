<?php

namespace App\Actions\Badges;

use App\Enums\ActivityAction;
use App\Enums\ActivityModule;
use App\Models\Badge;
use App\Models\BadgeAward;
use App\Models\User;
use App\Services\ActivityRecorder;
use App\Services\Notifier;
use App\Support\ActivitySubjects;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

/**
 * Settings → Badges: writing badges, their pictures, switching them on or
 * off, and awarding custom badges by hand. A system badge keeps its rule
 * (or GAD Quest level) and stays national: its name, description and
 * picture can change, but it is never deleted or awarded by hand. A GAD
 * Quest level is never switched off either.
 *
 * @phpstan-type BadgeInput array{name: string, description: string, is_active: bool}
 */
final class ManageBadge
{
    /** Where uploaded pictures go, on the public disk. */
    private const IMAGES = 'badges';

    public function __construct(
        private readonly ActivityRecorder $activity,
        private readonly Notifier $notifier,
    ) {}

    /** @param BadgeInput $input */
    public function create(User $author, ?int $regionId, array $input, ?UploadedFile $image): Badge
    {
        $badge = Badge::query()->create([
            ...$input,
            'survey_region_id' => $regionId,
            'image_path' => $image?->store(self::IMAGES, 'public'),
            'created_by' => $author->id,
        ]);
        $this->activity->record(ActivityAction::Created, ActivityModule::Badges, $badge);

        return $badge;
    }

    /** @param BadgeInput $input */
    public function update(Badge $badge, ?int $regionId, array $input, ?UploadedFile $image, bool $removeImage): Badge
    {
        $previous = $badge->image_path;
        $path = match (true) {
            $image !== null => $image->store(self::IMAGES, 'public'),
            $removeImage => null,
            default => $previous,
        };

        $badge->update([
            ...$input,
            'is_active' => $badge->canBeSwitchedOff() ? $input['is_active'] : true,
            'image_path' => $path,
            // A system badge stays national.
            'survey_region_id' => $badge->isSystem() ? null : $regionId,
        ]);

        if ($previous !== null && $previous !== $path) {
            Storage::disk('public')->delete($previous);
        }

        $this->activity->recordSave(
            ActivityModule::Badges,
            $badge,
            except: ['image_path'],
            extra: $previous !== $path ? ['picture' => [$previous !== null ? __('A picture') : null, $path !== null ? __('A new picture') : null]] : [],
        );

        return $badge;
    }

    /** Switched off, nobody earns it or is awarded it; those who hold it keep it. */
    public function setActive(Badge $badge, bool $active): void
    {
        if (! $badge->canBeSwitchedOff()) {
            throw ValidationException::withMessages([
                'badge' => __('GAD Quest badges come with every finished quest, so they stay on.'),
            ]);
        }

        $badge->update(['is_active' => $active]);
        $this->activity->recordSave(ActivityModule::Badges, $badge);
    }

    /** A custom badge goes with its awards and its picture. */
    public function delete(Badge $badge): void
    {
        if ($badge->isSystem()) {
            throw ValidationException::withMessages([
                'badge' => $badge->quest_level !== null
                    ? __('GAD Quest badges come with every finished quest, so they cannot be deleted.')
                    : __('Badges earned by sharing GAD work cannot be deleted. Switch it off instead.'),
            ]);
        }

        $badge->delete();
        if ($badge->image_path !== null) {
            Storage::disk('public')->delete($badge->image_path);
        }
        $this->activity->record(ActivityAction::Deleted, ActivityModule::Badges, $badge);
    }

    public function award(Badge $badge, User $awarder, User $recipient, ?string $note): BadgeAward
    {
        $problem = match (true) {
            $badge->quest_level !== null => __('This badge is earned by finishing a GAD Quest, not awarded by hand.'),
            $badge->isSystem() => __('This badge is earned by sharing GAD work, not awarded by hand.'),
            ! $badge->is_active => __('Switch this badge on before awarding it.'),
            ! $recipient->isActive() => __(':name cannot sign in, so they cannot be awarded a badge.', ['name' => $recipient->name]),
            $badge->survey_region_id !== null && $recipient->regionId() !== $badge->survey_region_id => __('This badge is for :region only.', ['region' => $badge->region?->name]),
            $badge->awards()->where('user_id', $recipient->id)->exists() => __(':name already holds this badge.', ['name' => $recipient->name]),
            default => null,
        };

        if ($problem !== null) {
            throw ValidationException::withMessages(['user' => $problem]);
        }

        $award = $badge->awards()->create([
            'user_id' => $recipient->id,
            'awarded_by' => $awarder->id,
            'note' => $note,
            'awarded_at' => now(),
        ]);

        $entry = $this->activity->record(
            ActivityAction::Awarded,
            ActivityModule::Badges,
            $badge,
            properties: ['recipient' => $recipient->name],
            actor: $awarder,
            place: ActivitySubjects::place($recipient),
        );
        $this->notifier->badgeAwarded($recipient, $entry);

        return $award;
    }

    /** Only a badge awarded by hand can be taken back. */
    public function revoke(BadgeAward $award): void
    {
        $award->loadMissing(['badge', 'user']);

        if ($award->badge->isSystem()) {
            throw ValidationException::withMessages([
                'award' => __('Badges earned by sharing GAD work stay with the person who earned them.'),
            ]);
        }

        $award->delete();
        $this->activity->record(
            ActivityAction::Deleted,
            ActivityModule::Badges,
            $award->badge,
            properties: ['recipient' => $award->user->name],
            label: __(':badge, from :name', ['badge' => $award->badge->name, 'name' => $award->user->name]),
            place: ActivitySubjects::place($award->user),
        );
    }
}
