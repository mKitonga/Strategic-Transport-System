<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DriverArrival extends Model
{
    use HasFactory;

    protected $fillable = [
        'driver_id',
        'terminal_id',
        'queue_number',
        'status'
    ];

    public function driver()
    {
        return $this->belongsTo(User::class,'driver_id');
    }

    public function terminal()
    {
        return $this->belongsTo(Terminal::class);
    }
}