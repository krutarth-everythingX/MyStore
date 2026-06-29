<?php

namespace App\Http\Controllers\CollectionController;

use App\Http\Controllers\Controller;
use App\Models\Collection;
use Illuminate\Http\Request;

class Destroy extends Controller
{
    public function __invoke(Request $request, int $id)
    {
        if ($request->user()->role !== 'seller' || ! seller_setup_complete($request->user())) {
            return response(['message' => 'Unauthorized'], 403);
        }

        $collection = Collection::query()
            ->where('user_id', $request->user()->id)
            ->where('id', $id)
            ->firstOrFail();

        $collection->delete();

        return response()->json(['message' => 'Collection deleted successfully.']);
    }
}
