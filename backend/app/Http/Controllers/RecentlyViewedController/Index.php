<?php

namespace App\Http\Controllers\RecentlyViewedController;

use App\Http\Controllers\Concerns\EnsuresRoles;
use App\Http\Controllers\Controller;
use App\Services\RecentlyViewedService\ListForUser;
use Illuminate\Http\Request;

class Index extends Controller
{
    use EnsuresRoles;

    public function __construct(private readonly ListForUser $listForUser)
    {
    }

    public function __invoke(Request $request)
    {
        $this->ensureBuyer($request);

        return response($this->listForUser->handle($request->user()->id), 200);
    }
}
