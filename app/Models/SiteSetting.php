<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

/**
 * A switch an admin page flips without a deploy, stored by key. A key that
 * was never saved reads as its default.
 *
 * @property string $key
 * @property mixed $value
 */
#[Fillable(['key', 'value'])]
class SiteSetting extends Model
{
    /** Whether the homepage shows the "Rate PHLGADIS" button. */
    public const RATING_BUTTON = 'rating_button_enabled';

    protected $primaryKey = 'key';

    protected $keyType = 'string';

    public $incrementing = false;

    protected function casts(): array
    {
        return [
            'value' => 'json',
        ];
    }

    public static function read(string $key, mixed $default = null): mixed
    {
        return static::query()->find($key)->value ?? $default;
    }

    public static function write(string $key, mixed $value): void
    {
        static::query()->updateOrCreate(['key' => $key], ['value' => $value]);
    }

    public static function ratingButtonEnabled(): bool
    {
        return (bool) static::read(self::RATING_BUTTON, true);
    }
}
