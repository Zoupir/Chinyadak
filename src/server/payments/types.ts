export type PaymentProvider = 'saman' | 'mellat';

export interface PaymentStartInput {
  gatewayOrderId: number;
  orderNumber: string;
  amountToman: number;
  amountRial: number;
  mobile: string;
  callbackUrl: string;
  description: string;
}

export interface PaymentStartResult {
  authority: string;
  redirectUrl: string;
  redirectMethod: 'GET' | 'POST';
  fields?: Record<string, string>;
  raw?: unknown;
}

export interface PaymentVerifyInput {
  gatewayOrderId: number;
  orderNumber: string;
  amountToman: number;
  amountRial: number;
  authority?: string | null;
  callback: Record<string, unknown>;
}

export interface PaymentVerifyResult {
  success: boolean;
  referenceId?: string;
  raw?: unknown;
  errorCode?: string;
  errorMessage?: string;
}

export interface PaymentAdapter {
  provider: PaymentProvider;
  isConfigured(): boolean;
  start(input: PaymentStartInput): Promise<PaymentStartResult>;
  verify(input: PaymentVerifyInput): Promise<PaymentVerifyResult>;
  reverse?(input: PaymentVerifyInput): Promise<boolean>;
}
