<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Passenger extends Model
{
    use HasFactory;

    protected $fillable = [
        'driver_id',
        'name',
        'phone_number',
        'boarding_terminal_id',
        'alighting_terminal_id'
    ];

    public function driver()
    {
        return $this->belongsTo(User::class,'driver_id');
    }

    public function boardingTerminal()
    {
        return $this->belongsTo(Terminal::class,'boarding_terminal_id');
    }

    public function alightingTerminal()
    {
        return $this->belongsTo(Terminal::class,'alighting_terminal_id');
    }
}