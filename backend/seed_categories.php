<?php
use App\Models\Category;
use App\Models\User;
use Illuminate\Support\Str;

$seller = User::where('role', 'seller')->first();
if (!$seller) {
    $seller = User::first();
}

$categories = ['Sports & Fitness', 'Books & Media', 'Furniture & Decor'];

foreach ($categories as $name) {
    if (!Category::where('name', $name)->exists()) {
        Category::create([
            'user_id'   => $seller->id,
            'name'      => $name,
            'slug'      => Str::slug($name) . '-' . uniqid(),
            'parent_id' => null,
        ]);
        echo "Created: $name\n";
    } else {
        echo "Already exists: $name\n";
    }
}
echo "Done.\n";
