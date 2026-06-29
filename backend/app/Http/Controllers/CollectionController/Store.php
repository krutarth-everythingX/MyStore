<?php

namespace App\Http\Controllers\CollectionController;

use App\Http\Controllers\Controller;
use App\Models\Collection;
use Illuminate\Http\Request;

class Store extends Controller
{
    public function __invoke(Request $request)
    {
        if ($request->user()->role !== 'seller' || ! seller_setup_complete($request->user())) {
            return response(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'id' => 'nullable|integer',
            'title' => 'required|string|max:255',
            'handle' => 'required|string|max:255',
            'description' => 'nullable|string',
            'active' => 'boolean',
            'type' => 'required|in:manual,smart',
            'channels' => 'nullable|array',
            'channels.*' => 'string|max:120',
            'template' => 'required|string|max:120',
            'image' => 'nullable|string',
            'condition_mode' => 'required|in:all,any',
            'conditions' => 'nullable|array',
            'product_ids' => 'nullable|array',
            'product_ids.*' => 'integer',
            'seo_title' => 'nullable|string|max:255',
            'seo_description' => 'nullable|string',
        ]);

        $collection = Collection::query()
            ->where('user_id', $request->user()->id)
            ->when($validated['id'] ?? null, fn ($query, $id) => $query->where('id', $id))
            ->first();

        $payload = array_merge($validated, [
            'user_id' => $request->user()->id,
            'handle' => $this->uniqueHandle($request->user()->id, $validated['handle'], $collection?->id),
        ]);

        unset($payload['id']);

        $collection = $collection
            ? tap($collection)->update($payload)
            : Collection::create($payload);

        return response($collection->fresh(), 200);
    }

    private function uniqueHandle(int $userId, string $handle, ?int $ignoreId = null): string
    {
        $base = $handle;
        $candidate = $base;
        $count = 2;

        while (Collection::query()
            ->where('user_id', $userId)
            ->where('handle', $candidate)
            ->when($ignoreId, fn ($query) => $query->where('id', '!=', $ignoreId))
            ->exists()) {
            $candidate = "{$base}-{$count}";
            $count++;
        }

        return $candidate;
    }
}
