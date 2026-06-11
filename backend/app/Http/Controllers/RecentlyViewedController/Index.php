<?php

namespace App\Http\Controllers\RecentlyViewedController;

use App\Http\Controllers\Controller;
use App\Services\RecentlyViewedService\ListForUser;
use Illuminate\Http\Request;

class Index extends Controller
{
    public function __construct(private readonly ListForUser $listForUser)
    {
    }

    public function __invoke(Request $request)
    {
        return response($this->listForUser->handle($request->user()->id), 200);
    }
}
