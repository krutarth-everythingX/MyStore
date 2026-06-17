<?php

namespace App\Services\ProductService;

use Illuminate\Database\Eloquent\Collection;

class ListStorefrontProducts
{
    public function __construct(private readonly SearchStorefrontProducts $searchStorefrontProducts)
    {
    }

    public function handle(array $filters = []): Collection
    {
        return $this->searchStorefrontProducts->handle($filters)['products'];
    }
}
