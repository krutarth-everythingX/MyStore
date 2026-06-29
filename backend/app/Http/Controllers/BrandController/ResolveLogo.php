<?php

namespace App\Http\Controllers\BrandController;

use App\Http\Controllers\Controller;
use DOMDocument;
use DOMElement;
use DOMXPath;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class ResolveLogo extends Controller
{
    public function __invoke(Request $request)
    {
        if ($request->user()->role !== 'seller' || ! seller_setup_complete($request->user())) {
            return response(['message' => 'Unauthorized'], 403);
        }

        $url = $this->normalizeUrl((string) $request->query('url', ''));

        if (! $url) {
            return response(['logo' => null], 200);
        }

        $origin = parse_url($url, PHP_URL_SCHEME).'://'.parse_url($url, PHP_URL_HOST);
        $fallbacks = [
            $origin.'/favicon.ico',
            $origin.'/favicon.svg',
            $origin.'/apple-touch-icon.png',
            'https://www.google.com/s2/favicons?domain='.urlencode((string) parse_url($url, PHP_URL_HOST)).'&sz=128',
            'https://icons.duckduckgo.com/ip3/'.parse_url($url, PHP_URL_HOST).'.ico',
        ];

        try {
            $html = Http::timeout(6)
                ->withHeaders(['User-Agent' => 'MyStore Brand Logo Resolver'])
                ->get($url)
                ->body();
        } catch (\Throwable) {
            return response(['logo' => $fallbacks[0], 'fallbacks' => $fallbacks], 200);
        }

        $document = new DOMDocument();
        libxml_use_internal_errors(true);
        $document->loadHTML($html);
        libxml_clear_errors();

        $xpath = new DOMXPath($document);
        $linkedLogo = $this->findLinkedLogo($xpath, $origin);

        if ($linkedLogo) {
            return response(['logo' => $linkedLogo, 'fallbacks' => $fallbacks], 200);
        }

        $inlineSvg = $this->findInlineSvgLogo($xpath, $document);

        return response([
            'logo' => $inlineSvg ?: $fallbacks[0],
            'fallbacks' => $fallbacks,
        ], 200);
    }

    private function normalizeUrl(string $value): ?string
    {
        $value = trim($value);

        if ($value === '') {
            return null;
        }

        $url = Str::startsWith($value, ['http://', 'https://']) ? $value : 'https://'.$value;
        $parts = parse_url($url);

        if (! in_array($parts['scheme'] ?? '', ['http', 'https'], true) || blank($parts['host'] ?? null)) {
            return null;
        }

        return $url;
    }

    private function findLinkedLogo(DOMXPath $xpath, string $origin): ?string
    {
        $queries = [
            "//link[contains(translate(@rel, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'apple-touch-icon')]/@href",
            "//link[contains(translate(@rel, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'icon')]/@href",
            "//meta[translate(@property, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz') = 'og:image']/@content",
            "//meta[translate(@name, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz') = 'twitter:image']/@content",
            "//img[contains(translate(@class, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'logo')]/@src",
            "//img[contains(translate(@alt, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'logo')]/@src",
        ];

        foreach ($queries as $query) {
            $node = $xpath->query($query)?->item(0);
            $value = trim((string) $node?->nodeValue);

            if ($value !== '') {
                return $this->absoluteUrl($value, $origin);
            }
        }

        return null;
    }

    private function findInlineSvgLogo(DOMXPath $xpath, DOMDocument $document): ?string
    {
        $queries = [
            "//header//*[name()='svg']",
            "//nav//*[name()='svg']",
            "//a//*[name()='svg']",
            "//*[name()='svg'][contains(translate(@class, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'logo')]",
            "//*[name()='svg']",
        ];

        foreach ($queries as $query) {
            $node = $xpath->query($query)?->item(0);

            if ($node instanceof DOMElement) {
                if (! $node->hasAttribute('xmlns')) {
                    $node->setAttribute('xmlns', 'http://www.w3.org/2000/svg');
                }

                $svg = $document->saveHTML($node);

                if (is_string($svg) && trim($svg) !== '') {
                    return 'data:image/svg+xml;base64,'.base64_encode($svg);
                }
            }
        }

        return null;
    }

    private function absoluteUrl(string $value, string $origin): string
    {
        if (Str::startsWith($value, ['http://', 'https://', 'data:'])) {
            return $value;
        }

        if (Str::startsWith($value, '//')) {
            return 'https:'.$value;
        }

        return $origin.'/'.ltrim($value, '/');
    }
}
