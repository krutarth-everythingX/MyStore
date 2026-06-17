<?php

namespace App\Http\Controllers\InertiaPageController;

use App\Http\Controllers\Controller;
use App\Services\BrandService\ListBrands;
use App\Services\CategoryService\ListCategories;
use App\Services\ProductService\SearchStorefrontProducts;
use App\Services\ProductService\Spellchecker;
use Illuminate\Http\Request;
use Inertia\Inertia;

class Home extends Controller
{
    public function __construct(
        private readonly SearchStorefrontProducts $searchStorefrontProducts,
        private readonly ListCategories $listCategories,
        private readonly ListBrands $listBrands,
    ) {
    }

    public function __invoke(Request $request)
    {
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

        $filters = $request->only([
            'category_id',
            'brand_id',
            'seller_id',
        ]);
        $filters['search'] = $search;

        $searchResult = $this->searchStorefrontProducts->handle($filters);

        return Inertia::render('Home', [
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
