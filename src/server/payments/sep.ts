import type {
  PaymentAdapter,
  PaymentStartInput,
  PaymentStartResult,
  PaymentVerifyInput,
  PaymentVerifyResult
} from './types';

const tokenUrl = () => process.env.SEP_TOKEN_URL || 'https://sep.shaparak.ir/onlinepg/onlinepg';
const paymentUrl = () => process.env.SEP_PAYMENT_URL || 'https://sep.shaparak.ir/OnlinePG/SendToken';
const verifyUrl = () => process.env.SEP_VERIFY_URL || 'https://sep.shaparak.ir/verifyTxnRandomSessionkey/ipg/VerifyTransaction';
const reverseUrl = () => process.env.SEP_REVERSE_URL || 'https://sep.shaparak.ir/verifyTxnRandomSessionkey/ipg/ReverseTransaction';

const terminalId = (): string => String(process.env.SEP_TERMINAL_ID || '').trim();

const jsonPost = async (url: string, payload: unknown): Promise<any> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    const text = await response.text();
    let data: any;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: text };
    }
    if (!response.ok) {
      throw new Error(`SEP_HTTP_${response.status}: ${text.slice(0, 500)}`);
    }
    return data;
  } finally {
    clearTimeout(timeout);
  }
};

const callbackString = (callback: Record<string, unknown>, key: string): string =>
  String(callback[key] ?? callback[key.toLowerCase()] ?? '').trim();

export const sepAdapter: PaymentAdapter = {
  provider: 'saman',

  isConfigured() {
    return Boolean(terminalId());
  },

  async start(input: PaymentStartInput): Promise<PaymentStartResult> {
    const terminal = terminalId();
    if (!terminal) throw new Error('SEP_NOT_CONFIGURED');

    const payload = {
      action: 'token',
      TerminalId: terminal,
      Amount: input.amountRial,
      ResNum: input.orderNumber,
      RedirectUrl: input.callbackUrl,
      CellNumber: input.mobile,
      Description: input.description
    };

    const result = await jsonPost(tokenUrl(), payload);
    const status = Number(result.status ?? result.Status ?? 0);
    const token = String(result.token ?? result.Token ?? '').trim();

    if (status !== 1 || !token) {
      throw new Error(
        `SEP_TOKEN_FAILED:${String(result.errorCode ?? result.ErrorCode ?? status)}:${String(
          result.errorDesc ?? result.ErrorDesc ?? result.message ?? 'unknown'
        )}`
      );
    }

    const base = paymentUrl();
    const redirectUrl = base.includes('?')
      ? `${base}&token=${encodeURIComponent(token)}`
      : `${base}?token=${encodeURIComponent(token)}`;

    return {
      authority: token,
      redirectUrl,
      redirectMethod: 'GET',
      raw: result
    };
  },

  async verify(input: PaymentVerifyInput): Promise<PaymentVerifyResult> {
    const terminal = terminalId();
    if (!terminal) {
      return { success: false, errorCode: 'SEP_NOT_CONFIGURED' };
    }

    const state = callbackString(input.callback, 'State');
    const refNum =
      callbackString(input.callback, 'RefNum') ||
      callbackString(input.callback, 'refnum');

    if (!refNum || (state && state.toUpperCase() !== 'OK')) {
      return {
        success: false,
        errorCode: state || 'SEP_CALLBACK_FAILED',
        errorMessage: 'SEP callback did not report a successful payment.'
      };
    }

    const result = await jsonPost(verifyUrl(), {
      RefNum: refNum,
      TerminalNumber: Number(terminal)
    });

    const success = Boolean(result.Success ?? result.success);
    const resultCode = Number(result.ResultCode ?? result.resultCode ?? (success ? 0 : -1));
    const detail = result.TransactionDetail ?? result.transactionDetail ?? {};
    const verifiedAmount = Number(detail.Amount ?? detail.amount ?? 0);

    if (!success || resultCode !== 0) {
      return {
        success: false,
        referenceId: refNum,
        raw: result,
        errorCode: String(resultCode),
        errorMessage: String(result.ResultDescription ?? result.resultDescription ?? 'SEP verify failed')
      };
    }

    if (verifiedAmount > 0 && verifiedAmount !== input.amountRial) {
      return {
        success: false,
        referenceId: refNum,
        raw: result,
        errorCode: 'AMOUNT_MISMATCH',
        errorMessage: 'Verified SEP amount does not match the order amount.'
      };
    }

    const verifiedResNum = String(detail.ResNum ?? detail.resNum ?? '').trim();
    if (verifiedResNum && verifiedResNum !== input.orderNumber) {
      return {
        success: false,
        referenceId: refNum,
        raw: result,
        errorCode: 'ORDER_MISMATCH',
        errorMessage: 'Verified SEP order number does not match.'
      };
    }

    return {
      success: true,
      referenceId: refNum,
      raw: result
    };
  },

  async reverse(input: PaymentVerifyInput): Promise<boolean> {
    const terminal = terminalId();
    const refNum =
      callbackString(input.callback, 'RefNum') ||
      callbackString(input.callback, 'refnum');
    if (!terminal || !refNum) return false;

    try {
      const result = await jsonPost(reverseUrl(), {
        RefNum: refNum,
        TerminalNumber: Number(terminal)
      });
      const success = Boolean(result.Success ?? result.success);
      const code = Number(result.ResultCode ?? result.resultCode ?? (success ? 0 : -1));
      return success && code === 0;
    } catch {
      return false;
    }
  }
};
