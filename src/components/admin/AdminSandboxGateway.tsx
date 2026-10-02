import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { formatToman } from '../../utils/formatters';
import { CreditCard, ShieldCheck, XCircle, RefreshCw, KeyRound, Check, Receipt } from 'lucide-react';

export const AdminSandboxGateway: React.FC = () => {
  const { 
    paymentGateways, 
    orders, 
    updateOrderStatus, 
    simulateAdminPayment, 
    showToast 
  } = useStore();

  const [selectedGatewayId, setSelectedGatewayId] = useState<string>(paymentGateways[0]?.id || 'gateway-saman');
  const [testAmount, setTestAmount] = useState<number>(1500000);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [cardNumber, setCardNumber] = useState<string>('6219-8610-3821-8471');
  const [cvv2, setCvv2] = useState<string>('492');
  const [expireMonth, setExpireMonth] = useState<string>('08');
  const [expireYear, setExpireYear] = useState<string>('06');
  const [otp, setOtp] = useState<string>('');
  const [isOtpSent, setIsOtpSent] = useState<boolean>(false);
  const [scenario, setScenario] = useState<'success' | 'insufficient_funds' | 'user_cancelled' | 'network_error'>('success');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    trackingNumber?: string;
    message: string;
    receipt?: any;
  } | null>(null);

  // When order is selected, populate amount
  const handleOrderChange = (orderId: string) => {
    setSelectedOrderId(orderId);
    if (orderId) {
      const order = orders.find(o => o.id === orderId || o.orderNumber === orderId);
      if (order) {
        setTestAmount(order.total);
      }
    }
  };

  const handleSendOtp = () => {
    setIsOtpSent(true);
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setOtp(generatedOtp);
    showToast(`رمز پویای تستی (${generatedOtp}) تولید و جای‌گذاری شد.`, 'info');
  };

  const handleRunPaymentTest = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setTestResult(null);

    setTimeout(() => {
      const res = simulateAdminPayment(testAmount, selectedGatewayId, cardNumber, scenario);
      setTestResult(res);
      setIsProcessing(false);

      if (res.success) {
        showToast('تست تراکنش با موفقیت انجام شد و رسید صادر گردید.');
        // If an actual order was linked, update its status to 'paid'
        if (selectedOrderId) {
          updateOrderStatus(selectedOrderId, 'paid', res.trackingNumber);
          showToast(`وضعیت سفارش ${selectedOrderId} به پرداخت‌شده تغییر یافت.`);
        }
      } else {
        showToast(res.message, 'error');
      }
    }, 900);
  };

  const activeGateways = paymentGateways.filter(g => g.isActive);

  return (
    <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-xs space-y-6">
      <div className="border-b border-neutral-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">
              محیط سندباکس و آزمایشی شاپرک
            </span>
          </div>
          <h3 className="text-lg font-black text-neutral-900 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-red-600" />
            <span>درگاه شبیه‌ساز پرداخت آزمایشی (Sandbox Gateway Simulator)</span>
          </h3>
          <p className="text-xs text-neutral-500 mt-1">
            بررسی فرآیند پرداخت، تست سناریوهای خطا یا موفقیت و صدور رسید الکترونیکی شاپرک
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-neutral-100 px-3 py-1.5 rounded-xl text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>وضعیت سوییچ شاپرک: متصل (Code 200)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Column */}
        <form onSubmit={handleRunPaymentTest} className="lg:col-span-7 space-y-4 text-xs">
          {/* Select Gateway */}
          <div>
            <label className="block text-neutral-700 font-bold mb-1">انتخاب درگاه پرداخت فعال:</label>
            <select
              value={selectedGatewayId}
              onChange={e => setSelectedGatewayId(e.target.value)}
              className="w-full p-2.5 border border-neutral-300 rounded-xl bg-white text-xs font-bold"
            >
              {paymentGateways.map(g => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.isActive ? 'فعال' : 'غیرفعال'})
                </option>
              ))}
            </select>
          </div>

          {/* Test against real pending order OR custom amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-neutral-700 font-bold mb-1">اتصال به سفارش ثبت‌شده (اختیاری):</label>
              <select
                value={selectedOrderId}
                onChange={e => handleOrderChange(e.target.value)}
                className="w-full p-2.5 border border-neutral-300 rounded-xl bg-white text-xs"
              >
                <option value="">تست مستقل (بدون اتصال به سفارش)</option>
                {orders.map(o => (
                  <option key={o.id} value={o.id}>
                    سفارش {o.orderNumber} - {o.customer.firstName} ({formatToman(o.total)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-neutral-700 font-bold mb-1">مبلغ آزمایشی تراکنش (تومان):</label>
              <input
                type="number"
                value={testAmount}
                onChange={e => setTestAmount(Number(e.target.value))}
                className="w-full p-2.5 border border-neutral-300 rounded-xl font-mono"
                required
              />
            </div>
          </div>

          {/* Preset Cards Quick Buttons */}
          <div className="space-y-1.5 pt-2">
            <span className="text-[11px] text-neutral-500 font-bold">کارت‌های تستی پیش‌فرض:</span>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'بانک سامان', card: '۶۲۱۹-۸۶۱۰-۳۸۲۱-۸۴۷۱', cvv: '492' },
                { label: 'بانک ملت', card: '۶۱۰۴-۳۳۷۸-۹۸۲۱-۴۵۹۱', cvv: '831' },
                { label: 'بانک ملی', card: '۶۰۳۷-۹۹۱۸-۲۷۳۱-۶۰۱۸', cvv: '109' }
              ].map(c => (
                <button
                  key={c.label}
                  type="button"
                  onClick={() => {
                    setCardNumber(c.card);
                    setCvv2(c.cvv);
                  }}
                  className="px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg text-[10px] font-mono transition-colors"
                >
                  {c.label}: {c.card}
                </button>
              ))}
            </div>
          </div>

          {/* Card Number Input */}
          <div>
            <label className="block text-neutral-700 font-bold mb-1">شماره کارت بانکی (۱۶ رقم):</label>
            <div className="relative">
              <CreditCard className="w-4 h-4 text-neutral-400 absolute right-3 top-3" />
              <input
                type="text"
                value={cardNumber}
                onChange={e => setCardNumber(e.target.value)}
                placeholder="6037-xxxx-xxxx-xxxx"
                className="w-full pr-9 pl-3 py-2.5 border border-neutral-300 rounded-xl font-mono text-left tracking-wider"
                required
              />
            </div>
          </div>

          {/* CVV2 and Expiry */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-neutral-700 font-bold mb-1">کد CVV2:</label>
              <input
                type="text"
                value={cvv2}
                onChange={e => setCvv2(e.target.value)}
                placeholder="123"
                maxLength={4}
                className="w-full p-2.5 border border-neutral-300 rounded-xl font-mono text-center"
                required
              />
            </div>

            <div>
              <label className="block text-neutral-700 font-bold mb-1">ماه انقضا:</label>
              <input
                type="text"
                value={expireMonth}
                onChange={e => setExpireMonth(e.target.value)}
                placeholder="08"
                maxLength={2}
                className="w-full p-2.5 border border-neutral-300 rounded-xl font-mono text-center"
              />
            </div>

            <div>
              <label className="block text-neutral-700 font-bold mb-1">سال انقضا:</label>
              <input
                type="text"
                value={expireYear}
                onChange={e => setExpireYear(e.target.value)}
                placeholder="06"
                maxLength={2}
                className="w-full p-2.5 border border-neutral-300 rounded-xl font-mono text-center"
              />
            </div>
          </div>

          {/* Dynamic OTP */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-neutral-700 font-bold">رمز یکبار مصرف (رمز پویا):</label>
              <button
                type="button"
                onClick={handleSendOtp}
                className="text-[11px] text-red-600 font-bold hover:underline"
              >
                درخواست رمز پویا تستی
              </button>
            </div>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-neutral-400 absolute right-3 top-3" />
              <input
                type="text"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                placeholder="رمز پویا"
                className="w-full pr-9 pl-3 py-2.5 border border-neutral-300 rounded-xl font-mono text-left"
                required
              />
            </div>
          </div>

          {/* Test Scenario Picker */}
          <div className="pt-2">
            <label className="block text-neutral-700 font-bold mb-1.5">سناریوی آزمایشی خروجی درگاه:</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'success', label: 'تراکنش موفق (کد ۰۰ شاپرک)', color: 'text-emerald-700' },
                { id: 'insufficient_funds', label: 'موجودی ناکافی (کد ۵۱)', color: 'text-amber-700' },
                { id: 'user_cancelled', label: 'انصراف کاربر در درگاه (کد ۱۷)', color: 'text-neutral-700' },
                { id: 'network_error', label: 'خطای شبکه شاپرک (کد ۹۶)', color: 'text-red-700' }
              ].map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setScenario(s.id as any)}
                  className={`p-2.5 rounded-xl border text-right transition-all ${
                    scenario === s.id
                      ? 'border-neutral-900 bg-neutral-900 text-white font-bold shadow-xs'
                      : 'border-neutral-200 bg-neutral-50 text-neutral-700 hover:border-neutral-300'
                  }`}
                >
                  <span className="block text-[11px]">{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isProcessing}
            className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl shadow-lg shadow-red-600/20 transition-all flex items-center justify-center gap-2 mt-4"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>در حال اتصال به سوئیچ مرکزی شاپرک...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>اجرای تست آزمایشی پرداخت ({formatToman(testAmount)})</span>
              </>
            )}
          </button>
        </form>

        {/* Live Result & Receipt Column */}
        <div className="lg:col-span-5 bg-neutral-50 rounded-3xl border border-neutral-200 p-6 flex flex-col justify-between">
          <div>
            <h4 className="font-black text-sm text-neutral-900 mb-3 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-neutral-700" />
              <span>رسید الکترونیکی پایانه شاپرک</span>
            </h4>

            {testResult ? (
              testResult.success && testResult.receipt ? (
                <div className="bg-white rounded-2xl border border-emerald-200 p-5 space-y-4 text-xs shadow-xs animate-in fade-in duration-300">
                  <div className="text-center space-y-1 pb-3 border-b border-neutral-100">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                      <Check className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-black text-emerald-700 block">پرداخت با موفقیت انجام شد</span>
                    <span className="text-[11px] text-neutral-400">{testResult.receipt.gateway}</span>
                  </div>

                  <div className="space-y-2 text-[11px] font-mono">
                    <div className="flex justify-between">
                      <span className="text-neutral-500 font-sans">مبلغ پرداختی:</span>
                      <strong className="text-neutral-900">{formatToman(testResult.receipt.amount)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500 font-sans">شماره پیگیری:</span>
                      <strong className="text-neutral-900">{testResult.receipt.trackingNumber}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500 font-sans">شماره مرجع (RRN):</span>
                      <strong className="text-neutral-900">{testResult.receipt.referenceNumber}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500 font-sans">شماره ترمینال:</span>
                      <strong className="text-neutral-900">{testResult.receipt.terminalId}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500 font-sans">کارت مبدأ:</span>
                      <strong className="text-neutral-900">{testResult.receipt.cardNumberMasked}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500 font-sans">زمان تراکنش:</span>
                      <span className="text-neutral-600 font-sans">{testResult.receipt.date}</span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-800 text-[11px] text-center font-bold font-sans">
                    {selectedOrderId 
                      ? `سفارش متصل (${selectedOrderId}) به‌صورت خودکار تأیید و وارد فرآیند انبارداری شد.`
                      : 'تراکنش آزمایشی موفق روی شبکه شاپرک ثبت شد.'}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-red-200 p-5 space-y-3 text-xs shadow-xs text-center animate-in fade-in duration-300">
                  <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                    <XCircle className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-black text-red-700 block">تراکنش ناموفق</span>
                  <p className="text-[11px] text-neutral-600 leading-relaxed font-bold">
                    {testResult.message}
                  </p>
                  <p className="text-[10px] text-neutral-400">
                    مبلغی از حساب کسر نشده است. می‌توانید با تغییر سناریو مجدداً تست نمایید.
                  </p>
                </div>
              )
            ) : (
              <div className="p-8 text-center text-neutral-400 space-y-2 border-2 border-dashed border-neutral-200 rounded-2xl">
                <Receipt className="w-8 h-8 mx-auto opacity-40" />
                <p className="text-xs">فرم مشخصات تست را تکمیل کرده و دکمه «اجرای تست پرداخت» را بزنید.</p>
                <p className="text-[10px] text-neutral-400">رسید الکترونیکی شاپرک بلافاصله در این بخش نمایان خواهد شد.</p>
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-neutral-200/80 text-[11px] text-neutral-400 text-center">
            تست درگاه هیچ تراکنش مالی واقعی انجام نمی‌دهد و تنها منطق نرم‌افزاری و وب‌هوک را اعتبارسنجی می‌کند.
          </div>
        </div>
      </div>
    </div>
  );
};
