<?php

namespace App\Services\AuthService;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class Authenticate
{
    public function handle(array $fields): User
    {
        $user = User::where('email', $fields['email'])->first();

        if (! $user || ! Hash::check($fields['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Invalid credentials.'],
            ]);
        }

        if ($user->account_deletion_scheduled_for && $user->account_deletion_scheduled_for->isFuture()) {
            throw ValidationException::withMessages([
                'email' => ['This account is scheduled for deletion and cannot be accessed right now.'],
            ]);
        }

        return $user;
    }
}
