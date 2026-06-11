<?php

namespace App\Http\Controllers\ProductController;

use App\Http\Controllers\Controller;
use App\Services\ProductService\ListStorefrontProducts;
use App\Services\ProductService\Spellchecker;
use Illuminate\Http\Request;

class Index extends Controller
{
    public function __construct(private readonly ListStorefrontProducts $listStorefrontProducts)
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
        ]);
        $filters['search'] = $search;

        return response(
            $this->listStorefrontProducts->handle($filters),
            200,
        );
    }
}
