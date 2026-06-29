<?php

namespace App\Http\Controllers\PageController;

use App\Http\Controllers\Concerns\EnsuresRoles;
use App\Http\Controllers\Controller;
use App\Models\Collection;
use App\Models\Product;
use App\Services\BrandService\ListBrands;
use App\Services\CategoryService\ListCategories;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StorefrontCollection extends Controller
{
    use EnsuresRoles;

    public function __construct(
        private readonly ListCategories $listCategories,
        private readonly ListBrands $listBrands,
    ) {
    }

    public function __invoke(Request $request, string $handle)
    {
        $this->ensureStorefrontAccess($request);

        $collection = Collection::query()
            ->where('handle', $handle)
            ->where('active', true)
            ->firstOrFail();

        return Inertia::render('App', [
            'collection' => [
                'id' => $collection->id,
                'title' => $collection->title,
                'handle' => $collection->handle,
                'description' => $collection->description,
                'image' => $collection->image,
                'type' => $collection->type,
            ],
            'products' => $this->productsForCollection($collection),
            'categories' => $this->listCategories->handle(),
            'brands' => $this->listBrands->handle(),
        ]);
    }

    private function productsForCollection(Collection $collection)
    {
        $query = Product::with(['user', 'brand', 'categories', 'variations', 'warehouses'])
            ->where('status', 'published')
            ->where('type', '!=', 'variation');

        if ($collection->type === 'manual') {
            $ids = array_values(array_filter($collection->product_ids ?? []));

            if ($ids === []) {
                return collect();
            }

            return $query
                ->whereIn('id', $ids)
                ->orderByRaw('CASE id '.$this->manualOrderSql($ids).' END')
                ->get();
        }

        $conditions = $collection->conditions ?? [];
        $mode = $collection->condition_mode === 'all' ? 'where' : 'orWhere';

        $query->where(function (Builder $group) use ($conditions, $mode) {
            foreach ($conditions as $condition) {
                $this->applyCondition($group, $condition, $mode);
            }
        });

        return $query->latest('products.created_at')->take(48)->get();
    }

    private function manualOrderSql(array $ids): string
    {
        return collect($ids)
            ->values()
            ->map(fn ($id, $index) => 'WHEN '.((int) $id).' THEN '.$index)
            ->implode(' ');
    }

    private function applyCondition(Builder $query, array $condition, string $boolean): void
    {
        $field = strtolower((string) ($condition['field'] ?? ''));
        $operator = (string) ($condition['operator'] ?? 'contains');
        $value = trim((string) ($condition['value'] ?? ''));

        if ($value === '') {
            return;
        }

        $column = match ($field) {
            'product type' => 'product_type',
            'vendor' => 'manufacturer',
            'price' => 'regular_price',
            'tag' => 'tags',
            default => 'name',
        };

        if ($column === 'regular_price') {
            $comparison = match ($operator) {
                'greater_than' => '>',
                'less_than' => '<',
                default => '=',
            };
            $query->{$boolean}($column, $comparison, (float) $value);
            return;
        }

        $likeValue = match ($operator) {
            'equals' => $value,
            'starts_with' => "{$value}%",
            'ends_with' => "%{$value}",
            default => "%{$value}%",
        };
        $comparison = $operator === 'equals' ? '=' : 'like';

        $query->{$boolean}($column, $comparison, $likeValue);
    }
}
