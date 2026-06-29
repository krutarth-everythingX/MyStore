<?php

namespace App\Jobs;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class DeleteUserAccountJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public readonly int $userId,
        public readonly string $scheduledFor,
    ) {
    }

    public function handle(): void
    {
        $user = User::find($this->userId);

        if (! $user) {
            return;
        }

        if (! $user->account_deletion_scheduled_for) {
            return;
        }

        if ($user->account_deletion_scheduled_for->toIso8601String() !== $this->scheduledFor) {
            return;
        }

        if ($user->account_deletion_scheduled_for->isFuture()) {
            return;
        }

        $user->delete();
    }
}
