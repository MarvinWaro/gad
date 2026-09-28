<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * An anonymous answer to the homepage's "Rate PHLGADIS" button.
 *
 * @property string $id
 * @property int $rating 1 (needs improvement) to 5 (excellent)
 * @property string|null $suggestion
 * @property Carbon|null $created_at
 */
#[Fillable(['rating', 'suggestion'])]
class SiteRating extends Model
{
    use HasUlids;

    protected function casts(): array
    {
        return [
            'rating' => 'integer',
        ];
    }
}
