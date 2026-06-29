<?php

namespace App\Http\Controllers\VendorController;

use Illuminate\Http\Request;

class Destroy
{
    public function __invoke(Request $request, $id)
    {
        $vendor = $request->user()->vendors()->findOrFail($id);
        $vendor->delete();

        return response()->json(['message' => 'Vendor deleted successfully']);
    }
}
