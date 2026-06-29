<?php

namespace App\Http\Controllers\PageController;

use App\Http\Controllers\Concerns\EnsuresRoles;
use App\Http\Controllers\Controller;
use App\Models\Collection;
use App\Services\BrandService\ListBrands;
use App\Services\CategoryService\ListCategories;
use App\Services\ProductService\SearchStorefrontProducts;
use App\Services\ProductService\Spellchecker;
use Illuminate\Http\Request;
use Inertia\Inertia;

class Home extends Controller
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
        $category = $request->query('category') ?: $request->query('category_id');

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
                'category_id' => $category,
            ]);

        return Inertia::render('App', [
            'products' => $searchResult['products'],
            'categories' => $this->listCategories->handle(),
            'brands' => $this->listBrands->handle(),
            'collections' => Collection::query()
                ->where('active', true)
                ->latest()
                ->take(8)
                ->get()
                ->map(fn (Collection $collection) => [
                    'id' => $collection->id,
                    'title' => $collection->title,
                    'handle' => $collection->handle,
                    'description' => $collection->description,
                    'image' => $collection->image,
                    'type' => $collection->type,
                    'product_count' => count($collection->product_ids ?? []),
                ]),
            'searchMeta' => $searchResult['meta'],
            'searchSuggestion' => [
                'original_search' => $originalSearch,
                'corrected_search' => $correctedSearch,
                'is_corrected' => $isCorrected,
            ],
        ]);
    }
}
