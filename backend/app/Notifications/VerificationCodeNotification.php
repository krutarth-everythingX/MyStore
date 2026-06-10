<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class VerificationCodeNotification extends Notification
{
    use Queueable;

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage())
            ->subject('Verify your MyStore account')
            ->greeting("Hi {$notifiable->name},")
            ->line("Thank you for registering at MyStore! Your 6-digit email verification code is: {$notifiable->verification_code}")
            ->line('Please enter this code on the verification screen to activate your account.');
    }
}
