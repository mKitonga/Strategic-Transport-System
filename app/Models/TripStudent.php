<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TripStudent extends Model
{
    use HasFactory;

    protected $fillable = [
        'school_trip_id',
        'student_id'
    ];
}
