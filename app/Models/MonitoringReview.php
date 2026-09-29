<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;

class MonitoringReview extends Model
{
    use HasUlids;

    protected $guarded = [];
}
