<?php

namespace App\Http\Controllers;

use App\Models\Product;

class DemoProductImage extends Controller
{
    public function __invoke(string $sku)
    {
        $sku = strtoupper($sku);
        $product = $this->products()[$sku] ?? $this->productFromDatabase($sku);

        $name = htmlspecialchars($product['name'], ENT_QUOTES, 'UTF-8');
        $type = htmlspecialchars($product['type'], ENT_QUOTES, 'UTF-8');
        $accent = $product['accent'];
        $soft = $product['soft'];
        $icon = $this->icon($product['icon'], $accent);

        $svg = <<<SVG
<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1125" viewBox="0 0 900 1125" role="img" aria-label="{$name}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="56%" stop-color="{$soft}"/>
      <stop offset="100%" stop-color="#eee7dc"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="26" stdDeviation="24" flood-color="#1f2937" flood-opacity="0.14"/>
    </filter>
  </defs>
  <rect width="900" height="1125" rx="54" fill="url(#bg)"/>
  <rect x="58" y="58" width="784" height="1009" rx="42" fill="none" stroke="rgba(28,25,23,0.10)" stroke-width="3"/>
  <circle cx="728" cy="174" r="82" fill="{$accent}" opacity="0.08"/>
  <circle cx="185" cy="872" r="120" fill="{$accent}" opacity="0.07"/>
  <g filter="url(#shadow)">
    <rect x="170" y="208" width="560" height="520" rx="46" fill="rgba(255,255,255,0.86)" stroke="rgba(28,25,23,0.10)" stroke-width="3"/>
    {$icon}
  </g>
  <text x="450" y="815" text-anchor="middle" fill="#1c1917" font-family="Inter, Arial, sans-serif" font-size="42" font-weight="800" letter-spacing="0">{$name}</text>
  <text x="450" y="872" text-anchor="middle" fill="#78716c" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="700" letter-spacing="4">{$type}</text>
  <rect x="315" y="920" width="270" height="46" rx="23" fill="{$accent}" opacity="0.11"/>
  <text x="450" y="951" text-anchor="middle" fill="{$accent}" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="800" letter-spacing="2">MYSTORE VERIFIED</text>
</svg>
SVG;

        return response($svg, 200)
            ->header('Content-Type', 'image/svg+xml')
            ->header('Cache-Control', 'no-store');
    }

    private function products(): array
    {
        return [
            'GN-NOVA-X5' => ['name' => 'Nova X5 5G', 'type' => 'Smartphone', 'accent' => '#2563eb', 'soft' => '#eff6ff', 'icon' => 'phone'],
            'GN-AIR-ANC' => ['name' => 'AirBeat ANC', 'type' => 'Headphones', 'accent' => '#4f46e5', 'soft' => '#eef2ff', 'icon' => 'headphones'],
            'GN-WB14-PRO' => ['name' => 'WorkBook 14 Pro', 'type' => 'Laptop', 'accent' => '#0f766e', 'soft' => '#ecfdf5', 'icon' => 'laptop'],
            'UL-TEE-SUPIMA' => ['name' => 'Supima Crew Tee', 'type' => 'Cotton T-Shirt', 'accent' => '#be123c', 'soft' => '#fff1f2', 'icon' => 'tshirt'],
            'UL-SNK-CANVAS' => ['name' => 'Canvas Sneakers', 'type' => 'Footwear', 'accent' => '#c2410c', 'soft' => '#fff7ed', 'icon' => 'shoe'],
            'UL-BOMBER-LT' => ['name' => 'Bomber Jacket', 'type' => 'Outerwear', 'accent' => '#334155', 'soft' => '#f1f5f9', 'icon' => 'jacket'],
            'HC-PAN-TRIPLY' => ['name' => 'Tri-Ply Pan', 'type' => 'Cookware', 'accent' => '#57534e', 'soft' => '#f5f5f4', 'icon' => 'pan'],
            'HC-THROW-COT' => ['name' => 'Cotton Throw', 'type' => 'Home Decor', 'accent' => '#7c3aed', 'soft' => '#f5f3ff', 'icon' => 'blanket'],
            'HC-STOR-SET12' => ['name' => 'Pantry Set', 'type' => 'Kitchen Storage', 'accent' => '#15803d', 'soft' => '#f0fdf4', 'icon' => 'containers'],
            'GT-SERUM-VC' => ['name' => 'Vitamin C Serum', 'type' => 'Skincare', 'accent' => '#e11d48', 'soft' => '#fff1f2', 'icon' => 'dropper'],
            'GT-SHAM-ARGAN' => ['name' => 'Argan Shampoo', 'type' => 'Haircare', 'accent' => '#0891b2', 'soft' => '#ecfeff', 'icon' => 'bottle'],
            'GT-EDP-CITRUS' => ['name' => 'Citrus Mist', 'type' => 'Fragrance', 'accent' => '#d97706', 'soft' => '#fffbeb', 'icon' => 'perfume'],
            'GB-TRAIL-ALM' => ['name' => 'Trail Mix', 'type' => 'Healthy Snack', 'accent' => '#92400e', 'soft' => '#fef3c7', 'icon' => 'snack'],
            'GB-COLD-BREW' => ['name' => 'Cold Brew', 'type' => 'Coffee', 'accent' => '#78350f', 'soft' => '#fef3c7', 'icon' => 'coffee'],
            'GB-RICE-BAS5' => ['name' => 'Basmati Rice', 'type' => 'Organic Staples', 'accent' => '#65a30d', 'soft' => '#f7fee7', 'icon' => 'rice'],
            'PAX-DRILL-20V' => ['name' => '20V Drill Kit', 'type' => 'Power Tool', 'accent' => '#ca8a04', 'soft' => '#fefce8', 'icon' => 'drill'],
            'PAX-GOG-AF10' => ['name' => 'Safety Goggles', 'type' => 'PPE', 'accent' => '#0284c7', 'soft' => '#f0f9ff', 'icon' => 'goggles'],
            'PAX-LDM-60' => ['name' => 'Laser Meter', 'type' => 'Measuring Tool', 'accent' => '#16a34a', 'soft' => '#f0fdf4', 'icon' => 'meter'],
            'PT-JRNL-A5DOT' => ['name' => 'Dotted Journal', 'type' => 'Notebook', 'accent' => '#7c2d12', 'soft' => '#fff7ed', 'icon' => 'notebook'],
            'PT-PEN-BR24' => ['name' => 'Brush Pens', 'type' => 'Art Supplies', 'accent' => '#db2777', 'soft' => '#fdf2f8', 'icon' => 'pens'],
            'PT-BOOK-OPS' => ['name' => 'Ops Handbook', 'type' => 'Business Book', 'accent' => '#1d4ed8', 'soft' => '#eff6ff', 'icon' => 'book'],
        ];
    }

    private function productFromDatabase(string $sku): array
    {
        $record = Product::where('sku', $sku)->first(['name', 'product_type', 'tags']);
        $name = $record?->name ?: 'MyStore Product';
        $type = $record?->product_type ?: 'Product';
        $keywords = strtolower($sku . ' ' . $name . ' ' . $type . ' ' . json_encode($record?->tags ?? []));
        [$icon, $accent, $soft] = $this->visualFor($keywords);

        return [
            'name' => $this->shortLabel($name),
            'type' => $this->shortLabel($type, 24),
            'accent' => $accent,
            'soft' => $soft,
            'icon' => $icon,
        ];
    }

    private function visualFor(string $keywords): array
    {
        $rules = [
            [['phone', 'mobile', 'charger', 'power bank'], ['phone', '#2563eb', '#eff6ff']],
            [['headphone', 'speaker', 'earbud', 'audio'], ['headphones', '#4f46e5', '#eef2ff']],
            [['laptop', 'keyboard', 'mouse', 'monitor', 'printer'], ['laptop', '#0f766e', '#ecfdf5']],
            [['shirt', 'tee', 'kurta', 'dress', 'saree', 'hoodie', 'jeans'], ['tshirt', '#be123c', '#fff1f2']],
            [['shoe', 'sneaker', 'sandal'], ['shoe', '#c2410c', '#fff7ed']],
            [['jacket', 'backpack', 'bag', 'helmet'], ['jacket', '#334155', '#f1f5f9']],
            [['pan', 'cook', 'kitchen', 'mixer', 'tawa'], ['pan', '#57534e', '#f5f5f4']],
            [['decor', 'lamp', 'throw', 'bedsheet', 'rug', 'nursery'], ['blanket', '#7c3aed', '#f5f3ff']],
            [['storage', 'container', 'organizer'], ['containers', '#15803d', '#f0fdf4']],
            [['serum', 'cream', 'lotion', 'sunscreen'], ['dropper', '#e11d48', '#fff1f2']],
            [['shampoo', 'soap', 'cleanser', 'wash'], ['bottle', '#0891b2', '#ecfeff']],
            [['perfume', 'fragrance'], ['perfume', '#d97706', '#fffbeb']],
            [['snack', 'almond', 'protein', 'food', 'treat', 'tea'], ['snack', '#92400e', '#fef3c7']],
            [['coffee'], ['coffee', '#78350f', '#fef3c7']],
            [['rice', 'spice', 'flour', 'oil'], ['rice', '#65a30d', '#f7fee7']],
            [['drill', 'tool', 'wrench', 'hammer'], ['drill', '#ca8a04', '#fefce8']],
            [['safety', 'goggle', 'ppe'], ['goggles', '#0284c7', '#f0f9ff']],
            [['meter', 'scale', 'measure', 'device'], ['meter', '#16a34a', '#f0fdf4']],
            [['notebook', 'journal', 'diary', 'paper'], ['notebook', '#7c2d12', '#fff7ed']],
            [['pen', 'marker', 'brush'], ['pens', '#db2777', '#fdf2f8']],
            [['book', 'novel', 'handbook'], ['book', '#1d4ed8', '#eff6ff']],
        ];

        foreach ($rules as [$needles, $visual]) {
            foreach ($needles as $needle) {
                if (str_contains($keywords, $needle)) {
                    return $visual;
                }
            }
        }

        return ['box', '#44403c', '#f5f5f4'];
    }

    private function shortLabel(string $value, int $limit = 24): string
    {
        $value = trim(preg_replace('/\s+/', ' ', $value));

        if (strlen($value) <= $limit) {
            return $value;
        }

        return rtrim(substr($value, 0, $limit - 3)) . '...';
    }

    private function icon(string $icon, string $accent): string
    {
        return match ($icon) {
            'phone' => '<rect x="357" y="284" width="186" height="338" rx="34" fill="#111827"/><rect x="377" y="326" width="146" height="240" rx="16" fill="' . $accent . '" opacity="0.9"/><circle cx="450" cy="590" r="12" fill="#f9fafb"/>',
            'headphones' => '<path d="M310 474a140 140 0 0 1 280 0" fill="none" stroke="' . $accent . '" stroke-width="34" stroke-linecap="round"/><rect x="285" y="460" width="72" height="132" rx="28" fill="#111827"/><rect x="543" y="460" width="72" height="132" rx="28" fill="#111827"/><path d="M357 571c52 42 134 42 186 0" fill="none" stroke="' . $accent . '" stroke-width="18" stroke-linecap="round" opacity="0.5"/>',
            'laptop' => '<rect x="280" y="330" width="340" height="218" rx="20" fill="#111827"/><rect x="302" y="354" width="296" height="166" rx="10" fill="' . $accent . '" opacity="0.86"/><path d="M245 575h410l-36 58H281z" fill="#374151"/><rect x="395" y="590" width="110" height="14" rx="7" fill="#9ca3af"/>',
            'tshirt' => '<path d="M352 300l58 42h80l58-42 86 70-55 70-45-28v210H366V412l-45 28-55-70z" fill="' . $accent . '" opacity="0.9"/><path d="M410 342c16 36 64 36 80 0" fill="none" stroke="#fff" stroke-width="14" stroke-linecap="round"/>',
            'shoe' => '<path d="M263 525c66 8 122-18 172-72 56 45 112 76 202 90 20 4 34 22 31 43-4 24-22 38-48 38H300c-49 0-75-31-61-78 4-14 10-22 24-21z" fill="' . $accent . '"/><path d="M350 514h152M382 484l58 42M430 456l58 50" stroke="#fff" stroke-width="15" stroke-linecap="round" opacity="0.78"/>',
            'jacket' => '<path d="M345 306l68 44h74l68-44 76 76-58 70-36-30v202H363V422l-36 30-58-70z" fill="#1f2937"/><path d="M450 350v274M392 362l58 90 58-90" stroke="' . $accent . '" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>',
            'pan' => '<ellipse cx="405" cy="507" rx="138" ry="76" fill="#27272a"/><ellipse cx="405" cy="486" rx="116" ry="50" fill="' . $accent . '" opacity="0.75"/><path d="M535 507h137c24 0 42 19 42 42s-18 42-42 42H534" fill="none" stroke="#27272a" stroke-width="32" stroke-linecap="round"/>',
            'blanket' => '<path d="M315 320h270c42 0 76 34 76 76v192H345c-40 0-72-32-72-72V362c0-23 19-42 42-42z" fill="' . $accent . '" opacity="0.88"/><path d="M348 378h244M348 438h244M348 498h244" stroke="#fff" stroke-width="14" stroke-linecap="round" opacity="0.55"/>',
            'containers' => '<rect x="285" y="405" width="130" height="178" rx="22" fill="' . $accent . '" opacity="0.86"/><rect x="435" y="350" width="180" height="233" rx="24" fill="#111827"/><rect x="302" y="372" width="96" height="34" rx="17" fill="#fff"/><rect x="462" y="314" width="126" height="40" rx="20" fill="' . $accent . '"/>',
            'dropper' => '<path d="M430 300h40v86h-40z" fill="#111827"/><rect x="365" y="380" width="170" height="238" rx="36" fill="' . $accent . '" opacity="0.86"/><path d="M418 298c0-22 14-38 32-38s32 16 32 38" fill="none" stroke="#111827" stroke-width="18" stroke-linecap="round"/><circle cx="450" cy="498" r="45" fill="#fff" opacity="0.38"/>',
            'bottle' => '<rect x="390" y="286" width="120" height="58" rx="16" fill="#111827"/><rect x="352" y="336" width="196" height="286" rx="46" fill="' . $accent . '" opacity="0.88"/><rect x="386" y="422" width="128" height="92" rx="20" fill="#fff" opacity="0.38"/>',
            'perfume' => '<rect x="398" y="286" width="104" height="60" rx="16" fill="#111827"/><rect x="342" y="382" width="216" height="222" rx="34" fill="' . $accent . '" opacity="0.84"/><path d="M382 382c0-40 31-72 68-72s68 32 68 72" fill="none" stroke="' . $accent . '" stroke-width="22" stroke-linecap="round"/><circle cx="450" cy="494" r="44" fill="#fff" opacity="0.34"/>',
            'snack' => '<path d="M338 300h224l44 322H294z" fill="' . $accent . '" opacity="0.9"/><path d="M352 362h196M342 560h216" stroke="#fff" stroke-width="18" stroke-linecap="round" opacity="0.55"/><circle cx="410" cy="462" r="24" fill="#fef3c7"/><circle cx="476" cy="466" r="28" fill="#fef3c7"/>',
            'coffee' => '<rect x="382" y="304" width="136" height="300" rx="38" fill="#3f2f25"/><rect x="398" y="344" width="104" height="160" rx="22" fill="' . $accent . '"/><path d="M530 438h62c34 0 58 25 58 56s-24 56-58 56h-62" fill="none" stroke="#3f2f25" stroke-width="26" stroke-linecap="round"/>',
            'rice' => '<path d="M330 310h240l42 314H288z" fill="#f9fafb" stroke="' . $accent . '" stroke-width="24" stroke-linejoin="round"/><path d="M366 414h168M350 504h200" stroke="' . $accent . '" stroke-width="18" stroke-linecap="round"/><ellipse cx="450" cy="560" rx="62" ry="26" fill="' . $accent . '" opacity="0.25"/>',
            'drill' => '<path d="M300 368h210c42 0 76 34 76 76v20h-90l-32 158h-94l-18-158h-52z" fill="' . $accent . '"/><path d="M586 408h70c18 0 32 14 32 32v10H586zM374 464h96" stroke="#111827" stroke-width="22" stroke-linecap="round"/>',
            'goggles' => '<path d="M282 448c38-42 100-58 168-26 68-32 130-16 168 26l-44 116H326z" fill="' . $accent . '" opacity="0.86"/><ellipse cx="378" cy="492" rx="72" ry="58" fill="#e0f2fe"/><ellipse cx="522" cy="492" rx="72" ry="58" fill="#e0f2fe"/><path d="M450 492h0" stroke="#111827" stroke-width="22" stroke-linecap="round"/>',
            'meter' => '<rect x="340" y="302" width="220" height="322" rx="34" fill="#111827"/><rect x="370" y="340" width="160" height="96" rx="18" fill="' . $accent . '"/><path d="M382 492h136M382 540h86" stroke="#fff" stroke-width="18" stroke-linecap="round" opacity="0.8"/>',
            'notebook' => '<rect x="342" y="300" width="236" height="326" rx="28" fill="' . $accent . '" opacity="0.88"/><path d="M386 300v326" stroke="#fff" stroke-width="14" opacity="0.5"/><path d="M430 390h96M430 450h96M430 510h70" stroke="#fff" stroke-width="14" stroke-linecap="round" opacity="0.7"/>',
            'pens' => '<path d="M336 594l70-284 52 14-70 284zM438 594l70-284 52 14-70 284z" fill="' . $accent . '"/><path d="M318 638h270" stroke="#111827" stroke-width="24" stroke-linecap="round"/><path d="M406 310l34-38 18 52M508 310l34-38 18 52" fill="#111827"/>',
            'book' => '<path d="M300 336h150c42 0 76 34 76 76v204H376c-42 0-76-34-76-76z" fill="' . $accent . '" opacity="0.88"/><path d="M526 336h74v280h-74z" fill="#111827"/><path d="M346 416h112M346 474h112M346 532h84" stroke="#fff" stroke-width="14" stroke-linecap="round" opacity="0.7"/>',
            default => '<rect x="330" y="360" width="240" height="220" rx="34" fill="' . $accent . '" opacity="0.88"/><path d="M330 420h240" stroke="#fff" stroke-width="18" opacity="0.5"/>',
        };
    }
}
