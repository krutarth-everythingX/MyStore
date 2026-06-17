<?php

namespace App\Http\Controllers\ProductController;

use App\Http\Controllers\Controller;
use App\Services\ProductService\SearchStorefrontProducts;
use App\Services\ProductService\Spellchecker;
use Illuminate\Http\Request;

class Index extends Controller
{
    public function __construct(private readonly SearchStorefrontProducts $searchStorefrontProducts)
    {
    }

    public function __invoke(Request $request)
    {
        $search = $request->query('search');
        $spellcheck = $request->query('spellcheck', '1') !== '0';

        if ($search && $spellcheck) {
            $spellchecker = app(Spellchecker::class);
            $suggestion = $spellchecker->getSuggestion($search);
            if ($suggestion['is_corrected']) {
                $search = $suggestion['corrected'];
            }
        }

        $filters = $request->only([
            'category_id',
            'brand_id',
            'seller_id',
            'stock_status',
            'min_price',
            'max_price',
            'in_stock',
            'only_in_stock',
            'sort',
        ]);
        $filters['search'] = $search;
        $result = $this->searchStorefrontProducts->handle($filters, (int) $request->integer('limit', config('search.defaults.limit')));

        return response([
            'data' => $result['products'],
            'meta' => $result['meta'],
        ], 200);
    }
}
