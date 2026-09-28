import React, { useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { formatToman } from '../../utils/formatters';
import { 
  Printer, 
  Download, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  Wrench, 
  Building2, 
  User, 
  Phone, 
  MapPin, 
  Hash, 
  Calendar, 
  CreditCard,
  QrCode,
  FileCheck2,
  AlertCircle,
  Sparkles,
  Coins
} from 'lucide-react';

interface InvoicePageViewProps {
  orderId?: string;
  onNavigate: (view: string, param?: string) => void;
}

// Convert numbers to Persian text words
function numberToPersianWords(amount: number): string {
  if (amount <= 0) return 'صفر ریال';
  const units = ['', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه'];
  const teens = ['ده', 'یازده', 'دوازده', 'سیزده', 'چهارده', 'پانزده', 'شانزده', 'هفده', 'هجده', 'نوزده'];
  const tens = ['', 'ده', 'بیست', 'سی', 'چهل', 'پنجاه', 'شصت', 'هفتاد', 'هشتاد', 'نود'];
  const hundreds = ['', 'یکصد', 'دویست', 'سیصد', 'چهارصد', 'پانصد', 'ششصد', 'هفتصد', 'هشتصد', 'نهصد'];

  const billions = Math.floor(amount / 1000000000);
  const remBillions = amount % 1000000000;
  const millions = Math.floor(remBillions / 1000000);
  const remMillions = remBillions % 1000000;
  const thousands = Math.floor(remMillions / 1000);
  const remaining = remMillions % 1000;

  const parts: string[] = [];
  if (billions > 0) parts.push(`${billions} میلیارد`);
  if (millions > 0) parts.push(`${millions} میلیون`);
  if (thousands > 0) parts.push(`${thousands} هزار`);
  if (remaining > 0) parts.push(`${remaining}`);

  return (parts.length > 0 ? parts.join(' و ') : `${amount}`) + ' ریال';
}

export const InvoicePageView: React.FC<InvoicePageViewProps> = ({ orderId, onNavigate }) => {
  const { orders, settings, showToast } = useStore();
  const invoiceRef = useRef<HTMLDivElement>(null);

  // Find order by ID or orderNumber or fallback to latest order
  const order = orders.find(o => o.id === orderId || o.orderNumber === orderId) || orders[0];

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    window.print();
    showToast('در پنجره چاپ، گزینه "Save as PDF" را انتخاب نمایید تا فایل PDF ذخیره شود.', 'info');
  };

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="text-xl font-bold">سفارشی برای نمایش فاکتور یافت نشد</h2>
        <button
          onClick={() => onNavigate('shop')}
          className="px-6 py-2.5 bg-red-600 text-white rounded-xl text-xs font-bold"
        >
          بازگشت به فروشگاه
        </button>
      </div>
    );
  }

  const sellerName = settings.sellerName || 'شرکت بازرگانی قطعات خودروهای چینی چین‌پارت (با مسئولیت محدود)';
  const sellerEco = settings.sellerEconomicCode || '۴۱۱۵۸۹۳۲۴۵۶۷';
  const sellerNational = settings.sellerNationalId || '۱۴۰۰۹۸۵۴۳۲۱';
  const sellerReg = settings.sellerRegistrationNo || '۵۸۴۹۲۰';
  const sellerPostal = settings.sellerPostalCode || '۱۱۴۳۹۸۷۶۵۴';
  const sellerPhone = settings.sellerPhone || settings.contactPhone || '۰۲۱-۸۸۹۹۲۲۱۱';
  const sellerAddress = settings.sellerAddress || settings.address || 'تهران، خیابان امیرکبیر (چراغ برق)، کوچه سراج، پاساژ کاشانی، طبقه همکف، پلاک ۲۸';

  return (
    <div className="min-h-screen bg-neutral-100 py-8 px-2 sm:px-6 print:p-0 print:bg-white text-right">
      
      {/* =========================================================================
          TOP ACTION BAR (SCREEN ONLY, HIDDEN IN PRINT)
      ========================================================================= */}
      <div className="max-w-5xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-3 bg-neutral-900 text-white p-4 px-6 rounded-2xl shadow-xl print:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('account', 'orders')}
            className="p-2 hover:bg-neutral-800 rounded-xl transition-colors text-neutral-300 hover:text-white flex items-center gap-1.5 text-xs font-bold cursor-pointer"
            title="بازگشت به تاریخچه سفارش‌ها"
          >
            <ArrowRight className="w-4 h-4" />
            <span>بازگشت</span>
          </button>
          <div className="h-5 w-px bg-neutral-700"></div>
          <div>
            <h1 className="text-sm font-black flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-emerald-400" />
              <span>صورت‌حساب رسمی فروش کالا و خدمات</span>
            </h1>
            <p className="text-[11px] text-neutral-400 font-mono mt-0.5">
              شماره پیگیری مالی: {order.orderNumber}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleDownloadPdf}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-neutral-700"
          >
            <Download className="w-4 h-4 text-blue-400" />
            <span>ذخیره PDF</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-lg shadow-red-600/30 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>چاپ مستقیم فاکتور (A4)</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          OFFICIAL A4 PRINTABLE INVOICE SHEET (NEVER CLIPPED, NATURAL SCROLL)
      ========================================================================= */}
      <div 
        ref={invoiceRef}
        id="invoice-printable"
        className="max-w-5xl mx-auto bg-white rounded-3xl shadow-xl border border-neutral-200 p-6 sm:p-12 space-y-6 text-neutral-900 text-xs print:shadow-none print:border-none print:m-0 print:p-0 print:max-w-none print:w-full print:rounded-none"
      >
        
        {/* 1. Official Header */}
        <div className="border-2 border-neutral-900 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 bg-neutral-50/70">
          <div className="flex items-center gap-3.5">
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt={settings.siteTitle} className="h-16 w-auto object-contain" />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white font-black text-2xl shadow-md">
                <Wrench className="w-7 h-7" />
              </div>
            )}
            <div>
              <h2 className="font-black text-base sm:text-lg text-neutral-900 tracking-tight">
                {settings.siteTitle || 'فروشگاه تخصصی قطعات خودروهای چینی چین‌پارت'}
              </h2>
              <p className="text-[11px] text-neutral-500 font-semibold mt-0.5">
                {settings.siteSlogan || 'تامین مستقیم قطعات اصلی شرکتی با ضمانت فیتمنت و بازگشت وجه'}
              </p>
              <div className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-md text-[10px] font-bold border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" />
                <span>فاکتور رسمی الکترونیکی معتبر در سامانه مودیان مالیاتی</span>
              </div>
            </div>
          </div>

          {/* Invoice Meta Box & Barcode */}
          <div className="w-full sm:w-auto p-3.5 bg-white border border-neutral-300 rounded-xl space-y-1.5 text-[11px] font-mono shrink-0 shadow-xs">
            <div className="flex items-center justify-between gap-4">
              <span className="text-neutral-500 font-sans">شماره سریال فاکتور:</span>
              <span className="font-bold text-neutral-900">{order.orderNumber}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-neutral-500 font-sans">تاریخ صدور:</span>
              <span className="font-bold">{order.date}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-neutral-500 font-sans">پیگیری پستی/تیپاکس:</span>
              <span className="font-bold text-red-600">{order.trackingPostCode || 'TPX-984210'}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-neutral-500 font-sans">وضعیت تسویه:</span>
              <span className="text-emerald-700 font-sans font-bold">پرداخت کامل بانکی</span>
            </div>
          </div>
        </div>

        {/* 2. Seller and Buyer Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Seller Card */}
          <div className="border border-neutral-300 rounded-2xl p-4 bg-neutral-50/50 space-y-2.5">
            <div className="flex items-center gap-2 pb-2 border-b border-neutral-200 text-neutral-800 font-black text-xs">
              <Building2 className="w-4 h-4 text-red-600" />
              <span>مشخصات فروشنده (عرضه‌کننده)</span>
            </div>
            <div className="space-y-1.5 text-[11px]">
              <div><strong className="text-neutral-600 font-medium">نام شخص حقوقی: </strong><span className="font-bold">{sellerName}</span></div>
              <div className="grid grid-cols-2 gap-2">
                <div><strong className="text-neutral-600 font-medium">شماره اقتصادی: </strong><span className="font-mono font-bold">{sellerEco}</span></div>
                <div><strong className="text-neutral-600 font-medium">شناسه ملی: </strong><span className="font-mono font-bold">{sellerNational}</span></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><strong className="text-neutral-600 font-medium">شماره ثبت: </strong><span className="font-mono">{sellerReg}</span></div>
                <div><strong className="text-neutral-600 font-medium">کد پستی: </strong><span className="font-mono">{sellerPostal}</span></div>
              </div>
              <div><strong className="text-neutral-600 font-medium">تلفن پشتیبانی و انبار: </strong><span className="font-mono">{sellerPhone}</span></div>
              <div><strong className="text-neutral-600 font-medium">نشانی دفتر مرکزی و انبار: </strong><span>{sellerAddress}</span></div>
            </div>
          </div>

          {/* Buyer Card */}
          <div className="border border-neutral-300 rounded-2xl p-4 bg-neutral-50/50 space-y-2.5">
            <div className="flex items-center gap-2 pb-2 border-b border-neutral-200 text-neutral-800 font-black text-xs">
              <User className="w-4 h-4 text-blue-600" />
              <span>مشخصات خریدار (تحویل‌گیرنده سفارش)</span>
            </div>
            <div className="space-y-1.5 text-[11px]">
              <div>
                <strong className="text-neutral-600 font-medium">نام و نام خانوادگی خریدار: </strong>
                <span className="font-bold text-neutral-900">{order.customer.firstName} {order.customer.lastName}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><strong className="text-neutral-600 font-medium">شماره همراه تماس: </strong><span className="font-mono font-bold">{order.customer.phone}</span></div>
                <div><strong className="text-neutral-600 font-medium">کد پستی مقصد: </strong><span className="font-mono font-bold">{order.customer.postalCode || '۱۴۹۸۳۲۵۴۱۱'}</span></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><strong className="text-neutral-600 font-medium">استان و شهر: </strong><span>{order.customer.province}، {order.customer.city}</span></div>
                <div><strong className="text-neutral-600 font-medium">شیوه ارسال: </strong><span>{order.shippingMethod?.title || 'ارسال اکسپرس'}</span></div>
              </div>
              <div><strong className="text-neutral-600 font-medium">آدرس کامل تحویل کالا: </strong><span>{order.customer.address}</span></div>
              {order.customer.notes && (
                <div className="text-neutral-500 italic"><strong className="text-neutral-600 not-italic">یادداشت مشتری: </strong>{order.customer.notes}</div>
              )}
            </div>
          </div>

        </div>

        {/* 3. Detailed Itemized Table */}
        <div className="border border-neutral-300 rounded-2xl overflow-hidden shadow-xs">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-neutral-900 text-white text-[11px] font-black">
                <th className="p-3 w-10 text-center">ردیف</th>
                <th className="p-3">شرح کامل قطعه و مشخصات فنی</th>
                <th className="p-3 text-center">کد فنی OEM</th>
                <th className="p-3 text-center">گرید کیفی</th>
                <th className="p-3 text-center w-14">تعداد</th>
                <th className="p-3 text-left">مبلغ واحد (ریال)</th>
                <th className="p-3 text-left">مبلغ کل (ریال)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 text-[11px]">
              {order.items.map((item, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-neutral-50/50'}>
                  <td className="p-3 text-center font-mono font-bold text-neutral-500">{idx + 1}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2.5">
                      {item.image && (
                        <img 
                          src={item.image} 
                          alt="" 
                          className="w-10 h-10 object-cover rounded-lg border border-neutral-200 bg-white shrink-0" 
                        />
                      )}
                      <div>
                        <div className="font-bold text-neutral-900">{item.productName}</div>
                        {item.vehicleInfo && (
                          <div className="text-[10px] text-neutral-500">خودروی منطبق: {item.vehicleInfo}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-center font-mono font-bold text-neutral-700">{item.oemNumber || '---'}</td>
                  <td className="p-3 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 text-neutral-800 border border-neutral-200">
                      {item.grade === 'genuine' ? 'اصلی شرکتی' : item.grade === 'oem' ? 'وارداتی OEM' : 'استاندارد'}
                    </span>
                  </td>
                  <td className="p-3 text-center font-mono font-bold">{item.quantity}</td>
                  <td className="p-3 text-left font-mono font-bold">{item.price.toLocaleString('fa-IR')}</td>
                  <td className="p-3 text-left font-mono font-bold text-neutral-900">
                    {(item.price * item.quantity).toLocaleString('fa-IR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 4. Financial Calculations & Summary */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          
          {/* Notes & Security Stamp */}
          <div className="md:col-span-7 space-y-3 p-4 bg-neutral-50 rounded-2xl border border-neutral-200 text-[11px] text-neutral-600">
            <h4 className="font-bold text-neutral-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>شرایط گارانتی اصالت و قوانین استرداد چین‌پارت</span>
            </h4>
            <ul className="list-disc pr-4 space-y-1 leading-relaxed">
              <li>تمامی قطعات دارای هولوگرام لیزری و کد رهگیری اصالت از نمایندگی‌های مادر می‌باشند.</li>
              <li>مهلت تست و تطبیق فیتمنت قطعه بر روی خودرو ۷ روز از تاریخ دریافت مرسوله می‌باشد.</li>
              <li>در صورت باز نشدن پلمپ کارتن فابریک، امکان بازگشت کالا و استرداد آنی وجه فراهم است.</li>
            </ul>
          </div>

          {/* Amount Breakdown Box */}
          <div className="md:col-span-5 border border-neutral-300 rounded-2xl overflow-hidden divide-y divide-neutral-200 text-xs shadow-xs">
            <div className="p-3 flex justify-between items-center bg-white">
              <span className="text-neutral-600">مجموع اقلام فاکتور:</span>
              <span className="font-mono font-bold">{order.subtotal.toLocaleString('fa-IR')} ریال</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="p-3 flex justify-between items-center bg-red-50/70 text-red-700">
                <span>تخفیف ویژه کوپن:</span>
                <span className="font-mono font-bold">-{order.discountAmount.toLocaleString('fa-IR')} ریال</span>
              </div>
            )}
            {order.loyaltyPointsRedeemed && order.loyaltyPointsRedeemed > 0 ? (
              <div className="p-3 flex justify-between items-center bg-amber-50/70 text-amber-900 border-t border-amber-200">
                <span className="flex items-center gap-1 font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>تخفیف امتیاز باشگاه مشتریان ({order.loyaltyPointsRedeemed} امتیاز):</span>
                </span>
                <span className="font-mono font-bold text-amber-800">
                  -{(order.loyaltyDiscountAmount || 0).toLocaleString('fa-IR')} ریال
                </span>
              </div>
            ) : null}
            <div className="p-3 flex justify-between items-center bg-white">
              <span className="text-neutral-600">هزینه بسته‌بندی ایمن و بیمه ارسال:</span>
              <span className="font-mono font-bold">
                {order.shippingFee === 0 ? 'رایگان (طرح ویژه)' : `${order.shippingFee.toLocaleString('fa-IR')} ریال`}
              </span>
            </div>
            <div className="p-3 flex justify-between items-center bg-white">
              <span className="text-neutral-600">مالیات بر ارزش افزوده و عوارض قانونی:</span>
              <span className="font-mono font-bold text-neutral-500">۰ ریال (معاف)</span>
            </div>
            <div className="p-3.5 flex justify-between items-center bg-neutral-900 text-white font-black text-sm">
              <span>مبلغ نهایی قابل پرداخت:</span>
              <div className="text-left">
                <span className="font-mono text-base text-red-400 block">{order.total.toLocaleString('fa-IR')} ریال</span>
                <span className="text-[10px] text-neutral-400 font-normal font-sans">({formatToman(order.total)})</span>
              </div>
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

        {/* Amount in Persian Words */}
        <div className="p-3.5 bg-neutral-100/80 rounded-2xl text-neutral-800 text-xs flex flex-wrap items-center justify-between gap-2 border border-neutral-300">
          <span>مبلغ کل قابل پرداخت به حروف:</span>
          <strong className="text-red-700 font-black text-sm">{numberToPersianWords(order.total)}</strong>
        </div>

        {/* 5. Official Seals, Signatures, and Electronic Validation Barcode */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-neutral-200 items-stretch">
          
          {/* Official Stamp of Seller */}
          <div className="border border-dashed border-neutral-300 rounded-2xl p-4 text-center space-y-3 min-h-[140px] flex flex-col justify-between relative bg-neutral-50/40">
            <span className="text-xs font-bold text-neutral-700 block">مهر و امضای فروشنده (چین‌پارت)</span>
            <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full border-2 border-red-600 text-red-600 text-[10px] font-black rotate-[-3deg] opacity-85 shadow-xs mx-auto">
              <ShieldCheck className="w-4 h-4" />
              <span>تایید حسابداری و انبارداری مرکزی</span>
            </div>
            <span className="text-[9px] text-neutral-400">امضای دیجیتال مجاز ثبت‌شده</span>
          </div>

          {/* Validation QR Code Box */}
          <div className="border border-dashed border-neutral-300 rounded-2xl p-4 text-center space-y-2 min-h-[140px] flex flex-col items-center justify-center bg-neutral-50/40">
            <div className="w-16 h-16 bg-white p-1.5 rounded-xl border border-neutral-200 shadow-xs flex items-center justify-center">
              <QrCode className="w-full h-full text-neutral-900" />
            </div>
            <span className="text-[10px] font-mono text-neutral-500">استعلام برخط سند</span>
            <span className="text-[9px] text-neutral-400">شناسه مالیاتی شاپرک</span>
          </div>

          {/* Buyer Signature Box */}
          <div className="border border-dashed border-neutral-300 rounded-2xl p-4 text-center space-y-3 min-h-[140px] flex flex-col justify-between bg-neutral-50/40">
            <span className="text-xs font-bold text-neutral-700 block">امضا و اثر انگشت خریدار</span>
            <p className="text-[10px] text-neutral-400 py-3">کالاها در سلامت کامل فیزیکی و با تطبیق قطعه تحویل گرفته شد.</p>
            <span className="text-[9px] text-neutral-400">تاریخ و امضا تحویل‌گیرنده</span>
          </div>

        </div>

      </div>

    </div>
  );
};
