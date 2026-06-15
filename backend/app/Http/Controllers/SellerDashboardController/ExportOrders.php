<?php

namespace App\Http\Controllers\SellerDashboardController;

use App\Http\Controllers\Controller;
use App\Services\SellerDashboardService\BuildOrderExportRows;
use Illuminate\Http\Request;

class ExportOrders extends Controller
{
    public function __construct(private readonly BuildOrderExportRows $buildOrderExportRows)
    {
    }

    public function __invoke(Request $request)
    {
        if ($request->user()->role !== 'seller' || ! seller_setup_complete($request->user())) {
            return response(['message' => 'Unauthorized. Sellers only.'], 403);
        }

        $rows = $this->buildOrderExportRows->handle($request->user()->id);
        $headers = [
            'Content-type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename=orders_export_' . date('Ymd_His') . '.csv',
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        $callback = function () use ($rows) {
            $file = fopen('php://output', 'w');
            fputcsv($file, [
                'Order ID', 'Buyer Name', 'Buyer Email', 'Order Date', 'Status',
                'Refund Status', 'Payment Method', 'Shipping Carrier', 'Tracking Number',
                'Shipping Address', 'Product SKU', 'Product Name', 'Quantity', 'Item Price', 'Subtotal',
            ]);

            foreach ($rows as $row) {
                fputcsv($file, $row);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
