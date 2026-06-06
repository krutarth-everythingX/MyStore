<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class MediaController extends Controller
{
    /**
     * Handle image files upload to AWS S3 (with local mock public disk fallback).
     */
    public function upload(Request $request)
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg,gif,webp,svg|max:2048',
        ]);

        $file = $request->file('image');

        // Check if AWS S3 environment credentials are set
        $s3Key = env('AWS_ACCESS_KEY_ID');
        $s3Secret = env('AWS_SECRET_ACCESS_KEY');
        $s3Bucket = env('AWS_BUCKET');

        if ($s3Key && $s3Secret && $s3Bucket) {
            try {
                // Upload to S3 product assets folder
                $path = Storage::disk('s3')->putFile('products', $file, 'public');
                $url = Storage::disk('s3')->url($path);

                return response([
                    'url' => $url,
                    'driver' => 's3',
                    'message' => 'Image successfully uploaded to Amazon S3 CDN'
                ], 200);
            } catch (\Exception $e) {
                Log::error("S3 Upload failed: " . $e->getMessage());
                // Fallback to local
            }
        }

        // Default local sandbox fallback
        try {
            $path = $file->store('products', 'public');
            $url = asset('storage/' . $path);

            return response([
                'url' => $url,
                'driver' => 'local',
                'message' => 'Image successfully uploaded to Local Public Sandbox Storage'
            ], 200);
        } catch (\Exception $e) {
            Log::error("Local upload failed: " . $e->getMessage());
            return response(['message' => 'Upload failed: ' . $e->getMessage()], 500);
        }
    }
}
