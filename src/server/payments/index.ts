import { mellatAdapter } from './mellat';
import { sepAdapter } from './sep';
import type { PaymentAdapter, PaymentProvider } from './types';

const adapters: Record<PaymentProvider, PaymentAdapter> = {
  saman: sepAdapter,
  mellat: mellatAdapter
};

export const getPaymentProviderStatus = () => ({
  saman: sepAdapter.isConfigured(),
  mellat: mellatAdapter.isConfigured()
});

export const getPaymentAdapter = (provider: string): PaymentAdapter => {
  if (provider !== 'saman' && provider !== 'mellat') {
    throw new Error('PAYMENT_PROVIDER_UNSUPPORTED');
  }
  const adapter = adapters[provider];
  if (!adapter.isConfigured()) {
    throw new Error(`PAYMENT_PROVIDER_NOT_CONFIGURED:${provider}`);
  }
  return adapter;
};

export type { PaymentProvider, PaymentStartResult, PaymentVerifyResult } from './types';
