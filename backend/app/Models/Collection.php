<?php

namespace App\Models;

use App\Traits\StoresUtcTimestamps;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Collection extends Model
{
    use StoresUtcTimestamps;

    protected $fillable = [
        'user_id',
        'title',
        'handle',
        'description',
        'active',
        'type',
        'channels',
        'template',
        'image',
        'condition_mode',
        'conditions',
        'product_ids',
        'seo_title',
        'seo_description',
    ];

    protected $casts = [
        'active' => 'boolean',
        'channels' => 'array',
        'conditions' => 'array',
        'product_ids' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
