<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Fare extends Model
{
    use HasFactory;

    protected $fillable = [
        'route_id',
        'from_terminal_id',
        'to_terminal_id',
        'peak_fare',
        'off_peak_fare'
    ];

    public function route()
    {
        return $this->belongsTo(Route::class);
    }

    public function fromTerminal()
    {
        return $this->belongsTo(Terminal::class,'from_terminal_id');
    }

    public function toTerminal()
    {
        return $this->belongsTo(Terminal::class,'to_terminal_id');
    }
}