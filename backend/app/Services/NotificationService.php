<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;

class NotificationService
{
    /**
     * Send order invoice / confirmation to the buyer.
     */
    public function sendOrderPlacedNotification($order)
    {
        $buyer = $order->buyer;
        if (!$buyer) return;

        $subject = "Your MyStore Order Confirmation - Order #{$order->id}";
        $body = "Thank you for shopping at MyStore! Your order #{$order->id} has been received.\n\nTotal Amount: \${$order->total_amount}\nPayment Method: {$order->payment_method}\nShipping Address: {$order->shipping_address}\n\nWe will notify you once your package is shipped.";

        $this->sendEmail($buyer->email, $buyer->name, $subject, $body);

        if ($buyer->phone) {
            $smsText = "MyStore Order #{$order->id} placed successfully! Total: \${$order->total_amount}. Thank you!";
            $this->sendSMS($buyer->phone, $smsText);
        }
    }

    /**
     * Send shipping confirmation with tracking details to the buyer.
     */
    public function sendOrderShippedNotification($order)
    {
        $buyer = $order->buyer;
        if (!$buyer) return;

        $subject = "Your MyStore Order #{$order->id} Has Shipped!";
        $body = "Great news! Your order #{$order->id} has been shipped via {$order->shipping_carrier}.\n\nTracking Number: " . ($order->tracking_number ?: 'Awaiting tracking ID') . "\n\nYou can track the package status directly inside your MyStore orders history portal.";

        $this->sendEmail($buyer->email, $buyer->name, $subject, $body);

        if ($buyer->phone) {
            $smsText = "Your MyStore Order #{$order->id} has shipped via {$order->shipping_carrier}! Tracking: " . ($order->tracking_number ?: 'Awaiting ID');
            $this->sendSMS($buyer->phone, $smsText);
        }
    }

    /**
     * Send low stock warning alerts to the merchant/seller.
     */
    public function sendLowStockNotification($seller, $product)
    {
        $subject = "Inventory Alert: Low Stock Warning for '{$product->name}'";
        $body = "Warning: Product '{$product->name}' (SKU: {$product->sku}) has reached its low stock warning threshold.\n\nCurrent quantity: {$product->stock_quantity}\nLow Stock Threshold: {$product->low_stock_amount}\n\nPlease update your inventory coordinates to restore stock availability.";

        $this->sendEmail($seller->email, $seller->name, $subject, $body);

        if ($seller->phone) {
            $smsText = "Inventory Warning: '{$product->name}' is low in stock! Current Qty: {$product->stock_quantity}.";
            $this->sendSMS($seller->phone, $smsText);
        }
    }

    /**
     * Send email verification code to the registered user.
     */
    public function sendVerificationCode($user)
    {
        $subject = "Verify your MyStore account";
        $body = "Hi {$user->name},\n\nThank you for registering at MyStore! Your 6-digit email verification code is: {$user->verification_code}\n\nPlease enter this code on the verification screen to activate your account.";
        
        $this->sendEmail($user->email, $user->name, $subject, $body);
        
        if ($user->phone) {
            $smsText = "Your MyStore registration verification code is: {$user->verification_code}";
            $this->sendSMS($user->phone, $smsText);
        }
    }

    /**
     * Helper to send emails (SendGrid v3 API / local logging fallback).
     */
    private function sendEmail($toEmail, $toName, $subject, $body)
    {
        $sendgridKey = env('SENDGRID_API_KEY');

        if ($sendgridKey) {
            try {
                $response = Http::withToken($sendgridKey)
                    ->post('https://api.sendgrid.com/v3/mail/send', [
                        'personalizations' => [[
                            'to' => [['email' => $toEmail, 'name' => $toName]]
                        ]],
                        'from' => [
                            'email' => env('MAIL_FROM_ADDRESS', 'noreply@mystore.com'),
                            'name' => env('MAIL_FROM_NAME', 'MyStore Notifications')
                        ],
                        'subject' => $subject,
                        'content' => [[
                            'type' => 'text/plain',
                            'value' => $body
                        ]]
                    ]);

                if ($response->successful()) {
                    Log::info("SendGrid email sent successfully to {$toEmail}");
                    return true;
                }
                Log::error("SendGrid API returned error status: " . $response->status() . " - " . $response->body());
            } catch (\Exception $e) {
                Log::error("SendGrid API transmission failed: " . $e->getMessage());
            }
        }

        // Fallback local logging
        Log::info("=== MOCK EMAIL NOTIFICATION ===");
        Log::info("To: {$toName} <{$toEmail}>");
        Log::info("Subject: {$subject}");
        Log::info("Body: {$body}");
        Log::info("================================");
        return true;
    }

    /**
     * Helper to send SMS (Twilio REST API / local logging fallback).
     */
    private function sendSMS($toPhone, $messageText)
    {
        $twilioSid = env('TWILIO_SID');
        $twilioToken = env('TWILIO_AUTH_TOKEN');
        $twilioFrom = env('TWILIO_FROM');

        if ($twilioSid && $twilioToken && $twilioFrom) {
            try {
                $response = Http::withBasicAuth($twilioSid, $twilioToken)
                    ->asForm()
                    ->post("https://api.twilio.com/2010-04-01/Accounts/{$twilioSid}/Messages.json", [
                        'To' => $toPhone,
                        'From' => $twilioFrom,
                        'Body' => $messageText
                    ]);

                if ($response->successful()) {
                    Log::info("Twilio SMS sent successfully to {$toPhone}");
                    return true;
                }
                Log::error("Twilio SMS returned error status: " . $response->status() . " - " . $response->body());
            } catch (\Exception $e) {
                Log::error("Twilio SMS dispatch failed: " . $e->getMessage());
            }
        }

        // Fallback local logging
        Log::info("=== MOCK SMS NOTIFICATION ===");
        Log::info("To Phone: {$toPhone}");
        Log::info("Message: {$messageText}");
        Log::info("===============================");
        return true;
    }
}
