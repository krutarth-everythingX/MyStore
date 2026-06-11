<?php

namespace App\Http\Controllers\SellerDashboardController;

use App\Http\Controllers\Controller;
use App\Services\SellerDashboardService\BuildInventoryExportRows;
use Illuminate\Http\Request;

class ExportInventory extends Controller
{
    public function __construct(private readonly BuildInventoryExportRows $buildInventoryExportRows)
    {
    }

    public function __invoke(Request $request)
    {
        if ($request->user()->role !== 'seller') {
            return response(['message' => 'Unauthorized. Sellers only.'], 403);
        }

        $rows = $this->buildInventoryExportRows->handle($request->user()->id);
        $headers = [
            'Content-type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename=inventory_export_' . date('Ymd_His') . '.csv',
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        $callback = function () use ($rows) {
            $file = fopen('php://output', 'w');
            fputcsv($file, [
                'Product ID', 'SKU', 'Product Name', 'Brand', 'Categories',
                'Regular Price', 'Sale Price', 'Manage Stock', 'Stock Quantity',
                'Stock Status', 'Low Stock Amount', 'Warehouse Allocations',
            ]);

            foreach ($rows as $row) {
                fputcsv($file, $row);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
