<?php

namespace App\Services\OrderService;

use App\Enums\OrderStatus;
use App\Exceptions\ServiceException;
use App\Jobs\SendOrderShippedNotificationJob;
use App\Models\Order;
use App\Models\User;
use App\Services\OrderService\Concerns\ManagesOrderOperations;
use App\Services\ShiprocketService\Authenticate as ShiprocketAuthenticate;
use App\Services\ShiprocketService\CreateAdhocOrder as ShiprocketCreateAdhocOrder;
use App\Services\ShiprocketService\GenerateLabel as ShiprocketGenerateLabel;

class ShipOrder
{
    use ManagesOrderOperations;

    public function __construct(
        private readonly ShiprocketAuthenticate $shiprocketAuthenticate,
        private readonly ShiprocketCreateAdhocOrder $shiprocketCreateAdhocOrder,
        private readonly ShiprocketGenerateLabel $shiprocketGenerateLabel,
    ) {
    }

    public function handle(Order $order, User $seller): Order
    {
        $order->loadMissing(['buyer', 'items.product']);

        if ($order->status !== OrderStatus::Processing) {
            throw ServiceException::badRequest('Only processing orders can be shipped');
        }

        $token = ($seller->shiprocket_email && $seller->shiprocket_password)
            ? $this->shiprocketAuthenticate->handle($seller->shiprocket_email, $seller->shiprocket_password)
            : null;

        $syncResult = $this->shiprocketCreateAdhocOrder->handle(
            $this->buildShipmentPayload($order, $seller),
            $token,
        );

        if (! ($syncResult['success'] ?? false)) {
            throw ServiceException::serverError('Failed to push order to Shiprocket.');
        }

        $awbCode = $syncResult['awb_code'] ?? null;
        $labelUrl = $this->shiprocketGenerateLabel->handle((string) ($syncResult['shipment_id'] ?? ''), $token);

        $order->update([
            'status' => OrderStatus::Shipped,
            'tracking_number' => $awbCode,
            'shipping_label_url' => $labelUrl,
            'tracking_url' => $awbCode ? 'https://www.shiprocket.in/tracking/' . $awbCode : null,
            'shipping_carrier' => 'Shiprocket',
        ]);

        SendOrderShippedNotificationJob::dispatch($order->id);

        return $order->load(['buyer', 'items.product']);
    }
}
