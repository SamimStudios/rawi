import { useState, useEffect } from 'react';

export type Currency = 'AED' | 'SAR' | 'USD';

export interface CurrencyInfo {
  code: Currency;
  symbol: string;
  name: string;
}

export const useCurrency = () => {
  const [currency, setCurrency] = useState<Currency>('USD');
  const [loading, setLoading] = useState(true);

  const currencies: Record<Currency, CurrencyInfo> = {
    AED: { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
    SAR: { code: 'SAR', symbol: 'ر.س', name: 'Saudi Riyal' },
    USD: { code: 'USD', symbol: '$', name: 'US Dollar' },
  };

  const detectCurrency = async () => {
    try {
      // Try to get user's location
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      
      if (data.country_code) {
        switch (data.country_code) {
          case 'AE':
            setCurrency('AED');
            break;
          case 'SA':
            setCurrency('SAR');
            break;
          default:
            setCurrency('USD');
            break;
        }
      }
    } catch (error) {
      console.log('Could not detect location, defaulting to USD');
      setCurrency('USD');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (amount: number, currencyCode: Currency = currency) => {
    const currencyInfo = currencies[currencyCode];
    return `${currencyInfo.symbol}${amount.toFixed(2)}`;
  };

  const getPrice = (prices: { price_aed: number; price_sar: number; price_usd: number }) => {
    switch (currency) {
      case 'AED':
        return prices.price_aed;
      case 'SAR':
        return prices.price_sar;
      case 'USD':
        return prices.price_usd;
      default:
        return prices.price_usd;
    }
  };

  useEffect(() => {
    detectCurrency();
  }, []);

  return {
    currency,
    setCurrency,
    currencyInfo: currencies[currency],
    currencies,
    loading,
    formatPrice,
    getPrice,
  };
};