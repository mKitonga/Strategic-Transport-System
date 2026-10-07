<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'driver_id',
        'passenger_name',
        'amount',
        'status'
    ];

    public function driver()
    {
        return $this->belongsTo(User::class,'driver_id');
    }
}