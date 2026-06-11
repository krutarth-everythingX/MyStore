<?php

namespace App\Http\Controllers\InertiaPageController;

use App\Http\Controllers\Controller;
use App\Services\BrandService\ListBrands;
use App\Services\CategoryService\ListCategories;
use App\Services\ProductService\ListStorefrontProducts;
use App\Services\ProductService\Spellchecker;
use Illuminate\Http\Request;
use Inertia\Inertia;

class Home extends Controller
{
    public function __construct(
        private readonly ListStorefrontProducts $listStorefrontProducts,
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

        return Inertia::render('Home', [
            'products' => $this->listStorefrontProducts->handle($filters),
            'categories' => $this->listCategories->handle(),
            'brands' => $this->listBrands->handle(),
            'searchSuggestion' => [
                'original_search' => $originalSearch,
                'corrected_search' => $correctedSearch,
                'is_corrected' => $isCorrected,
            ],
        ]);
    }
}
