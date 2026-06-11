<?php

namespace App\Services\ProductService;

use App\Models\Product;
use App\Models\Category;
use App\Models\Brand;
use Illuminate\Support\Facades\Cache;

class Spellchecker
{
    /**
     * Get suggestions/corrections for the given search query.
     * Returns an array with [
     *   'original' => string,
     *   'corrected' => string,
     *   'is_corrected' => bool
     * ]
     */
    public function getSuggestion(string $search): array
    {
        $search = trim($search);
        if ($search === '') {
            return [
                'original' => '',
                'corrected' => '',
                'is_corrected' => false
            ];
        }

        $vocabulary = $this->getVocabulary();

        // Split search by space and other punctuation separators
        $tokens = preg_split('/[\s,\.\-\_\/\\\\#\(\)\[\]\{\}\'\"\?\!\;\:]+/', $search, -1, PREG_SPLIT_NO_EMPTY);
        if (empty($tokens)) {
            return [
                'original' => $search,
                'corrected' => $search,
                'is_corrected' => false
            ];
        }

        $correctedTokens = [];
        $isCorrected = false;

        foreach ($tokens as $token) {
            $lowerToken = strtolower($token);

            // Skip numeric tokens, alphanumeric codes containing digits, or very short tokens
            if (is_numeric($lowerToken) || preg_match('/\d/', $lowerToken) || strlen($lowerToken) <= 2) {
                $correctedTokens[] = $token;
                continue;
            }

            // Check if exact match exists in vocabulary (case-insensitive)
            if (in_array($lowerToken, $vocabulary, true)) {
                $correctedTokens[] = $token;
                continue;
            }

            // Find closest match in vocabulary using Levenshtein distance
            $bestMatch = null;
            $bestDistance = 999;

            foreach ($vocabulary as $vocabWord) {
                $len = strlen($lowerToken);
                // Determine threshold based on word length
                $threshold = ($len <= 4) ? 1 : 2;

                $dist = levenshtein($lowerToken, $vocabWord);
                if ($dist <= $threshold && $dist < $bestDistance) {
                    $bestDistance = $dist;
                    $bestMatch = $vocabWord;
                }
            }

            if ($bestMatch !== null && $bestDistance > 0) {
                // Maintain casing if the original started with uppercase
                if (ctype_upper($token[0])) {
                    $correctedTokens[] = ucfirst($bestMatch);
                } else {
                    $correctedTokens[] = $bestMatch;
                }
                $isCorrected = true;
            } else {
                $correctedTokens[] = $token;
            }
        }

        $correctedQuery = implode(' ', $correctedTokens);

        // Double check case-insensitive match against original search query
        $isCorrected = $isCorrected && strtolower($search) !== strtolower($correctedQuery);

        return [
            'original' => $search,
            'corrected' => $correctedQuery,
            'is_corrected' => $isCorrected
        ];
    }

    /**
     * Retrieve the unique vocabulary of words from published products, categories, and brands.
     * Cached for 10 minutes (600 seconds) to maintain efficiency.
     */
    protected function getVocabulary(): array
    {
        return Cache::remember('search_vocabulary', 600, function () {
            $words = [];

            // 1. Words from published product names
            $productNames = Product::where('status', 'published')
                ->where('type', '!=', 'variation')
                ->pluck('name');

            foreach ($productNames as $name) {
                $nameWords = preg_split('/[\s,\.\-\_\/\\\\#\(\)\[\]\{\}\'\"\?\!\;\:]+/', $name, -1, PREG_SPLIT_NO_EMPTY);
                foreach ($nameWords as $word) {
                    $word = strtolower(trim($word));
                    if (strlen($word) >= 2 && !is_numeric($word) && !preg_match('/\d/', $word)) {
                        $words[$word] = true;
                    }
                }
            }

            // 2. Words from categories
            $categoryNames = Category::pluck('name');
            foreach ($categoryNames as $name) {
                $catWords = preg_split('/[\s,\.\-\_\/\\\\#\(\)\[\]\{\}\'\"\?\!\;\:]+/', $name, -1, PREG_SPLIT_NO_EMPTY);
                foreach ($catWords as $word) {
                    $word = strtolower(trim($word));
                    if (strlen($word) >= 2 && !is_numeric($word) && !preg_match('/\d/', $word)) {
                        $words[$word] = true;
                    }
                }
            }

            // 3. Words from brands
            $brandNames = Brand::pluck('name');
            foreach ($brandNames as $name) {
                $brandWords = preg_split('/[\s,\.\-\_\/\\\\#\(\)\[\]\{\}\'\"\?\!\;\:]+/', $name, -1, PREG_SPLIT_NO_EMPTY);
                foreach ($brandWords as $word) {
                    $word = strtolower(trim($word));
                    if (strlen($word) >= 2 && !is_numeric($word) && !preg_match('/\d/', $word)) {
                        $words[$word] = true;
                    }
                }
            }

            // 4. Product tags
            $productsWithTags = Product::whereNotNull('tags')->get(['tags']);
            foreach ($productsWithTags as $p) {
                if (is_array($p->tags)) {
                    foreach ($p->tags as $tag) {
                        $word = strtolower(trim($tag));
                        if (strlen($word) >= 2 && !is_numeric($word) && !preg_match('/\d/', $word)) {
                            $words[$word] = true;
                        }
                    }
                }
            }

            return array_keys($words);
        });
    }
}
