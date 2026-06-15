<?php

namespace App\Http\Controllers\ReviewController;

use App\Exceptions\ServiceException;
use App\Http\Controllers\Concerns\EnsuresRoles;
use App\Http\Controllers\Controller;
use App\Services\ReviewService\CreateReview;
use Illuminate\Http\Request;

class Store extends Controller
{
    use EnsuresRoles;

    public function __construct(private readonly CreateReview $createReview)
    {
    }

    public function __invoke(Request $request, int $productId)
    {
        $this->ensureBuyer($request);

        try {
            $review = $this->createReview->handle(
                $productId,
                $request->user(),
                $request->validate([
                    'rating' => 'required|integer|min:1|max:5',
                    'comment' => 'nullable|string|max:1000',
                ]),
            );
        } catch (ServiceException $exception) {
            if ($request->header('X-Inertia')) {
                return back()->with('error', $exception->getMessage());
            }

            return response(['message' => $exception->getMessage()], $exception->statusCode());
        }

        if ($request->header('X-Inertia')) {
            return back()->with('success', 'Review submitted successfully!');
        }

        return response($review, 201);
    }
}
