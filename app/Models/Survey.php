<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $code
 * @property string $slug
 * @property string $title
 * @property string $law_title
 * @property string|null $image_path
 * @property string $status
 */
#[Fillable(['code', 'slug', 'title', 'law_title', 'image_path', 'status', 'created_by'])]
class Survey extends Model
{
    /** @return HasMany<SurveyVersion, $this> */
    public function versions(): HasMany
    {
        return $this->hasMany(SurveyVersion::class);
    }

    /** @return BelongsTo<User, $this> */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function draftVersion(): ?SurveyVersion
    {
        return $this->versions()->where('status', 'draft')->latest('version')->first();
    }

    public function publishedVersion(): ?SurveyVersion
    {
        return $this->versions()->where('status', 'published')->latest('version')->first();
    }
}
