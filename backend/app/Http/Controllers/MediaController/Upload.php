<?php

namespace App\Http\Controllers\MediaController;

use App\Exceptions\ServiceException;
use App\Http\Controllers\Controller;
use App\Services\MediaService\UploadImage;
use Illuminate\Http\Request;

class Upload extends Controller
{
    public function __construct(private readonly UploadImage $uploadImage)
    {
    }

    public function __invoke(Request $request)
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg,gif,webp,svg|max:2048',
        ]);

        try {
            return response(
                $this->uploadImage->handle($request->file('image')),
                200,
            );
        } catch (ServiceException $exception) {
            return response(['message' => $exception->getMessage()], $exception->statusCode());
        }
    }
}
