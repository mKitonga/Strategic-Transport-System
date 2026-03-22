<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SchoolTrip extends Model
{
    use HasFactory;

    protected $fillable = [
        'school_id',
        'route_id',
        'driver_id',
        'vehicle_registration',
        'status',
        'trip_date'
    ];

    public function school()
    {
        return $this->belongsTo(User::class, 'school_id');
    }

    public function route()
    {
        return $this->belongsTo(Route::class);
    }

    public function driver()
    {
        return $this->belongsTo(User::class, 'driver_id');
    }

    public function students()
    {
        return $this->belongsToMany(Student::class, 'trip_students', 'school_trip_id', 'student_id');
    }
}
