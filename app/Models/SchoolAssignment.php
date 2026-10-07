<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SchoolAssignment extends Model
{
    use HasFactory;

    protected $fillable = [
        'school_id',
        'driver_id',
        'route_id',
        'status'
    ];

    public function driver()
    {
        return $this->belongsTo(User::class,'driver_id');
    }

    public function route()
    {
        return $this->belongsTo(Route::class);
    }

    public function school()
    {
        return $this->belongsTo(School::class);
    }
}