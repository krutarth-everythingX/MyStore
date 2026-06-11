<?php

namespace App\Http\Controllers\OrderController\Concerns;

use App\Exceptions\ServiceException;
use Illuminate\Http\Request;

trait InteractsWithResponses
{
    protected function serviceErrorResponse(Request $request, ServiceException $exception)
    {
        if ($request->header('X-Inertia')) {
            return back()->with('error', $exception->getMessage());
        }

        return response(['message' => $exception->getMessage()], $exception->statusCode());
    }

    protected function notFoundResponse(Request $request, string $message)
    {
        if ($request->header('X-Inertia')) {
            return back()->with('error', $message);
        }

        return response(['message' => $message], 404);
    }
}
