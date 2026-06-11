<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class WelcomeNotification extends Notification
{
    use Queueable;

    public function __construct()
    {
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $roleMessage = $notifiable->role === 'seller'
            ? "Your seller account is fully active! You can now access your merchant dashboard, create products, set up warehouses, and start selling."
            : "Your account is fully active! You can now explore thousands of curated products, manage your wishlist, and experience seamless shopping.";

        return (new MailMessage())
            ->subject('Welcome to MyStore!')
            ->markdown('emails.welcome', [
                'name' => $notifiable->name,
                'roleMessage' => $roleMessage,
                'url' => url('/'),
            ]);
    }
}
