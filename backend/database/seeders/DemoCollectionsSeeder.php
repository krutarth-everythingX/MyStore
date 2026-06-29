<?php

namespace Database\Seeders;

use App\Models\Collection;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DemoCollectionsSeeder extends Seeder
{
    public function run(): void
    {
        $sellers = User::query()
            ->whereIn('email', [
                'seller.auto@mystore.test',
                'seller.gaming@mystore.test',
                'seller.jewelry@mystore.test',
                'seller.health@mystore.test',
                'seller.office@mystore.test',
            ])
            ->where('role', 'seller')
            ->get();

        foreach ($sellers as $seller) {
            $products = Product::query()
                ->where('user_id', $seller->id)
                ->where('type', '!=', 'variation')
                ->orderBy('id')
                ->get()
                ->values();

            if ($products->isEmpty()) {
                continue;
            }

            $sellerSlug = Str::slug($seller->brand_name ?: $seller->name);

            $collections = [
                [
                    'title' => 'Signature Picks',
                    'handle' => $sellerSlug . '-signature-picks',
                    'description' => 'A best-of shelf featuring core products customers come back for every month.',
                    'active' => true,
                    'type' => 'manual',
                    'product_ids' => $products->take(4)->pluck('id')->all(),
                    'image' => '/demo-products/' . $sellerSlug . '-signature.svg',
                ],
                [
                    'title' => 'New This Month',
                    'handle' => $sellerSlug . '-new-this-month',
                    'description' => 'Fresh catalog additions and recently merchandised items ready for discovery.',
                    'active' => true,
                    'type' => 'smart',
                    'condition_mode' => 'any',
                    'conditions' => [
                        ['id' => 1, 'field' => 'Vendor', 'operator' => 'contains', 'value' => $seller->brand_name ?: $seller->name],
                        ['id' => 2, 'field' => 'Tag', 'operator' => 'contains', 'value' => $this->tagHintForSeller($seller->email)],
                    ],
                    'product_ids' => [],
                    'image' => '/demo-products/' . $sellerSlug . '-new.svg',
                ],
                [
                    'title' => 'Giftable Favorites',
                    'handle' => $sellerSlug . '-giftable-favorites',
                    'description' => 'Top gift-ready and premium picks for festive campaigns and high-intent buyers.',
                    'active' => true,
                    'type' => 'manual',
                    'product_ids' => $products->slice(4, 4)->pluck('id')->all(),
                    'image' => '/demo-products/' . $sellerSlug . '-giftable.svg',
                ],
                [
                    'title' => 'Campaign Preview',
                    'handle' => $sellerSlug . '-campaign-preview',
                    'description' => 'A staged merchandising collection used for seasonal planning and internal previews.',
                    'active' => false,
                    'type' => 'manual',
                    'product_ids' => $products->slice(8, 3)->pluck('id')->all(),
                    'image' => '/demo-products/' . $sellerSlug . '-campaign.svg',
                ],
            ];

            foreach ($collections as $collection) {
                Collection::query()->create(array_merge([
                    'user_id' => $seller->id,
                    'channels' => ['EverythingX', 'Marketplace Storefront'],
                    'template' => 'Product grid',
                    'condition_mode' => $collection['condition_mode'] ?? 'any',
                    'conditions' => $collection['conditions'] ?? [],
                    'seo_title' => ($seller->brand_name ?: $seller->name) . ' ' . $collection['title'],
                    'seo_description' => $collection['description'],
                ], $collection));
            }
        }
    }

    private function tagHintForSeller(string $email): string
    {
        return match ($email) {
            'seller.auto@mystore.test' => 'car',
            'seller.gaming@mystore.test' => 'gaming',
            'seller.jewelry@mystore.test' => 'jewelry',
            'seller.health@mystore.test' => 'health',
            'seller.office@mystore.test' => 'office',
            default => 'featured',
        };
    }
}
