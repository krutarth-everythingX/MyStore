<?php

namespace App\Listeners;

use App\Events\OrderPlaced;
use App\Jobs\SendOrderPlacedNotificationJob;

class SendOrderPlacedNotification
{
    public function handle(OrderPlaced $event): void
    {
        SendOrderPlacedNotificationJob::dispatch($event->order->id);
    }
}
