<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$user = App\Models\User::where('email', 'hybrid_seller@example.com')->first();
if ($user) {
    App\Models\Vendor::create(['user_id' => $user->id, 'name' => 'Acme Supplies', 'reference_code' => 'ACM-001', 'email' => 'contact@acme.com', 'phone' => '555-0100', 'contact_person' => 'John Doe']);
    App\Models\Vendor::create(['user_id' => $user->id, 'name' => 'Global Freight Logistics', 'reference_code' => 'GFL-092', 'email' => 'logistics@gfl.example.com', 'phone' => '555-0192', 'contact_person' => 'Jane Smith']);
    echo 'Vendors created';
} else {
    echo 'User not found';
}
