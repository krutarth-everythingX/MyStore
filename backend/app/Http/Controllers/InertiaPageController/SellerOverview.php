<?php

namespace App\Http\Controllers\InertiaPageController;

use App\Http\Controllers\Concerns\EnsuresRoles;
use App\Http\Controllers\Controller;
use App\Services\SellerDashboardService\StatsForSeller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SellerOverview extends Controller
{
    use EnsuresRoles;

    public function __construct(private readonly StatsForSeller $statsForSeller)
    {
    }

    public function __invoke(Request $request)
    {
        $this->ensureSeller($request);

        return Inertia::render('SellerOverview', [
            'stats' => $this->statsForSeller->handle($request->user()->id),
        ]);
    }
}
