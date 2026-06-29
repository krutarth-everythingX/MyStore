<?php

namespace App\Http\Controllers\ProductController;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Services\ProductService\CreateProduct;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use RuntimeException;

class Import extends Controller
{
    public function __construct(
        private readonly CreateProduct $createProduct,
    ) {
    }

    public function __invoke(Request $request)
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:csv,txt', 'max:10240'],
        ]);

        $seller = $request->user();
        abort_unless($seller?->role === 'seller', 403);

        $file = fopen($request->file('file')->getRealPath(), 'r');

        if ($file === false) {
            return back()->withErrors(['file' => 'The uploaded CSV file could not be read.']);
        }

        $header = fgetcsv($file);

        if (! is_array($header) || $header === []) {
            fclose($file);
            return back()->withErrors(['file' => 'The CSV file is empty or invalid.']);
        }

        $normalizedHeader = array_map(fn ($value) => Str::of((string) $value)->trim()->lower()->value(), $header);

        foreach (['product name', 'price'] as $requiredColumn) {
            if (! in_array($requiredColumn, $normalizedHeader, true)) {
                fclose($file);
                return back()->withErrors(['file' => "Missing required column: {$requiredColumn}."]);
            }
        }

        $imported = 0;
        $rowNumber = 1;

        while (($row = fgetcsv($file)) !== false) {
            $rowNumber++;

            if ($row === [null] || count(array_filter($row, fn ($value) => filled($value))) === 0) {
                continue;
            }

            $record = [];
            foreach ($normalizedHeader as $index => $column) {
                $record[$column] = isset($row[$index]) ? trim((string) $row[$index]) : '';
            }

            $validator = Validator::make($record, [
                'product name' => ['required', 'string'],
                'price' => ['required', 'numeric'],
            ]);

            if ($validator->fails()) {
              fclose($file);
              return back()->withErrors([
                  'file' => "Row {$rowNumber}: " . Arr::first($validator->errors()->all()),
              ]);
            }

            try {
                $categoryIds = $this->resolveCategoryIds($seller, $record);

                $this->createProduct->handle([
                    'name' => $record['product name'],
                    'description' => $record['description'] ?? null,
                    'regular_price' => (float) $record['price'],
                    'sale_price' => filled($record['cost'] ?? null) ? (float) $record['cost'] : null,
                    'sku' => $record['product code'] ?: ($record['sku'] ?: null),
                    'mystore_product_id' => $record['product code'] ?: null,
                    'status' => $this->mapStatus($record['status'] ?? ''),
                    'type' => 'simple',
                    'manage_stock' => filled($record['opening stock'] ?? null),
                    'stock_quantity' => filled($record['opening stock'] ?? null) ? (int) $record['opening stock'] : 0,
                    'unit_cost' => filled($record['cost'] ?? null) ? (float) $record['cost'] : null,
                    'categories' => $categoryIds,
                    'new_category_name' => null,
                    'manufacturer' => $record['brand'] ?? null,
                    'tags' => filled($record['tax type'] ?? null) ? [$record['tax type']] : [],
                ], $seller);
            } catch (RuntimeException $exception) {
                fclose($file);
                return back()->withErrors([
                    'file' => "Row {$rowNumber}: {$exception->getMessage()}",
                ]);
            } catch (\Throwable $exception) {
                fclose($file);
                return back()->withErrors([
                    'file' => "Row {$rowNumber}: import failed.",
                ]);
            }

            $imported++;
        }

        fclose($file);

        return redirect('/seller/products')->with('success', "{$imported} product(s) imported successfully.");
    }

    private function resolveCategoryIds($seller, array $record): array
    {
        $names = array_filter([
            $record['category'] ?? null,
            $record['sub category'] ?? null,
        ], fn ($value) => filled($value));

        if ($names === []) {
            return [];
        }

        $ids = [];

        foreach ($names as $name) {
            $category = Category::firstOrCreate(
                [
                    'user_id' => $seller->id,
                    'name' => $name,
                ],
                [
                    'slug' => Str::slug($name) . '-' . Str::lower(Str::random(6)),
                ],
            );

            $ids[] = $category->id;
        }

        return array_values(array_unique($ids));
    }

    private function mapStatus(string $value): string
    {
        return match (Str::lower(trim($value))) {
            'inactive', 'draft' => 'draft',
            'pending' => 'pending',
            default => 'published',
        };
    }
}
