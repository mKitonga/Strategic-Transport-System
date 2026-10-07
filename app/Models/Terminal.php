<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Terminal extends Model
{
    use HasFactory;

    protected $fillable = [
        'route_id',
        'terminal_name'
    ];

    public function route()
    {
        return $this->belongsTo(Route::class);
    }

    public function faresFrom()
    {
        return $this->hasMany(Fare::class,'from_terminal_id');
    }

    public function faresTo()
    {
        return $this->hasMany(Fare::class,'to_terminal_id');
    }
}