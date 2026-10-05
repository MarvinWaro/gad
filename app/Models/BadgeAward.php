<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A badge someone holds: earned by its rule, or, for a custom badge, awarded
 * by hand (`awarded_by`, with a note on what for). Once each.
 *
 * @property int $id
 * @property string $badge_id
 * @property int $user_id
 * @property int|null $awarded_by
 * @property string|null $note
 * @property CarbonImmutable $awarded_at
 */
#[Fillable(['badge_id', 'user_id', 'awarded_by', 'note', 'awarded_at'])]
class BadgeAward extends Model
{
    public $timestamps = false;

    protected function casts(): array
    {
        return ['awarded_at' => 'datetime'];
    }

    /** @return BelongsTo<Badge, $this> */
    public function badge(): BelongsTo
    {
        return $this->belongsTo(Badge::class);
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<User, $this> */
    public function awarder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'awarded_by');
    }
}
