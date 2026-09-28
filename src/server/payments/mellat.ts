import soap from 'soap';
import type {
  PaymentAdapter,
  PaymentStartInput,
  PaymentStartResult,
  PaymentVerifyInput,
  PaymentVerifyResult
} from './types';

const wsdlUrl = () =>
  process.env.MELLAT_WSDL_URL || 'https://bpm.shaparak.ir/pgwchannel/services/pgw?wsdl';
const paymentUrl = () =>
  process.env.MELLAT_PAYMENT_URL || 'https://bpm.shaparak.ir/pgwchannel/startpay.mellat';

const config = () => ({
  terminalId: String(process.env.MELLAT_TERMINAL_ID || '').trim(),
  userName: String(process.env.MELLAT_USERNAME || '').trim(),
  userPassword: String(process.env.MELLAT_PASSWORD || '').trim()
});

const extractReturn = (result: any): string => {
  const first = Array.isArray(result) ? result[0] : result;
  if (typeof first === 'string' || typeof first === 'number') return String(first);
  return String(first?.return ?? first?.Return ?? '');
};

const tehranDateTime = () => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Tehran',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).formatToParts(new Date());

  const get = (type: string) => parts.find(item => item.type === type)?.value || '';
  return {
    localDate: `${get('year')}${get('month')}${get('day')}`,
    localTime: `${get('hour')}${get('minute')}${get('second')}`
  };
};

const createClient = async (): Promise<any> => {
  const client = await soap.createClientAsync(wsdlUrl(), {
    disableCache: true,
    wsdl_options: { timeout: 30000 }
  } as any);
  return client;
};

const callbackValue = (callback: Record<string, unknown>, key: string): string =>
  String(callback[key] ?? callback[key.toLowerCase()] ?? '').trim();

const commonParams = (input: PaymentVerifyInput) => {
  const cfg = config();
  const saleOrderId = Number(
    callbackValue(input.callback, 'SaleOrderId') ||
      callbackValue(input.callback, 'saleOrderId') ||
      input.gatewayOrderId
  );
  const saleReferenceId = Number(
    callbackValue(input.callback, 'SaleReferenceId') ||
      callbackValue(input.callback, 'saleReferenceId') ||
      0
  );

  return {
    terminalId: cfg.terminalId,
    userName: cfg.userName,
    userPassword: cfg.userPassword,
    orderId: input.gatewayOrderId,
    saleOrderId,
    saleReferenceId
  };
};

export const mellatAdapter: PaymentAdapter = {
  provider: 'mellat',

  isConfigured() {
    const cfg = config();
    return Boolean(cfg.terminalId && cfg.userName && cfg.userPassword);
  },

  async start(input: PaymentStartInput): Promise<PaymentStartResult> {
    const cfg = config();
    if (!cfg.terminalId || !cfg.userName || !cfg.userPassword) {
      throw new Error('MELLAT_NOT_CONFIGURED');
    }

    const client = await createClient();
    const { localDate, localTime } = tehranDateTime();

    const result = await client.bpPayRequestAsync({
      terminalId: cfg.terminalId,
      userName: cfg.userName,
      userPassword: cfg.userPassword,
      orderId: input.gatewayOrderId,
      amount: input.amountRial,
      localDate,
      localTime,
      additionalData: input.orderNumber,
      callBackUrl: input.callbackUrl,
      payerId: 0
    });

    const raw = extractReturn(result);
    const [code, refId] = raw.split(',');
    if (code !== '0' || !refId) {
      throw new Error(`MELLAT_PAY_REQUEST_FAILED:${code || 'UNKNOWN'}`);
    }

    return {
      authority: refId,
      redirectUrl: paymentUrl(),
      redirectMethod: 'POST',
      fields: { RefId: refId },
      raw
    };
  },

  async verify(input: PaymentVerifyInput): Promise<PaymentVerifyResult> {
    const cfg = config();
    if (!cfg.terminalId || !cfg.userName || !cfg.userPassword) {
      return { success: false, errorCode: 'MELLAT_NOT_CONFIGURED' };
    }

    const resCode = callbackValue(input.callback, 'ResCode');
    const saleReferenceId = callbackValue(input.callback, 'SaleReferenceId');

    if (resCode && resCode !== '0') {
      return {
        success: false,
        referenceId: saleReferenceId || undefined,
        errorCode: resCode,
        errorMessage: 'Mellat callback reported a failed payment.'
      };
    }

    if (!saleReferenceId) {
      return {
        success: false,
        errorCode: 'MELLAT_REFERENCE_MISSING',
        errorMessage: 'Mellat callback reference is missing.'
      };
    }

    const client = await createClient();
    const params = commonParams(input);

    const verifyResult = extractReturn(await client.bpVerifyRequestAsync(params));
    if (verifyResult !== '0') {
      return {
        success: false,
        referenceId: saleReferenceId,
        raw: { verify: verifyResult },
        errorCode: verifyResult || 'MELLAT_VERIFY_FAILED'
      };
    }

    const settleResult = extractReturn(await client.bpSettleRequestAsync(params));
    if (settleResult !== '0') {
      try {
        await client.bpReversalRequestAsync(params);
      } catch {
        // The payment will remain flagged as failed/manual review if reversal cannot be confirmed.
      }
      return {
        success: false,
        referenceId: saleReferenceId,
        raw: { verify: verifyResult, settle: settleResult },
        errorCode: settleResult || 'MELLAT_SETTLE_FAILED',
        errorMessage: 'Mellat verification succeeded but settlement failed.'
      };
    }

    return {
      success: true,
      referenceId: saleReferenceId,
      raw: { verify: verifyResult, settle: settleResult }
    };
  },

  async reverse(input: PaymentVerifyInput): Promise<boolean> {
    try {
      const client = await createClient();
      const result = extractReturn(await client.bpReversalRequestAsync(commonParams(input)));
      return result === '0';
    } catch {
      return false;
    }
  }
};
