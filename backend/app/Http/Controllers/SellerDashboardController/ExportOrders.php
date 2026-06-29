<?php

namespace App\Http\Controllers\SellerDashboardController;

use App\Http\Controllers\Controller;
use App\Services\SellerDashboardService\BuildOrderExportRows;
use App\Support\SpreadsheetMlExport;
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
        $headings = $this->buildOrderExportRows->headings();
        $format = strtolower((string) $request->query('format', 'csv'));

        if ($format === 'excel' || $format === 'xlsx') {
            $headers = [
                'Content-type' => 'application/vnd.ms-excel; charset=UTF-8',
                'Content-Disposition' => 'attachment; filename=orders_export_' . date('Ymd_His') . '.xls',
                'Pragma' => 'no-cache',
                'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
                'Expires' => '0',
            ];

            $callback = function () use ($headings, $rows) {
                echo "\xEF\xBB\xBF";
                echo SpreadsheetMlExport::build($headings, $rows, 'Orders');
            };

            return response()->stream($callback, 200, $headers);
        }

        $headers = [
            'Content-type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename=orders_export_' . date('Ymd_His') . '.csv',
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        $callback = function () use ($headings, $rows) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $headings);

            foreach ($rows as $row) {
                fputcsv($file, $row);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
