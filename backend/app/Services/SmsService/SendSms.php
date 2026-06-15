<?php

namespace App\Services\SmsService;

use Illuminate\Support\Facades\Log;

class SendSms
{
    public function handle(string $to, string $message): void
    {
        Log::info('Phone verification SMS code generated.', [
            'to' => $to,
            'message' => $message,
        ]);
    }
}
