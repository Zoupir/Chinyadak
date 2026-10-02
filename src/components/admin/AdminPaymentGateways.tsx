import React, { useEffect, useMemo, useState } from 'react';
import { CreditCard, Edit3, Eye, EyeOff, KeyRound, Save, ShieldCheck, TestTube2, X } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import type { PaymentGatewayConfig } from '../../types';

const MASK = '••••••••';

const providerHelp: Record<string, string> = {
  saman: 'برای SEP معمولاً Terminal ID کافی است. آدرس Token/Payment/Verify/Reverse فقط در صورت تغییر سرویس وارد شود.',
  mellat: 'برای به‌پرداخت ملت Terminal ID، Username و Password لازم است. WSDL و Payment URL قابل ویرایش هستند.',
  zarinpal: 'این ارائه‌دهنده فعلاً به موتور پرداخت متصل نیست؛ امکان فعال‌سازی آن تا تکمیل اتصال وجود ندارد.',
  parsian: 'این Provider فعلاً در موتور پرداخت فعال نیست؛ تنظیمات برای توسعه آینده ذخیره می‌شود.',
  cod: 'پرداخت در محل به اطلاعات محرمانه نیاز ندارد.'
};

export const AdminPaymentGateways: React.FC = () => {
  const { paymentGateways, updatePaymentGateway, toggleGatewayActive } = useStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const active = paymentGateways.find(item => item.id === editingId);
  const [form, setForm] = useState<PaymentGatewayConfig | null>(active ? { ...active } : null);
  const [showSecrets, setShowSecrets] = useState(false);

  useEffect(() => {
    const gateway = paymentGateways.find(item => item.id === editingId);
    setForm(gateway ? { ...gateway, additionalConfig: { ...(gateway.additionalConfig || {}) } } : null);
    setShowSecrets(false);
  }, [editingId, paymentGateways]);

  const supportedCount = useMemo(
    () => paymentGateways.filter(item => item.isActive && ['saman', 'mellat'].includes(item.provider)).length,
    [paymentGateways]
  );

  const patch = (partial: Partial<PaymentGatewayConfig>) =>
    setForm(current => current ? { ...current, ...partial } : current);

  const patchAdditional = (key: string, value: string) =>
    setForm(current => current ? {
      ...current,
      additionalConfig: { ...(current.additionalConfig || {}), [key]: value }
    } : current);

  const save = () => {
    if (!form) return;
    updatePaymentGateway(form);
    setEditingId(null);
  };

  const secretInput = (
    label: string,
    key: keyof Pick<PaymentGatewayConfig, 'merchantId'|'terminalId'|'username'|'password'|'apiKey'|'merchantKey'|'terminalKey'>,
    placeholder = ''
  ) => (
    <label className="block">
      <span className="block text-[10px] font-bold text-neutral-700 mb-1">{label}</span>
      <input
        type={showSecrets ? 'text' : 'password'}
        value={String(form?.[key] || '')}
        onChange={event => patch({ [key]: event.target.value } as Partial<PaymentGatewayConfig>)}
        placeholder={placeholder || MASK}
        autoComplete="new-password"
        className="w-full p-2.5 border border-neutral-300 rounded-xl text-xs font-mono text-left"
        dir="ltr"
      />
      {form?.[key] === MASK && <small className="block mt-1 text-[8px] text-emerald-700">مقدار قبلی رمزنگاری‌شده حفظ می‌شود مگر مقدار جدید وارد کنید.</small>}
    </label>
  );

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-3xl border border-neutral-200 p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-neutral-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              درگاه‌های بانکی
            </h2>
            <p className="text-xs text-neutral-500 mt-1">
              اطلاعات حساس با AES-256-GCM رمزنگاری می‌شود و هیچ Merchant/Password واقعی در API عمومی فروشگاه برگردانده نمی‌شود.
            </p>
          </div>
          <div className="flex items-center gap-2 text-[10px]">
            <span className="px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 font-bold inline-flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> {supportedCount.toLocaleString('fa-IR')} درگاه عملیاتی فعال
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {paymentGateways.map(gateway => {
          const supported = ['saman','mellat'].includes(gateway.provider);
          return (
            <article key={gateway.id} className="bg-white rounded-3xl border border-neutral-200 p-5 shadow-xs space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-2xl grid place-items-center ${gateway.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-neutral-500'}`}>
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm">{gateway.name}</h3>
                    <span className="text-[9px] text-neutral-400 font-mono uppercase">{gateway.provider}</span>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={!supported}
                  onClick={() => supported && toggleGatewayActive(gateway.id)}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-black ${!supported ? 'bg-amber-50 text-amber-700 cursor-not-allowed' : gateway.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-100 text-neutral-500'}`}
                >
                  {!supported ? 'پشتیبانی‌نشده' : gateway.isActive ? 'فعال' : 'غیرفعال'}
                </button>
              </div>

              <p className="text-[10px] text-neutral-500 leading-6">{gateway.description || providerHelp[gateway.provider]}</p>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl bg-neutral-50">
                  <span className="block text-[8px] text-neutral-400">شناسه پایانه / پذیرنده</span>
                  <strong className="block mt-1 text-[10px] font-mono">{gateway.terminalId || gateway.merchantId || 'تنظیم نشده'}</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-neutral-50">
                  <span className="block text-[8px] text-neutral-400">محیط</span>
                  <strong className="block mt-1 text-[10px]">{gateway.isSandbox ? 'آزمایشی' : 'واقعی'}</strong>
                </div>
              </div>

              {!supported && gateway.provider !== 'cod' && (
                <div className="p-2.5 rounded-xl bg-amber-50 text-amber-800 text-[9px] font-bold">
                  تنظیمات ذخیره می‌شود، اما Adapter عملیاتی این Provider هنوز به موتور پرداخت متصل نیست.
                </div>
              )}

              <button
                type="button"
                onClick={() => setEditingId(gateway.id)}
                className="w-full py-2.5 rounded-xl bg-neutral-900 text-white text-xs font-black inline-flex items-center justify-center gap-2"
              >
                <Edit3 className="w-4 h-4" /> ویرایش کدها و تنظیمات
              </button>
            </article>
          );
        })}
      </div>

      {form && (
        <div className="fixed inset-0 z-[220] bg-black/65 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto" onClick={() => setEditingId(null)}>
          <div className="w-full max-w-5xl mx-auto my-3 sm:my-8 bg-white rounded-3xl shadow-2xl overflow-hidden" onClick={event => event.stopPropagation()}>
            <header className="sticky top-0 z-10 p-4 sm:p-5 border-b bg-white flex items-center justify-between gap-4">
              <div>
                <h3 className="font-black text-base">ویرایش {form.name}</h3>
                <p className="text-[9px] text-neutral-500 mt-1">{providerHelp[form.provider] || 'تنظیمات اتصال درگاه'}</p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setShowSecrets(value => !value)} className="h-9 px-3 rounded-xl bg-neutral-100 text-[10px] font-bold inline-flex items-center gap-1">
                  {showSecrets ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />} {showSecrets ? 'پنهان' : 'نمایش فیلدها'}
                </button>
                <button type="button" onClick={() => setEditingId(null)} className="w-9 h-9 grid place-items-center rounded-xl bg-neutral-100"><X className="w-4 h-4" /></button>
              </div>
            </header>

            <div className="p-5 sm:p-6 space-y-6">
              <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block">
                  <span className="block text-[10px] font-bold mb-1">نام نمایشی</span>
                  <input value={form.name} onChange={e => patch({name:e.target.value})} className="w-full p-2.5 border rounded-xl text-xs" />
                </label>
                <label className="block">
                  <span className="block text-[10px] font-bold mb-1">ارائه‌دهنده</span>
                  <input value={form.provider} readOnly className="w-full p-2.5 border rounded-xl bg-neutral-50 text-xs font-mono text-left" dir="ltr" />
                </label>
                <label className="md:col-span-2">
                  <span className="block text-[10px] font-bold mb-1">توضیح</span>
                  <textarea rows={2} value={form.description || ''} onChange={e => patch({description:e.target.value})} className="w-full p-2.5 border rounded-xl text-xs" />
                </label>
                <label className="p-3 rounded-xl border flex items-center justify-between">
                  <span className="text-[10px] font-bold">درگاه فعال باشد</span>
                  <input
                    type="checkbox"
                    disabled={!['saman','mellat'].includes(form.provider)}
                    checked={['saman','mellat'].includes(form.provider) ? form.isActive : false}
                    onChange={e => patch({isActive:e.target.checked})}
                  />
                </label>
                <label className="p-3 rounded-xl border flex items-center justify-between">
                  <span className="text-[10px] font-bold inline-flex items-center gap-1"><TestTube2 className="w-4 h-4" /> حالت آزمایشی</span>
                  <input type="checkbox" checked={form.isSandbox} onChange={e => patch({isSandbox:e.target.checked})} />
                </label>
              </section>

              <section className="rounded-2xl border border-blue-200 bg-blue-50/30 p-4 space-y-4">
                <h4 className="font-black text-sm flex items-center gap-2"><KeyRound className="w-4 h-4 text-blue-600" /> شناسه‌ها و کلیدهای محرمانه</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {secretInput('Merchant ID', 'merchantId')}
                  {secretInput('Terminal ID', 'terminalId')}
                  {form.provider === 'mellat' && secretInput('Username', 'username')}
                  {form.provider === 'mellat' && secretInput('Password', 'password')}
                  {!['saman','mellat','cod'].includes(form.provider) && secretInput('API Key', 'apiKey')}
                  {!['saman','mellat','cod'].includes(form.provider) && secretInput('Merchant Key', 'merchantKey')}
                  {!['saman','mellat','cod'].includes(form.provider) && secretInput('Terminal Key', 'terminalKey')}
                </div>
              </section>

              <section className="rounded-2xl border border-neutral-200 p-4 space-y-4">
                <h4 className="font-black text-sm">نشانی‌های اتصال</h4>
                <div className="grid grid-cols-1 gap-3">
                  <label><span className="block text-[9px] font-bold mb-1">{form.provider === 'mellat' ? 'WSDL URL' : 'Token / API Endpoint'}</span><input dir="ltr" value={form.endpoint || ''} onChange={e => patch({endpoint:e.target.value})} className="w-full p-2.5 border rounded-xl text-xs text-left font-mono" /></label>
                  <label><span className="block text-[9px] font-bold mb-1">Payment URL</span><input dir="ltr" value={form.paymentUrl || ''} onChange={e => patch({paymentUrl:e.target.value})} className="w-full p-2.5 border rounded-xl text-xs text-left font-mono" /></label>
                  <label><span className="block text-[9px] font-bold mb-1">Callback URL سفارشی (اختیاری)</span><input dir="ltr" value={form.callbackUrl || ''} onChange={e => patch({callbackUrl:e.target.value})} className="w-full p-2.5 border rounded-xl text-xs text-left font-mono" /></label>
                </div>

                {form.provider === 'saman' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <label><span className="block text-[9px] font-bold mb-1">Verify URL</span><input dir="ltr" value={form.additionalConfig?.verifyUrl || ''} onChange={e => patchAdditional('verifyUrl',e.target.value)} className="w-full p-2.5 border rounded-xl text-xs text-left font-mono" /></label>
                    <label><span className="block text-[9px] font-bold mb-1">Reverse URL</span><input dir="ltr" value={form.additionalConfig?.reverseUrl || ''} onChange={e => patchAdditional('reverseUrl',e.target.value)} className="w-full p-2.5 border rounded-xl text-xs text-left font-mono" /></label>
                  </div>
                )}
              </section>

              <div className="flex gap-2">
                <button type="button" onClick={() => setEditingId(null)} className="flex-1 py-3 rounded-xl bg-neutral-100 text-neutral-700 text-xs font-bold">انصراف</button>
                <button type="button" onClick={save} className="flex-1 py-3 rounded-xl bg-emerald-600 text-white text-xs font-black inline-flex items-center justify-center gap-2"><Save className="w-4 h-4" /> ذخیره امن تنظیمات</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
