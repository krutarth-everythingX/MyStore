<?php

namespace App\Traits;

use App\Models\User;
use DateTimeInterface;
use Illuminate\Support\Carbon;

trait StoresUtcTimestamps
{
    public function freshTimestamp(): Carbon
    {
        return now('UTC');
    }

    protected function serializeDate(DateTimeInterface $date): string
    {
        return Carbon::instance($date)->utc()->toJSON();
    }

    public function dateForUser(string $attribute, ?User $user = null, ?string $format = null): Carbon|string|null
    {
        return to_user_timezone($this->getAttribute($attribute), $user, $format);
    }
}
