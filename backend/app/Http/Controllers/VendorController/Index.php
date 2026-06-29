<?php

namespace App\Http\Controllers\VendorController;

use Illuminate\Http\Request;

class Index
{
    public function __invoke(Request $request)
    {
        \Log::info('VendorIndex hit by user: ' . optional($request->user())->id);
        return response()->json(
            $request->user()->vendors()->latest()->get()
        );
    }
}
