<?php

namespace App\Services\MediaService;

use App\Exceptions\ServiceException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class UploadImage
{
    public function handle(UploadedFile $file): array
    {
        $s3Key = env('AWS_ACCESS_KEY_ID');
        $s3Secret = env('AWS_SECRET_ACCESS_KEY');
        $s3Bucket = env('AWS_BUCKET');

        if ($s3Key && $s3Secret && $s3Bucket) {
            try {
                $path = Storage::disk('s3')->putFile('products', $file, 'public');
                $url = Storage::disk('s3')->url($path);

                return [
                    'url' => $url,
                    'driver' => 's3',
                    'message' => 'Image successfully uploaded to Amazon S3 CDN',
                ];
            } catch (\Exception $exception) {
                Log::error('S3 Upload failed: ' . $exception->getMessage());
            }
        }

        try {
            $path = $file->store('products', 'public');

            return [
                'url' => asset('storage/' . $path),
                'driver' => 'local',
                'message' => 'Image successfully uploaded to Local Public Sandbox Storage',
            ];
        } catch (\Exception $exception) {
            Log::error('Local upload failed: ' . $exception->getMessage());

            throw ServiceException::serverError('Upload failed: ' . $exception->getMessage());
        }
    }
}
