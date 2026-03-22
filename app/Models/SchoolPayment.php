<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SchoolPayment extends Model
{
    use HasFactory;

    protected $fillable = [
        'parent_id',
        'school_trip_id',
        'amount',
        'status'
    ];

    public function parent()
    {
        return $this->belongsTo(User::class, 'parent_id');
    }

    public function trip()
    {
        return $this->belongsTo(SchoolTrip::class, 'school_trip_id');
    }
}
