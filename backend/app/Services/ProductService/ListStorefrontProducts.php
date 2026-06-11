<?php

namespace App\Services\ProductService;

use App\Services\ProductService\StorefrontQuery;
use Illuminate\Database\Eloquent\Collection;

class ListStorefrontProducts
{
    public function __construct(private readonly StorefrontQuery $storefrontQuery)
    {
    }

    public function handle(array $filters = []): Collection
    {
        return $this->storefrontQuery->handle($filters)->latest()->get();
    }
}
