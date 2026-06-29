import { usePage } from '@inertiajs/react';

const FALLBACK_COUNTRY = 'India';
const FALLBACK_CURRENCY = 'USD';
const FALLBACK_LOCALE = 'en-US';
const FALLBACK_TIMEZONE = 'UTC';

const normalize = (value) => String(value || '').trim().toLowerCase();

export const getLocalizationConfig = (props = {}) => props.localization || {};

export const getCountriesMap = (props = {}) => getLocalizationConfig(props).countries || {};

export const resolveCountryLocalization = (country, props = {}) => {
  const config = getLocalizationConfig(props);
  const countries = getCountriesMap(props);
  const fallbackName = config.default_country || FALLBACK_COUNTRY;
  const fallback =
    countries.IN ||
    Object.values(countries)[0] ||
    {
      name: fallbackName,
      currency: config.base_currency || FALLBACK_CURRENCY,
      locale: FALLBACK_LOCALE,
      timezone: FALLBACK_TIMEZONE,
      symbol: `${config.base_currency || FALLBACK_CURRENCY} `,
    };

  if (!country) {
    return { ...fallback, code: fallback.code || 'IN' };
  }

  const needle = normalize(country);

  for (const [code, settings] of Object.entries(countries)) {
    const aliases = Array.isArray(settings.aliases) ? settings.aliases.map(normalize) : [];
    const candidates = [
      normalize(code),
      normalize(settings.name),
      normalize(settings.currency),
      ...aliases,
    ].filter(Boolean);

    if (candidates.includes(needle)) {
      return { ...settings, code };
    }
  }

  for (const [code, settings] of Object.entries(countries)) {
    if (normalize(settings.name).includes(needle)) {
      return { ...settings, code };
    }
  }

  if (normalize(country) !== normalize(fallbackName)) {
    return resolveCountryLocalization(fallbackName, props);
  }

  return { ...fallback, code: fallback.code || 'IN' };
};

export const getUserLocalization = (props = {}, overrideCountry = null) => {
  const current = getLocalizationConfig(props).current || {};
  const resolved = resolveCountryLocalization(
    overrideCountry || current.country || props.auth?.user?.country || FALLBACK_COUNTRY,
    props,
  );

  return {
    country: resolved.name || current.country || FALLBACK_COUNTRY,
    countryCode: resolved.code || current.country_code || 'IN',
    currency: resolved.currency || current.currency || FALLBACK_CURRENCY,
    locale: resolved.locale || current.locale || FALLBACK_LOCALE,
    timezone: resolved.timezone || current.timezone || FALLBACK_TIMEZONE,
    symbol: resolved.symbol || `${resolved.currency || FALLBACK_CURRENCY} `,
  };
};

export const currencyRateToUsd = (currency, props = {}) => {
  const target = String(currency || getLocalizationConfig(props).base_currency || FALLBACK_CURRENCY).toUpperCase();
  for (const settings of Object.values(getCountriesMap(props))) {
    if (String(settings.currency || '').toUpperCase() === target) {
      return Number(settings.rate_to_usd || 1);
    }
  }
  return 1;
};

export const convertMoney = (amount, fromCurrency, toCurrency, props = {}) => {
  const numericAmount = Number(amount || 0);
  const from = String(fromCurrency || getLocalizationConfig(props).base_currency || FALLBACK_CURRENCY).toUpperCase();
  const to = String(toCurrency || getLocalizationConfig(props).base_currency || FALLBACK_CURRENCY).toUpperCase();

  if (!Number.isFinite(numericAmount)) {
    return 0;
  }

  if (from === to) {
    return Number(numericAmount.toFixed(2));
  }

  const amountInUsd = numericAmount * currencyRateToUsd(from, props);
  const targetRate = currencyRateToUsd(to, props);

  if (targetRate <= 0) {
    return Number(numericAmount.toFixed(2));
  }

  return Number((amountInUsd / targetRate).toFixed(2));
};

export const formatMoney = (amount, options = {}, props = {}) => {
  const localization = getUserLocalization(props, options.country);
  const currency = options.currency || localization.currency || FALLBACK_CURRENCY;
  const locale = options.locale || localization.locale || FALLBACK_LOCALE;
  const numericAmount = Number(amount || 0);

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(numericAmount);
  } catch (error) {
    return `${currency} ${numericAmount.toFixed(2)}`;
  }
};

export const formatStoredMoney = (amount, sourceCurrency, props = {}, overrideCountry = null) => {
  const localization = getUserLocalization(props, overrideCountry);
  const converted = convertMoney(amount, sourceCurrency || FALLBACK_CURRENCY, localization.currency, props);

  return formatMoney(converted, {
    currency: localization.currency,
    locale: localization.locale,
    country: localization.country,
  }, props);
};

export const formatProductMoney = (product, amount, props = {}, overrideCountry = null) => {
  const localization = getUserLocalization(props, overrideCountry);
  const sourceCurrency =
    product?.price_currency
    || product?.user?.country
    && resolveCountryLocalization(product.user.country, props).currency
    || localization.currency
    || FALLBACK_CURRENCY;
  const converted = convertMoney(amount, sourceCurrency, localization.currency, props);

  return formatMoney(converted, {
    currency: localization.currency,
    locale: localization.locale,
    country: localization.country,
  }, props);
};

export const formatDateTime = (value, options = {}, props = {}) => {
  if (!value) return '';

  const localization = getUserLocalization(props, options.country);
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat(options.locale || localization.locale || FALLBACK_LOCALE, {
    timeZone: options.timezone || localization.timezone || FALLBACK_TIMEZONE,
    year: options.year || 'numeric',
    month: options.month || 'short',
    day: options.day || 'numeric',
    ...(options.includeTime === false ? {} : {
      hour: options.hour || '2-digit',
      minute: options.minute || '2-digit',
    }),
  }).format(date);
};

export const useLocalization = (overrideCountry = null) => {
  const { props } = usePage();
  return getUserLocalization(props, overrideCountry);
};
