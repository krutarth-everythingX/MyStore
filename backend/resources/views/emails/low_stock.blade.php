@component('mail::message')
# Hi {{ $name }},

This is an automatic notification to alert you that the following product has fallen below its warning threshold:

@component('mail::panel')
📦 **Product:** {{ $productName }}  
🏷️ **SKU:** {{ $sku }}  
⚠️ **Current Quantity:** {{ $stockQuantity }} (Threshold: {{ $lowStockAmount }})
@endcomponent

@component('mail::button', ['url' => $url, 'color' => 'error'])
Manage Inventory & Restock
@endcomponent

Please update your inventory stock to avoid running out and losing prospective sales.

Thanks,<br>
{{ config('app.name') }}
@endcomponent
