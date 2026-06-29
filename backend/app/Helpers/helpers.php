<?php

use App\Models\User;
use Carbon\Carbon;
use Carbon\CarbonInterface;

if (!function_exists('seller_brand_name')) {
    function seller_brand_name(?string $brandName, string $userName): string
    {
        $brandName = trim((string) $brandName);

        return $brandName !== ''
            ? $brandName
            : $userName . "'s Store";
    }
}

if (!function_exists('seller_setup_complete')) {
    function seller_setup_complete(?\App\Models\User $user): bool
    {
        if (! $user || $user->role !== 'seller') {
            return true;
        }

        $requiresIndianTaxRegistration = strcasecmp((string) country_name_for($user->country), 'India') === 0;

        $profileComplete = filled($user->brand_name)
            && filled($user->address)
            && filled($user->country)
            && (! $requiresIndianTaxRegistration || filled($user->gst_number))
            && filled($user->default_fulfillment_channel);

        return $profileComplete && seller_verification_approved($user);
    }
}

if (!function_exists('seller_verification_reviewer')) {
    function seller_verification_reviewer(?\App\Models\User $user): bool
    {
        if (! $user) {
            return false;
        }

        return str_ends_with(strtolower((string) $user->email), '@mystore.test');
    }
}

if (!function_exists('seller_verification_status')) {
    function seller_verification_status(?\App\Models\User $user): string
    {
        if (! $user || $user->role !== 'seller') {
            return 'approved';
        }

        return (string) ($user->sellerVerification?->status ?: 'draft');
    }
}

if (!function_exists('seller_verification_approved')) {
    function seller_verification_approved(?\App\Models\User $user): bool
    {
        return seller_verification_status($user) === 'approved';
    }
}

if (!function_exists('localization_countries')) {
    function localization_countries(): array
    {
        return config('localization.countries', []);
    }
}

if (!function_exists('country_localization')) {
    function country_localization(?string $country): array
    {
        $countries = localization_countries();
        $fallbackCountry = config('localization.default_country', 'India');
        $fallback = $countries['IN'] ?? reset($countries) ?: [];

        if (! filled($country)) {
            return $fallback;
        }

        $normalized = strtolower(trim((string) $country));

        foreach ($countries as $code => $settings) {
            $aliases = array_map('strtolower', $settings['aliases'] ?? []);
            $candidates = array_merge([
                strtolower($code),
                strtolower((string) ($settings['name'] ?? '')),
                strtolower((string) ($settings['currency'] ?? '')),
            ], $aliases);

            if (in_array($normalized, array_filter($candidates), true)) {
                return $settings + ['code' => $code];
            }
        }

        foreach ($countries as $code => $settings) {
            if (str_contains(strtolower((string) ($settings['name'] ?? '')), $normalized)) {
                return $settings + ['code' => $code];
            }
        }

        if (filled($fallbackCountry) && strcasecmp((string) $country, (string) $fallbackCountry) !== 0) {
            return country_localization($fallbackCountry);
        }

        return $fallback;
    }
}

if (!function_exists('country_code_for')) {
    function country_code_for(?string $country): string
    {
        return country_localization($country)['code'] ?? 'IN';
    }
}

if (!function_exists('currency_for_country')) {
    function currency_for_country(?string $country): string
    {
        return country_localization($country)['currency'] ?? config('localization.base_currency', 'USD');
    }
}

if (!function_exists('base_money_currency')) {
    function base_money_currency(): string
    {
        return strtoupper((string) config('localization.base_currency', 'USD'));
    }
}

if (!function_exists('country_name_for')) {
    function country_name_for(?string $country): string
    {
        return country_localization($country)['name'] ?? config('localization.default_country', 'India');
    }
}

if (!function_exists('locale_for_country')) {
    function locale_for_country(?string $country): string
    {
        return country_localization($country)['locale'] ?? 'en-US';
    }
}

if (!function_exists('timezone_for_country')) {
    function timezone_for_country(?string $country): string
    {
        return country_localization($country)['timezone'] ?? config('localization.fallback_timezone', 'UTC');
    }
}

if (!function_exists('user_timezone')) {
    function user_timezone(?User $user): string
    {
        return timezone_for_country($user?->country);
    }
}

if (!function_exists('user_currency')) {
    function user_currency(?User $user): string
    {
        return currency_for_country($user?->country);
    }
}

if (!function_exists('currency_rate_to_usd')) {
    function currency_rate_to_usd(?string $currency): float
    {
        $currency = strtoupper((string) ($currency ?: config('localization.base_currency', 'USD')));

        foreach (localization_countries() as $settings) {
            if (strtoupper((string) ($settings['currency'] ?? '')) === $currency) {
                return (float) ($settings['rate_to_usd'] ?? 1);
            }
        }

        return 1.0;
    }
}

if (!function_exists('convert_money')) {
    function convert_money(float|int|string|null $amount, ?string $fromCurrency = null, ?string $toCurrency = null): float
    {
        $fromCurrency = strtoupper((string) ($fromCurrency ?: base_money_currency()));
        $toCurrency = strtoupper((string) ($toCurrency ?: base_money_currency()));
        $numericAmount = (float) ($amount ?? 0);

        if ($fromCurrency === $toCurrency) {
            return round($numericAmount, 2);
        }

        $amountInUsd = $numericAmount * currency_rate_to_usd($fromCurrency);
        $targetRate = currency_rate_to_usd($toCurrency);

        if ($targetRate <= 0) {
            return round($numericAmount, 2);
        }

        return round($amountInUsd / $targetRate, 2);
    }
}

if (!function_exists('money_to_base')) {
    function money_to_base(float|int|string|null $amount, ?string $fromCurrency = null): float
    {
        return convert_money($amount, $fromCurrency, base_money_currency());
    }
}

if (!function_exists('money_from_base')) {
    function money_from_base(float|int|string|null $amount, ?string $toCurrency = null): float
    {
        return convert_money($amount, base_money_currency(), $toCurrency);
    }
}

if (!function_exists('format_money')) {
    function format_money(float|int|string|null $amount, ?string $currency = null, ?string $locale = null): string
    {
        $currency = strtoupper((string) ($currency ?: base_money_currency()));
        $locale ??= 'en-US';

        if (class_exists(\NumberFormatter::class)) {
            $formatter = new \NumberFormatter($locale, \NumberFormatter::CURRENCY);

            return $formatter->formatCurrency((float) ($amount ?? 0), $currency);
        }

        $symbol = collect(localization_countries())
            ->firstWhere('currency', $currency)['symbol'] ?? $currency . ' ';

        return $symbol . number_format((float) ($amount ?? 0), 2);
    }
}

if (!function_exists('localized_money_amount')) {
    function localized_money_amount(
        float|int|string|null $amount,
        ?string $sourceCurrency = null,
        ?string $targetCountry = null,
        ?string $targetCurrency = null
    ): float {
        $resolvedCurrency = strtoupper((string) ($targetCurrency ?: currency_for_country($targetCountry)));

        return convert_money($amount, $sourceCurrency, $resolvedCurrency);
    }
}

if (!function_exists('localized_money_format')) {
    function localized_money_format(
        float|int|string|null $amount,
        ?string $sourceCurrency = null,
        ?string $targetCountry = null,
        ?string $targetCurrency = null,
        ?string $locale = null
    ): string {
        $resolvedCountry = $targetCountry ?: config('localization.default_country', 'India');
        $resolvedCurrency = strtoupper((string) ($targetCurrency ?: currency_for_country($resolvedCountry)));
        $resolvedLocale = $locale ?: locale_for_country($resolvedCountry);
        $localizedAmount = convert_money($amount, $sourceCurrency, $resolvedCurrency);

        return format_money($localizedAmount, $resolvedCurrency, $resolvedLocale);
    }
}

if (!function_exists('utc_now')) {
    function utc_now(): Carbon
    {
        return now('UTC');
    }
}

if (!function_exists('to_utc_datetime')) {
    function to_utc_datetime(mixed $value): ?Carbon
    {
        if (! $value) {
            return null;
        }

        return $value instanceof CarbonInterface
            ? $value->copy()->utc()
            : Carbon::parse($value, 'UTC')->utc();
    }
}

if (!function_exists('to_user_timezone')) {
    function to_user_timezone(mixed $value, ?User $user = null, ?string $format = null): Carbon|string|null
    {
        $date = to_utc_datetime($value);

        if (! $date) {
            return null;
        }

        $localized = $date->setTimezone(user_timezone($user));

        return $format ? $localized->format($format) : $localized;
    }
}
