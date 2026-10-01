<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['start_year', 'label', 'is_active'])]
class AcademicYear extends Model
{
    use HasUlids;

    protected function casts(): array
    {
        return ['start_year' => 'integer', 'is_active' => 'boolean'];
    }
}
