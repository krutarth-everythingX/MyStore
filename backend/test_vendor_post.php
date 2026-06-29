<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$request = Illuminate\Http\Request::create('/api/vendors', 'POST', [
    'name' => 'Test Vendor',
    'reference_code' => 'TEST01'
]);
$user = App\Models\User::find(35);
$request->setUserResolver(function() use ($user) { return $user; });

$controller = new App\Http\Controllers\VendorController\Store();
$response = $controller($request);
echo $response->getContent();
