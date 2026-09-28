<?php

namespace App\Models;

use App\Enums\SustainableDevelopmentGoal;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

/**
 * One Sustainable Development Goal a post supports. Rows are only ever
 * created with their post and removed with it.
 *
 * @property string $post_id
 * @property SustainableDevelopmentGoal $sdg
 */
#[Fillable(['sdg'])]
class PostSdg extends Model
{
    public $incrementing = false;

    public $timestamps = false;

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'sdg' => SustainableDevelopmentGoal::class,
        ];
    }
}
