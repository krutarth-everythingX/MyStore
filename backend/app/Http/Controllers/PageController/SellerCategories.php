<?php

namespace App\Http\Controllers\PageController;

use App\Http\Controllers\Concerns\EnsuresRoles;
use App\Http\Controllers\Controller;
use App\Services\CategoryService\ListCategories;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SellerCategories extends Controller
{
    use EnsuresRoles;

    public function __construct(private readonly ListCategories $listCategories)
    {
    }

    public function __invoke(Request $request)
    {
        $this->ensureSeller($request);

        return Inertia::render('App', [
            'categories' => $this->listCategories->handle($request->user()->id),
        ]);
    }
}
