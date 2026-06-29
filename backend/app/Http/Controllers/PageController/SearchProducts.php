<?php

namespace App\Http\Controllers\PageController;

use App\Http\Controllers\Concerns\EnsuresRoles;
use App\Http\Controllers\Controller;
use App\Services\BrandService\ListBrands;
use App\Services\CategoryService\ListCategories;
use App\Services\ProductService\SearchStorefrontProducts;
use App\Services\ProductService\Spellchecker;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SearchProducts extends Controller
{
    use EnsuresRoles;

    public function __construct(
        private readonly SearchStorefrontProducts $searchStorefrontProducts,
        private readonly ListCategories $listCategories,
        private readonly ListBrands $listBrands,
    ) {
    }

    public function __invoke(Request $request)
    {
        $this->ensureStorefrontAccess($request);

        $search = $request->query('search');
        $spellcheck = $request->query('spellcheck', '1') !== '0';

        $correctedSearch = null;
        $originalSearch = null;
        $isCorrected = false;

        if ($search && $spellcheck) {
            $spellchecker = app(Spellchecker::class);
            $suggestion = $spellchecker->getSuggestion($search);
            if ($suggestion['is_corrected']) {
                $originalSearch = $suggestion['original'];
                $correctedSearch = $suggestion['corrected'];
                $isCorrected = true;
                $search = $correctedSearch;
            }
        }

        $searchResult = $this->searchStorefrontProducts->handle([
            'search' => $search,
            'category_id' => $request->query('category_id'),
            'brand_id' => $request->query('brand_id'),
            'stock_status' => $request->query('stock_status'),
            'min_price' => $request->query('min_price'),
            'max_price' => $request->query('max_price'),
            'in_stock' => $request->boolean('in_stock'),
            'sort' => $request->query('sort', 'latest'),
        ]);

        return Inertia::render('App', [
            'products' => $searchResult['products'],
            'categories' => $this->listCategories->handle(),
            'brands' => $this->listBrands->handle(),
            'searchMeta' => $searchResult['meta'],
            'searchSuggestion' => [
                'original_search' => $originalSearch,
                'corrected_search' => $correctedSearch,
                'is_corrected' => $isCorrected,
            ],
        ]);
    }
}
