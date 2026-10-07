<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Complaint extends Model
{
    use HasFactory;

    protected $fillable = [
        'passenger_id',
        'sacco_name',
        'route_id',
        'complaint',
        'status'
    ];

    public function passenger()
    {
        return $this->belongsTo(User::class, 'passenger_id');
    }

    public function route()
    {
        return $this->belongsTo(Route::class);
    }
}