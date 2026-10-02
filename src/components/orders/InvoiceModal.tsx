import React from 'react';
import { Order, SiteSettings } from '../../types';
import { formatToman } from '../../utils/formatters';
import { Printer, X, Download, ShieldCheck, CheckCircle2, Wrench, Building2, User, Phone, MapPin, Hash, Calendar, CreditCard, Sparkles, Coins } from 'lucide-react';

interface InvoiceModalProps {
  order: Order | null;
  settings: SiteSettings;
  onClose: () => void;
  onOpenDedicatedPage?: (orderId: string) => void;
}

// Convert numbers to Persian text words (simplified for currency totals)
function numberToPersianWords(amount: number): string {
  if (amount <= 0) return 'صفر تومان';
  const units = ['', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه'];
  const teens = ['ده', 'یازده', 'دوازده', 'سیزده', 'چهارده', 'پانزده', 'شانزده', 'هفده', 'هجده', 'نوزده'];
  const tens = ['', 'ده', 'بیست', 'سی', 'چهل', 'پنجاه', 'شصت', 'هفتاد', 'هشتاد', 'نود'];
  const hundreds = ['', 'یکصد', 'دویست', 'سیصد', 'چهارصد', 'پانصد', 'ششصد', 'هفتصد', 'هشتصد', 'نهصد'];
  const thousands = ['', 'هزار', 'میلیون', 'میلیارد'];

  // For very common store amounts, create clean representation
  const millions = Math.floor(amount / 1000000);
  const rem1 = amount % 1000000;
  const th = Math.floor(rem1 / 1000);
  const rem2 = rem1 % 1000;

  const parts: string[] = [];
  if (millions > 0) parts.push(`${millions} میلیون`);
  if (th > 0) parts.push(`${th} هزار`);
  if (rem2 > 0) parts.push(`${rem2}`);

  return (parts.length > 0 ? parts.join(' و ') : `${amount}`) + ' تومان';
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ order, settings, onClose, onOpenDedicatedPage }) => {
  if (!order) return null;

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handlePrint = () => {
    window.print();
  };

  const sellerName = settings.sellerName || 'شرکت بازرگانی قطعات خودروهای چینی چین‌پارت (با مسئولیت محدود)';
  const sellerEco = settings.sellerEconomicCode || '۴۱۱۵۸۹۳۲۴۵۶۷';
  const sellerNational = settings.sellerNationalId || '۱۴۰۰۹۸۵۴۳۲۱';
  const sellerReg = settings.sellerRegistrationNo || '۵۸۴۹۲۰';
  const sellerPostal = settings.sellerPostalCode || '۱۱۴۳۹۸۷۶۵۴';
  const sellerPhone = settings.sellerPhone || settings.contactPhone || '۰۲۱-۸۸۹۹۲۲۱۱';
  const sellerAddress = settings.sellerAddress || settings.address || 'تهران، خیابان امیرکبیر (چراغ برق)، کوچه سراج، پاساژ کاشانی، طبقه همکف، پلاک ۲۸';

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto p-2 sm:p-6 bg-black/75 backdrop-blur-xs flex justify-center items-start text-right"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-3xl max-w-4xl w-full my-4 sm:my-8 overflow-hidden shadow-2xl border border-neutral-200 text-right print:shadow-none print:border-none print:m-0 print:p-0 print:max-w-none print:w-full relative">
        
        {/* Top Control Bar (Hidden in Print) - Sticky */}
        <div className="sticky top-0 z-30 bg-neutral-900 text-white p-4 px-6 flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 print:hidden shadow-md">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-bold text-sm">پیش‌فاکتور و صورت‌حساب رسمی فروش</span>
            <span className="font-mono text-xs bg-neutral-800 px-2 py-0.5 rounded text-neutral-300">
              {order.orderNumber}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onOpenDedicatedPage && (
              <button
                onClick={() => {
                  onClose();
                  onOpenDedicatedPage(order.id);
                }}
                className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-neutral-700"
                title="نمایش در صفحه مجزا بدون پاپ‌آپ"
              >
                صفحه جداگانه و PDF
              </button>
            )}
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>چاپ فاکتور رسمی (A4)</span>
            </button>
            <button
              onClick={onClose}
              className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
              title="بستن پنجره فاکتور (Esc)"
            >
              <X className="w-4 h-4" />
              <span>بستن</span>
            </button>
          </div>
        </div>

        {/* =========================================================================
            A4 OFFICIAL TAX INVOICE PRINTABLE CONTAINER
        ========================================================================= */}
        <div id="invoice-printable" className="p-6 sm:p-10 space-y-6 text-neutral-900 text-xs bg-white">
          
          {/* 1. Official Header */}
          <div className="border-2 border-neutral-900 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 bg-neutral-50/50">
            {/* Logo & Brand */}
            <div className="flex items-center gap-3">
              {settings.logoUrl ? (
                <img src={settings.logoUrl} alt={settings.siteTitle} className="h-14 w-auto object-contain" />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-red-600 flex items-center justify-center text-white font-black text-xl shadow-md">
                  <Wrench className="w-6 h-6" />
                </div>
              )}
              <div>
                <h1 className="font-black text-base sm:text-lg text-neutral-900 tracking-tight">
                  {settings.siteTitle || 'فروشگاه تخصصی قطعات خودروهای چینی چین‌پارت'}
                </h1>
                <p className="text-[11px] text-neutral-500 font-semibold mt-0.5">
                  صورت‌حساب فروش کالا و خدمات الکترونیک (سامانه مودیان)
                </p>
              </div>
            </div>

            {/* Official Meta Serial & Date */}
            <div className="text-left space-y-1 text-[11px] border-r-2 sm:border-r border-neutral-300 pr-4 sm:pr-6">
              <div className="flex items-center justify-between sm:justify-start gap-3">
                <span className="text-neutral-500">شماره ستومان فاکتور:</span>
                <strong className="font-mono text-red-600 text-sm font-black">{order.orderNumber}</strong>
              </div>
              <div className="flex items-center justify-between sm:justify-start gap-3">
                <span className="text-neutral-500">تاریخ صدور:</span>
                <strong className="font-mono text-neutral-800">{order.date}</strong>
              </div>
              <div className="flex items-center justify-between sm:justify-start gap-3">
                <span className="text-neutral-500">وضعیت سفارش:</span>
                <span className="px-2 py-0.2 rounded-md font-bold text-[10px] bg-emerald-100 text-emerald-800">
                  {order.statusTitle || 'پرداخت و تایید شده'}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Seller Information Box */}
          <div className="border border-neutral-300 rounded-xl overflow-hidden">
            <div className="bg-neutral-100 px-4 py-2 font-black text-xs text-neutral-800 flex items-center gap-2 border-b border-neutral-300">
              <Building2 className="w-4 h-4 text-red-600" />
              <span>مشخصات فروشنده (ارائه‌دهنده کالا و خدمات)</span>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px]">
              <div>
                <span className="text-neutral-500">نام شخص حقیقی/حقوقی:</span>
                <strong className="block text-neutral-900 font-bold mt-0.5">{sellerName}</strong>
              </div>
              <div>
                <span className="text-neutral-500">شماره اقتصادی:</span>
                <strong className="block font-mono text-neutral-900 font-bold mt-0.5">{sellerEco}</strong>
              </div>
              <div>
                <span className="text-neutral-500">شناسه ملی / ثبت:</span>
                <strong className="block font-mono text-neutral-900 font-bold mt-0.5">{sellerNational} (ثبت: {sellerReg})</strong>
              </div>
              <div className="sm:col-span-2">
                <span className="text-neutral-500">نشانی کامل پستی:</span>
                <span className="block text-neutral-800 mt-0.5">{sellerAddress}</span>
              </div>
              <div>
                <span className="text-neutral-500">تلفن تماس و کد پستی:</span>
                <span className="block font-mono text-neutral-900 font-bold mt-0.5">{sellerPhone} | {sellerPostal}</span>
              </div>
            </div>
          </div>

          {/* 3. Buyer Information Box */}
          <div className="border border-neutral-300 rounded-xl overflow-hidden">
            <div className="bg-neutral-100 px-4 py-2 font-black text-xs text-neutral-800 flex items-center gap-2 border-b border-neutral-300">
              <User className="w-4 h-4 text-blue-600" />
              <span>مشخصات خریدار (تحویل‌گیرنده سفارش)</span>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px]">
              <div>
                <span className="text-neutral-500">نام و نام خانوادگی خریدار:</span>
                <strong className="block text-neutral-900 font-bold mt-0.5">
                  {order.customer.firstName} {order.customer.lastName}
                </strong>
              </div>
              <div>
                <span className="text-neutral-500">شماره همراه تماس:</span>
                <strong className="block font-mono text-neutral-900 font-bold mt-0.5">{order.customer.phone}</strong>
              </div>
              <div>
                <span className="text-neutral-500">استان و شهر مقصد:</span>
                <strong className="block text-neutral-900 font-bold mt-0.5">
                  {order.customer.province} - {order.customer.city}
                </strong>
              </div>
              <div className="sm:col-span-2">
                <span className="text-neutral-500">نشانی دقیق محل تحویل:</span>
                <span className="block text-neutral-800 mt-0.5">{order.customer.address}</span>
              </div>
              <div>
                <span className="text-neutral-500">کد پستی ۱۰ رقمی:</span>
                <span className="block font-mono text-neutral-900 font-bold mt-0.5">
                  {order.customer.postalCode || 'ثبت نشده'}
                </span>
              </div>
            </div>
          </div>

          {/* 4. Goods & Services Itemized Table */}
          <div className="border border-neutral-300 rounded-xl overflow-hidden">
            <table className="w-full text-right text-[11px] divide-y divide-neutral-200">
              <thead className="bg-neutral-100 font-black text-neutral-800">
                <tr>
                  <th className="p-2.5 text-center w-10">ردیف</th>
                  <th className="p-2.5 w-24">کد کالا (OEM)</th>
                  <th className="p-2.5">شرح کالا یا قطعه یدکی</th>
                  <th className="p-2.5 text-center w-20">گرید کیفی</th>
                  <th className="p-2.5 text-center w-14">تعداد</th>
                  <th className="p-2.5 text-left w-28">مبلغ واحد (تومان)</th>
                  <th className="p-2.5 text-left w-24">تخفیف</th>
                  <th className="p-2.5 text-left w-32">مبلغ کل (تومان)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {order.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-neutral-50/50">
                    <td className="p-2.5 text-center font-mono font-bold text-neutral-500">{idx + 1}</td>
                    <td className="p-2.5 font-mono text-neutral-700 text-[10px]">{item.oemNumber}</td>
                    <td className="p-2.5">
                      <div className="font-bold text-neutral-900">{item.productName}</div>
                      {item.vehicleInfo && (
                        <div className="text-[10px] text-neutral-500">خودرو: {item.vehicleInfo}</div>
                      )}
                    </td>
                    <td className="p-2.5 text-center">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-200 font-semibold text-neutral-800">
                        {item.grade === 'genuine' ? 'شرکتی' : item.grade === 'oem' ? 'وارداتی' : 'استاندارد'}
                      </span>
                    </td>
                    <td className="p-2.5 text-center font-mono font-bold text-neutral-900">{item.quantity} عدد</td>
                    <td className="p-2.5 text-left font-mono">{formatToman(item.price)}</td>
                    <td className="p-2.5 text-left font-mono text-neutral-500">۰</td>
                    <td className="p-2.5 text-left font-mono font-bold text-neutral-900">
                      {formatToman(item.price * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 5. Totals & Tax Calculation Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            
            {/* Payment & Terms notes */}
            <div className="border border-neutral-200 rounded-xl p-4 space-y-2 text-[11px] bg-neutral-50/60">
              <div className="font-bold text-neutral-800 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                <span>اطلاعات پرداخت و روش تحویل:</span>
              </div>
              <p className="text-neutral-600 leading-relaxed">
                • روش تسویه: <strong>{order.paymentMethod.title}</strong>
              </p>
              <p className="text-neutral-600 leading-relaxed">
                • شیوه ارسال: <strong>{order.shippingMethod.title}</strong>
              </p>
              {order.trackingPostCode && (
                <p className="text-neutral-700 font-semibold">
                  • شماره بارنامه / کد رهگیری پستی: <span className="font-mono text-red-600 font-black">{order.trackingPostCode}</span>
                </p>
              )}
              <div className="pt-2 text-[10px] text-neutral-500 border-t border-neutral-200">
                کلیه قطعات عرضه شده دارای ۷ روز ضمانت بازگشت وجه، تست سلامت فیزیکی و اصالت هولوگرام شرکتی می‌باشند.
              </div>
            </div>

            {/* Calculations Table */}
            <div className="border border-neutral-300 rounded-xl overflow-hidden divide-y divide-neutral-200 text-xs">
              <div className="p-3 flex justify-between items-center bg-white">
                <span className="text-neutral-600">مجموع اقلام فاکتور:</span>
                <span className="font-mono font-bold">{formatToman(order.subtotal)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="p-3 flex justify-between items-center bg-red-50/50 text-red-700">
                  <span>تخفیف ویژه کوپن:</span>
                  <span className="font-mono font-bold">-{formatToman(order.discountAmount)}</span>
                </div>
              )}
              {order.loyaltyPointsRedeemed && order.loyaltyPointsRedeemed > 0 ? (
                <div className="p-3 flex justify-between items-center bg-amber-50/70 text-amber-900 border-t border-amber-200">
                  <span className="flex items-center gap-1 font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>تخفیف امتیاز باشگاه مشتریان ({order.loyaltyPointsRedeemed} امتیاز):</span>
                  </span>
                  <span className="font-mono font-bold text-amber-800">
                    -{formatToman(order.loyaltyDiscountAmount || 0)}
                  </span>
                </div>
              ) : null}
              <div className="p-3 flex justify-between items-center bg-white">
                <span className="text-neutral-600">هزینه بسته‌بندی ایمن و ارسال:</span>
                <span className="font-mono font-bold">
                  {order.shippingFee === 0 ? 'رایگان (طرح ویژه)' : formatToman(order.shippingFee)}
                </span>
              </div>
              <div className="p-3 flex justify-between items-center bg-white">
                <span className="text-neutral-600">مالیات بر ارزش افزوده و عوارض:</span>
                <span className="font-mono font-bold text-neutral-500">۰ تومان (معاف)</span>
              </div>
              <div className="p-3.5 flex justify-between items-center bg-neutral-900 text-white font-black text-sm">
                <span>مبلغ نهایی قابل پرداخت:</span>
                <span className="font-mono text-base text-red-400">{formatToman(order.total)}</span>
              </div>
              {order.loyaltyPointsEarned && order.loyaltyPointsEarned > 0 ? (
                <div className="p-2.5 flex justify-between items-center bg-emerald-50 text-emerald-800 text-[11px] font-bold">
                  <span className="flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-emerald-600" />
                    <span>امتیاز وفاداری افزوده شده از این خرید:</span>
                  </span>
                  <span className="font-mono font-bold text-emerald-700">+{order.loyaltyPointsEarned} امتیاز</span>
                </div>
              ) : null}
            </div>
          </div>

          {/* Amount in Words */}
          <div className="p-3 bg-neutral-100 rounded-xl text-neutral-800 text-xs flex items-center justify-between border border-neutral-300">
            <span>مبلغ قابل پرداخت به حروف:</span>
            <strong className="text-red-700 font-bold">{numberToPersianWords(order.total)}</strong>
          </div>

          {/* 6. Signature & Official Stamp Section */}
          <div className="grid grid-cols-2 gap-8 pt-4">
            <div className="border border-dashed border-neutral-300 rounded-xl p-5 text-center space-y-3 min-h-[120px] relative">
              <span className="text-xs font-bold text-neutral-600 block">مهر و امضای فروشنده (چین‌پارت)</span>
              {/* Digital Stamp Simulation */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 border-red-600 text-red-600 text-[10px] font-black rotate-[-4deg] opacity-80 shadow-xs">
                <ShieldCheck className="w-4 h-4" />
                <span>تایید حسابداری و انبارداری مرکزی</span>
              </div>
            </div>

            <div className="border border-dashed border-neutral-300 rounded-xl p-5 text-center space-y-3 min-h-[120px]">
              <span className="text-xs font-bold text-neutral-600 block">امضا و اثر انگشت خریدار / تحویل‌گیرنده</span>
              <p className="text-[10px] text-neutral-400 pt-6">کالاها در سلامت کامل فیزیکی تحویل گرفته شد.</p>
            </div>
          </div>

        </div>

        {/* Bottom Control Bar (Hidden in Print) */}
        <div className="bg-neutral-100 p-4 px-6 border-t border-neutral-200 flex items-center justify-between print:hidden">
          <span className="text-xs text-neutral-500">
            برای خروج کلید Esc را بفشارید یا روی دکمه بستن کلیک کنید.
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>چاپ فاکتور رسمی</span>
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>بستن فاکتور</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
