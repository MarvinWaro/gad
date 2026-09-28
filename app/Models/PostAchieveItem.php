<?php

namespace App\Models;

use App\Enums\AchieveItem;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

/**
 * One A.C.H.I.E.V.E. Agenda item a post supports. Rows are only ever
 * created with their post and removed with it.
 *
 * @property string $post_id
 * @property AchieveItem $item
 */
#[Fillable(['item'])]
class PostAchieveItem extends Model
{
    public $incrementing = false;

    public $timestamps = false;

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'item' => AchieveItem::class,
        ];
    }
}
