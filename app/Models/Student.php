<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Student extends Model
{
    use HasFactory;

    protected $fillable = [
        'parent_id',
        'school_id',
        'name',
        'grade'
    ];

    public function parent()
    {
        return $this->belongsTo(User::class, 'parent_id');
    }

    public function school()
    {
        return $this->belongsTo(User::class, 'school_id');
    }

    public function trips()
    {
        return $this->belongsToMany(SchoolTrip::class, 'trip_students', 'student_id', 'school_trip_id');
    }
}
