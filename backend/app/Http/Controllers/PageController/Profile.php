<?php

namespace App\Http\Controllers\PageController;

use App\Http\Controllers\Controller;
use App\Services\OrderService\ListBuyerOrders;
use App\Services\RecentlyViewedService\ListForUser;
use Illuminate\Http\Request;
use Inertia\Inertia;

class Profile extends Controller
{
    public function __construct(
        private readonly ListBuyerOrders $listBuyerOrders,
        private readonly ListForUser $listForUser,
    ) {
    }

    public function __invoke(Request $request)
    {
        $user = $request->user();

        return Inertia::render('App', [
            'buyerOrders' => $user?->role === 'buyer'
                ? $this->listBuyerOrders->handle($user->id)
                : [],
            'recentlyViewed' => $user?->role === 'buyer'
                ? $this->listForUser->handle($user->id)
                : [],
        ]);
    }
}
