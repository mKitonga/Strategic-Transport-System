<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Support\Facades\Hash;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'full_names',
        'phone_number',
        'email',
        'password',
        'role',
        'sacco_name',
        'route_name',
        'number_plate',
        'matatu_name',
        'school_name',
        'school_location',
        'student_name',
        'grade',
        'admission_number',
        'approved'
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
    ];

    /**
     * Automatically hash password before saving.
     */
    public function setPasswordAttribute($password)
    {
        if (!empty($password) && Hash::needsRehash($password)) {
            $this->attributes['password'] = Hash::make($password);
        } else {
            $this->attributes['password'] = $password;
        }
    }
}