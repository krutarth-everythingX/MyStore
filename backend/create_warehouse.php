<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$user = App\Models\User::find(35);
if ($user) {
    $user->warehouses()->create([
        'name' => 'Primary Distribution Center',
        'code' => 'DC-01',
        'address' => '123 Logistics Way, Fulfillment City'
    ]);
}
