<?php

namespace App\Http\Controllers\SearchController;

use App\Http\Controllers\Controller;
use App\Services\ProductService\SearchSuggestions;
use Illuminate\Http\Request;

class Suggestions extends Controller
{
    public function __construct(private readonly SearchSuggestions $searchSuggestions)
    {
    }

    public function __invoke(Request $request)
    {
        $validated = $request->validate([
            'q' => ['nullable', 'string', 'max:120'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:12'],
        ]);

        return response([
            'data' => $this->searchSuggestions->handle(
                $validated['q'] ?? '',
                (int) ($validated['limit'] ?? 8),
            ),
        ]);
    }
}
