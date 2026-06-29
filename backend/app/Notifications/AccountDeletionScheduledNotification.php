<?php

namespace App\Notifications;

use Carbon\CarbonInterface;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AccountDeletionScheduledNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly CarbonInterface $scheduledFor,
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage())
            ->subject('Your MyStore account is scheduled for deletion')
            ->markdown('emails.account_deletion_scheduled', [
                'name' => $notifiable->name,
                'scheduledFor' => $this->scheduledFor->copy()->timezone(user_timezone($notifiable))->format('d F Y, h:i A'),
            ]);
    }
}
