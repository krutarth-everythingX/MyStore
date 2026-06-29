<?php

namespace App\Http\Controllers\AuthController;

use App\Http\Controllers\Controller;
use App\Services\AuthService\RequestAccountDeletion as RequestAccountDeletionService;
use Illuminate\Http\Request;

class RequestAccountDeletion extends Controller
{
    public function __construct(
        private readonly RequestAccountDeletionService $requestAccountDeletionService,
    ) {
    }

    public function __invoke(Request $request)
    {
        $result = $this->requestAccountDeletionService->handle($request->user(), $request);

        return $result->with('success', 'You have been logged out. Your account is scheduled for deletion in 7 days, and a confirmation email has been sent.');
    }
}
