<?php

namespace App\Models;

use App\Traits\StoresUtcTimestamps;
use Illuminate\Database\Eloquent\Model;

class Vendor extends Model
{
    use StoresUtcTimestamps;

    protected $fillable = [
        'user_id',
        'name',
        'reference_code',
        'email',
        'phone',
        'contact_person',
        'status',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
