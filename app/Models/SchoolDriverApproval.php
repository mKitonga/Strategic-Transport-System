<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SchoolDriverApproval extends Model
{
    use HasFactory;

    protected $fillable = [
        'driver_id',
        'school_id',
        'status'
    ];

    public function driver()
    {
        return $this->belongsTo(User::class, 'driver_id');
    }

    public function school()
    {
        return $this->belongsTo(User::class, 'school_id');
    }
}
