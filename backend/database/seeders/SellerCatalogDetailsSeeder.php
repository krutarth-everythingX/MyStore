<?php

namespace Database\Seeders;

use App\Models\Attribute;
use App\Models\Brand;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class SellerCatalogDetailsSeeder extends Seeder
{
    public function run(): void
    {
        $sellers = User::query()
            ->whereIn('email', array_keys($this->sellerProfiles()))
            ->where('role', 'seller')
            ->get()
            ->keyBy('email');

        foreach ($this->sellerProfiles() as $email => $profile) {
            /** @var User|null $seller */
            $seller = $sellers->get($email);

            if (! $seller) {
                continue;
            }

            $this->seedBrands($seller, $profile['brands']);
            $this->seedAttributes($seller, $profile['attributes']);
        }
    }

    private function seedBrands(User $seller, array $brandNames): void
    {
        $primaryBrand = Brand::query()->firstOrCreate(
            ['user_id' => $seller->id, 'name' => $seller->brand_name ?: $seller->name],
            [
                'slug' => Str::slug(($seller->brand_name ?: $seller->name) . '-' . $seller->id),
                'website_url' => 'https://' . Str::slug($seller->brand_name ?: $seller->name) . '.example.com',
            ],
        );

        $primaryBrand->update([
            'website_url' => 'https://' . Str::slug($primaryBrand->name) . '.example.com',
        ]);

        $brands = collect([$primaryBrand]);

        foreach ($brandNames as $index => $brandName) {
            $brands->push(Brand::query()->create([
                'user_id' => $seller->id,
                'name' => $brandName,
                'slug' => Str::slug($brandName . '-' . $seller->id . '-' . $index),
                'website_url' => 'https://' . Str::slug($brandName) . '.example.com',
            ]));
        }

        $sellerProducts = Product::query()
            ->where('user_id', $seller->id)
            ->where('type', '!=', 'variation')
            ->orderBy('id')
            ->get()
            ->values();

        foreach ($sellerProducts as $index => $product) {
            $brand = $brands->get($index % $brands->count());
            $product->update(['brand_id' => $brand->id]);
        }
    }

    private function seedAttributes(User $seller, array $attributes): void
    {
        foreach ($attributes as $attribute) {
            Attribute::query()->create([
                'user_id' => $seller->id,
                'name' => $attribute['name'],
                'applies_to' => $attribute['applies_to'],
                'input_type' => $attribute['input_type'],
                'options' => $attribute['options'],
                'is_required' => $attribute['is_required'],
                'is_active' => true,
            ]);
        }
    }

    private function sellerProfiles(): array
    {
        return [
            'seller.auto@mystore.test' => [
                'brands' => ['RoadShield', 'TorqueLab'],
                'attributes' => [
                    $this->attribute('Vehicle Type', ['Hatchback', 'Sedan', 'SUV', 'Bike'], true),
                    $this->attribute('Finish', ['Matte', 'Gloss', 'Carbon Texture']),
                    $this->attribute('Power Source', ['USB', '12V Socket', 'Battery Powered']),
                    $this->attribute('Pack Size', ['Single', 'Pack of 2', 'Pack of 4']),
                    $this->attribute('Warranty', ['6 Months', '12 Months', '24 Months']),
                    $this->attribute('Installation Support', ['Basic Fitment', 'Professional Fitment'], false, 'service'),
                ],
            ],
            'seller.gaming@mystore.test' => [
                'brands' => ['PixelRaid', 'StreamCore'],
                'attributes' => [
                    $this->attribute('Platform', ['PC', 'PlayStation', 'Xbox', 'Universal'], true),
                    $this->attribute('Connectivity', ['Wired', '2.4 GHz Wireless', 'Bluetooth']),
                    $this->attribute('Switch Type', ['Red', 'Brown', 'Blue', 'Membrane']),
                    $this->attribute('Edition', ['Standard', 'Creator', 'Tournament']),
                    $this->attribute('Colorway', ['Black', 'White', 'RGB Accent']),
                    $this->attribute('Setup Support', ['Self Setup', 'Remote Setup'], false, 'service'),
                ],
            ],
            'seller.jewelry@mystore.test' => [
                'brands' => ['Aurielle', 'LunaCraft'],
                'attributes' => [
                    $this->attribute('Material', ['Sterling Silver', 'Rose Gold Finish', 'Alloy', 'Pearl Accent'], true),
                    $this->attribute('Occasion', ['Everyday', 'Workwear', 'Festive', 'Gift']),
                    $this->attribute('Closure Type', ['Hook', 'Stud', 'Clasp', 'Buckle']),
                    $this->attribute('Color Family', ['Gold', 'Silver', 'Rose Gold', 'Pearl White']),
                    $this->attribute('Collection Line', ['Signature', 'Classic', 'Evening Edit']),
                    $this->attribute('Gift Wrapping', ['Standard Wrap', 'Premium Gift Box'], false, 'service'),
                ],
            ],
            'seller.health@mystore.test' => [
                'brands' => ['VitaRoot', 'CareMetric'],
                'attributes' => [
                    $this->attribute('Flavor', ['Chocolate', 'Vanilla', 'Mint', 'Natural']),
                    $this->attribute('Dosage Form', ['Powder', 'Tablet', 'Capsule', 'Liquid'], true),
                    $this->attribute('Usage Time', ['Morning', 'Anytime', 'Night']),
                    $this->attribute('Pack Size', ['30 Count', '60 Count', '90 Count', '1 kg']),
                    $this->attribute('Age Group', ['Adults', '18+', 'Unisex']),
                    $this->attribute('Consultation Add-on', ['Diet Plan', 'Usage Guidance'], false, 'service'),
                ],
            ],
            'seller.office@mystore.test' => [
                'brands' => ['DeskNest', 'PowerBridge'],
                'attributes' => [
                    $this->attribute('Connectivity', ['USB-C', 'Wireless', 'Bluetooth', 'HDMI'], true),
                    $this->attribute('Paper Size', ['A4', 'A5', 'Letter', 'Universal']),
                    $this->attribute('Pack Size', ['Single', 'Pack of 5', 'Pack of 12', 'Pack of 100']),
                    $this->attribute('Power Output', ['45W', '65W', 'Standard']),
                    $this->attribute('Workspace Type', ['Home Office', 'Hybrid Desk', 'Corporate Desk']),
                    $this->attribute('Installation Support', ['On-site Setup', 'Remote Guide'], false, 'service'),
                ],
            ],
        ];
    }

    private function attribute(
        string $name,
        array $options,
        bool $isRequired = false,
        string $appliesTo = 'product',
        string $inputType = 'dropdown',
    ): array {
        return [
            'name' => $name,
            'options' => $options,
            'is_required' => $isRequired,
            'applies_to' => $appliesTo,
            'input_type' => $inputType,
        ];
    }
}
