<?php

namespace App\Services\AuthService;

use App\Jobs\DeleteUserAccountJob;
use App\Models\User;
use App\Notifications\AccountDeletionScheduledNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class RequestAccountDeletion
{
    public function handle(User $user, Request $request): RedirectResponse
    {
        $scheduledFor = now()->addDays(7)->utc();

        $user->forceFill([
            'account_deletion_requested_at' => now()->utc(),
            'account_deletion_scheduled_for' => $scheduledFor,
        ])->save();

        $user->notify(new AccountDeletionScheduledNotification($scheduledFor));

        DeleteUserAccountJob::dispatch($user->id, $scheduledFor->toIso8601String())
            ->delay($scheduledFor);

        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/login');
    }
}
