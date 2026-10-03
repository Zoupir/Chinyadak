import React, { useEffect, useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { formatToman, getGradeInfo } from '../../utils/formatters';
import { apiRequest, ApiError } from '../../api/client';
import { 
  ShoppingBag, 
  CreditCard, 
  Truck, 
  ShieldCheck, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  X,
  Phone,
  MapPin,
  Clock,
  Sparkles,
  Coins,
  Award,
  Gift,
  Info
} from 'lucide-react';

interface CheckoutViewProps {
  onOrderCompleted: (orderId: string) => void;
  onNavigate: (view: string) => void;
}

export const CheckoutView: React.FC<CheckoutViewProps> = ({ onOrderCompleted, onNavigate }) => {
  const { 
    cart, 
    cartTotal, 
    createOrder,
    clearCart,
    showToast, 
    currentCustomer,
    getCustomerPoints,
    calculatePointsEarned,
    calculatePointsValue,
    getTierInfo,
    settings 
  } = useStore();

  const customerPoints = getCustomerPoints(currentCustomer?.id);
  const tierInfo = getTierInfo(customerPoints);
  const pointValue = settings.loyaltySettings?.tomanPerPoint ?? 1000;
  const minRedeemPoints = settings.loyaltySettings?.minimumRedeemPoints ?? 50;
  const maxRedeemPercent = settings.loyaltySettings?.maxRedeemPercent ?? 50;

  // Form State
  const [firstName, setFirstName] = useState(currentCustomer?.firstName || '');
  const [lastName, setLastName] = useState(currentCustomer?.lastName || '');
  const [phone, setPhone] = useState(currentCustomer?.phone || '');
  const [province, setProvince] = useState('تهران');
  const [city, setCity] = useState('تهران');
  const [postalCode, setPostalCode] = useState('');
  const [address, setAddress] = useState(currentCustomer?.address || '');
  const [notes, setNotes] = useState('');

  // Shipping Method
  const [selectedShipping, setSelectedShipping] = useState<'express' | 'tipax' | 'post'>('post');
  
  // Payment Gateway
  const [selectedGateway, setSelectedGateway] = useState<'saman' | 'mellat'>('saman');
  const [gatewayAvailability, setGatewayAvailability] = useState<Record<'saman' | 'mellat', boolean>>({
    saman: false,
    mellat: false
  });
  const [gatewayStatusLoaded, setGatewayStatusLoaded] = useState(false);

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);

  // Loyalty Points Redemption State
  const [useLoyaltyPoints, setUseLoyaltyPoints] = useState(false);
  const [redeemedPoints, setRedeemedPoints] = useState<number>(0);

  // Simulation of payment step
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentFailed, setPaymentFailed] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);

  // Gateway availability is read from server-side configuration; credentials never reach the browser.
  useEffect(() => {
    let cancelled = false;
    apiRequest<{ providers: Array<{ id: 'saman' | 'mellat'; configured: boolean }> }>('/api/payments/providers')
      .then(result => {
        if (cancelled) return;
        const next = { saman: false, mellat: false };
        result.providers.forEach(provider => {
          if (provider.id === 'saman' || provider.id === 'mellat') {
            next[provider.id] = Boolean(provider.configured);
          }
        });
        setGatewayAvailability(next);
        if (!next[selectedGateway]) {
          if (next.saman) setSelectedGateway('saman');
          else if (next.mellat) setSelectedGateway('mellat');
        }
      })
      .catch(error => {
        console.error('Payment provider status load failed:', error);
      })
      .finally(() => {
        if (!cancelled) setGatewayStatusLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Loyalty calculations
  const remainingSubtotal = Math.max(0, cartTotal);
  const maxDiscountAllowed = 0;
  const maxPointsAllowed = 0;

  const effectiveRedeemedPoints = 0;
  const loyaltyDiscount = 0;

  const shippingCost = selectedShipping === 'express' ? 120000 : selectedShipping === 'tipax' ? 110000 : 85000;
  const finalTotal = Math.max(0, cartTotal - appliedDiscount - loyaltyDiscount + shippingCost);

  const pointsEarnedFromThisOrder = 0;

  const handleToggleLoyalty = (_checked: boolean) => {
    setUseLoyaltyPoints(false);
    setRedeemedPoints(0);
    showToast('استفاده از امتیاز بعد از انتقال کامل باشگاه وفاداری به سرور فعال می‌شود.', 'info');
  };

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedDiscount(0);
    showToast('کد تخفیف تا فعال‌شدن اعتبارسنجی سمت سرور غیرفعال است.', 'info');
  };

  const redirectToGateway = (
    redirectUrl: string,
    method: 'GET' | 'POST',
    fields: Record<string, string>
  ) => {
    if (method === 'GET') {
      window.location.assign(redirectUrl);
      return;
    }

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = redirectUrl;
    form.style.display = 'none';

    Object.entries(fields).forEach(([name, value]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = name;
      input.value = value;
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
  };

  const handleProcessPayment = async (simulateFailure = false) => {
    if (!firstName || !lastName || !phone || !address) {
      showToast('لطفاً اطلاعات هویتی و آدرس پستی را تکمیل فرمایید.', 'error');
      return;
    }

    if (!gatewayStatusLoaded || !gatewayAvailability[selectedGateway]) {
      showToast('درگاه انتخاب‌شده روی سرور فعال و پیکربندی نشده است.', 'error');
      return;
    }

    if (simulateFailure && import.meta.env.DEV) {
      setPaymentFailed(true);
      showToast('پرداخت آزمایشی ناموفق شبیه‌سازی شد.', 'error');
      return;
    }

    setIsProcessing(true);
    setPaymentFailed(false);

    try {
      const orderItems = cart.map(item => ({
        productId: item.product.id,
        productName: item.product.nameFa,
        oemNumber: item.product.oemNumber,
        price: item.product.discountPrice || item.product.price,
        quantity: item.quantity,
        image: item.product.images[0],
        grade: item.product.grade,
        vehicleInfo: item.selectedVehicle?.modelName
      }));

      let orderId = pendingOrderId;
      if (!orderId) {
        const newOrder = await createOrder({
        status: 'pending',
        statusTitle: 'در انتظار پرداخت',
        items: orderItems,
        customer: {
          firstName,
          lastName,
          phone,
          province,
          city,
          postalCode,
          address,
          notes
        },
        shippingMethod: {
          id: selectedShipping,
          title: selectedShipping === 'express'
            ? 'پیک موتوری ۲ ساعته'
            : selectedShipping === 'tipax'
              ? 'تیپاکس اکسپرس'
              : 'پست پیشتاز بیمه‌شده',
          cost: shippingCost,
          estimatedDelivery: selectedShipping === 'express' ? '۲ ساعت کاری' : '۲۴ الی ۴۸ ساعت'
        },
        paymentMethod: {
          id: selectedGateway,
          title: selectedGateway === 'saman'
            ? 'درگاه پرداخت الکترونیک سامان'
            : 'به‌پرداخت بانک ملت'
        },
        subtotal: cartTotal,
        discountAmount: appliedDiscount,
        loyaltyPointsToRedeem: useLoyaltyPoints ? effectiveRedeemedPoints : 0,
        shippingFee: shippingCost,
        total: finalTotal
        });
        orderId = newOrder.id;
        setPendingOrderId(newOrder.id);
      }

      const payment = await apiRequest<{
        orderId: string;
        orderNumber: string;
        provider: string;
        redirectUrl: string;
        redirectMethod: 'GET' | 'POST';
        fields: Record<string, string>;
      }>('/api/payments/start', {
        method: 'POST',
        body: JSON.stringify({ orderId, provider: selectedGateway })
      });

      setPendingOrderId(null);
      clearCart();
      redirectToGateway(payment.redirectUrl, payment.redirectMethod, payment.fields || {});
    } catch (error) {
      console.error('Checkout payment start failed:', error);
      setPaymentFailed(true);

      let message = 'شروع پرداخت بانکی انجام نشد. دوباره تلاش کنید.';
      if (error instanceof ApiError) {
        if (error.code === 'INSUFFICIENT_STOCK') {
          message = 'موجودی یکی از کالاها برای این سفارش کافی نیست.';
        } else if (error.code === 'PAYMENT_ALREADY_IN_PROGRESS') {
          message = 'یک پرداخت فعال برای این سفارش وجود دارد.';
        } else if (error.code === 'PAYMENT_PROVIDER_NOT_CONFIGURED') {
          message = 'درگاه انتخاب‌شده هنوز روی سرور پیکربندی نشده است.';
        }
      }
      showToast(message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-neutral-400">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-neutral-800">سبد خرید شما برای تسویه حساب خالی است</h2>
        <p className="text-xs text-neutral-500">برای شروع قطعات سازگار با خودروی خود را انتخاب فرمایید.</p>
        <button
          onClick={() => onNavigate('shop')}
          className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold"
        >
          ورود به فروشگاه قطعات
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-black text-neutral-900">تکمیل اطلاعات و ثبت نهایی سفارش</h1>
        <p className="text-xs text-neutral-500 mt-1">
          خرید آسان مهمان بدون نیاز به ثبت‌نام اجباری با ضمانت بازگشت وجه ۷ روزه
        </p>
      </div>

      {paymentFailed && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 shrink-0" />
            <div>
              <h4 className="font-bold text-sm">تراکنش بانکی با خطا مواجه شد</h4>
              <p className="text-xs text-red-700 mt-0.5">
                سفارش شما محفوظ مانده است. می‌توانید با درگاه دیگری مجدداً تلاش فرمایید.
              </p>
            </div>
          </div>
          <button
            onClick={() => handleProcessPayment(false)}
            className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-xl shrink-0"
          >
            پرداخت مجدد
          </button>
        </div>
      )}

      {/* Main Grid: Form Left / Summary Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Forms (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Customer Information Card */}
          <div className="bg-white rounded-3xl border border-neutral-200 p-6 space-y-4 shadow-xs">
            <h3 className="font-bold text-base text-neutral-900 flex items-center gap-2">
              <Phone className="w-4 h-4 text-red-600" />
              <span>مشخصات تحویل‌گیرنده و شماره تماس</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">نام *</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  placeholder="مثال: رضا"
                  className="w-full text-xs p-3 border border-neutral-300 rounded-xl focus:border-red-600 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">نام خانوادگی *</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  placeholder="مثال: احمدی"
                  className="w-full text-xs p-3 border border-neutral-300 rounded-xl focus:border-red-600 focus:outline-hidden"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">شماره تلفن همراه (جهت پیامک رهگیری) *</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="09121234567"
                className="w-full text-xs p-3 border border-neutral-300 rounded-xl focus:border-red-600 focus:outline-hidden text-left font-mono"
                required
              />
            </div>
          </div>

          {/* Shipping Address Card */}
          <div className="bg-white rounded-3xl border border-neutral-200 p-6 space-y-4 shadow-xs">
            <h3 className="font-bold text-base text-neutral-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-red-600" />
              <span>آدرس دقیق پستی</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">استان</label>
                <select
                  value={province}
                  onChange={e => setProvince(e.target.value)}
                  className="w-full text-xs p-3 border border-neutral-300 rounded-xl focus:border-red-600 focus:outline-hidden cursor-pointer"
                >
                  <option value="تهران">تهران</option>
                  <option value="اصفهان">اصفهان</option>
                  <option value="فارس">فارس (شیراز)</option>
                  <option value="خراسان رضوی">خراسان رضوی (مشهد)</option>
                  <option value="آذربایجان شرقی">آذربایجان شرقی (تبریز)</option>
                  <option value="مازندران">مازندران</option>
                  <option value="خوزستان">خوزستان</option>
                  <option value="گیلان">گیلان</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">شهر</label>
                <input
                  type="text"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  placeholder="نام شهر"
                  className="w-full text-xs p-3 border border-neutral-300 rounded-xl focus:border-red-600 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">نشانی پستی دقیق *</label>
              <textarea
                rows={2}
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="نام خیابان، کوچه، پلاک، واحد..."
                className="w-full text-xs p-3 border border-neutral-300 rounded-xl focus:border-red-600 focus:outline-hidden"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">کد پستی ۱۰ رقمی (اختیاری)</label>
              <input
                type="text"
                value={postalCode}
                onChange={e => setPostalCode(e.target.value)}
                placeholder="1234567890"
                className="w-full text-xs p-3 border border-neutral-300 rounded-xl focus:border-red-600 focus:outline-hidden text-left font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">توضیحات و یادداشت سفارش (اختیاری)</label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="مثلاً: هماهنگی قبل از ارسال یا تماس با مکانیک..."
                className="w-full text-xs p-3 border border-neutral-300 rounded-xl focus:border-red-600 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Shipping Methods Card */}
          <div className="bg-white rounded-3xl border border-neutral-200 p-6 space-y-4 shadow-xs">
            <h3 className="font-bold text-base text-neutral-900 flex items-center gap-2">
              <Truck className="w-4 h-4 text-red-600" />
              <span>روش ارسال مرسوله</span>
            </h3>

            <div className="space-y-3">
              {[
                {
                  id: 'post',
                  title: 'پست پیشتاز بیمه‌شده (سراسر ایران)',
                  desc: 'تحویل ۲ الی ۳ روز کاری با بیمه کامل شکستگی قطعات',
                  cost: 85000
                },
                {
                  id: 'tipax',
                  title: 'تیپاکس اکسپرس هوایی',
                  desc: 'تحویل ۲۴ ساعته درب منزل در کلیه شهرستان‌ها',
                  cost: 110000
                },
                {
                  id: 'express',
                  title: 'پیک فوری ویژه شهر تهران (۲ ساعته)',
                  desc: 'ارسال فوری از انبار چراغ برق با پیک اختصاصی',
                  cost: 120000
                }
              ].map(opt => (
                <label
                  key={opt.id}
                  className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                    selectedShipping === opt.id
                      ? 'border-red-600 bg-red-50/40 ring-2 ring-red-600/20'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="shipping"
                      checked={selectedShipping === opt.id}
                      onChange={() => setSelectedShipping(opt.id as any)}
                      className="text-red-600 focus:ring-red-500 w-4 h-4"
                    />
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-neutral-900">{opt.title}</h4>
                      <p className="text-[11px] text-neutral-500">{opt.desc}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-neutral-900 font-mono">
                    {formatToman(opt.cost)}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Payment Gateways Card */}
          <div className="bg-white rounded-3xl border border-neutral-200 p-6 space-y-4 shadow-xs">
            <h3 className="font-bold text-base text-neutral-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-red-600" />
              <span>انتخاب درگاه پرداخت آنلاین</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`p-4 rounded-2xl border flex items-center gap-3 cursor-pointer transition-all ${
                  selectedGateway === 'saman'
                    ? 'border-red-600 bg-red-50/40 ring-2 ring-red-600/20'
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <input
                  type="radio"
                  name="gateway"
                  checked={selectedGateway === 'saman'}
                  disabled={!gatewayAvailability.saman}
                  onChange={() => setSelectedGateway('saman')}
                  className="text-red-600 focus:ring-red-500 w-4 h-4"
                />
                <div>
                  <h4 className="font-bold text-xs text-neutral-900">درگاه پرداخت الکترونیک سامان (SEP)</h4>
                  <p className="text-[10px] text-neutral-500">{gatewayAvailability.saman ? 'پشتیبانی از کلیه کارت‌های عضو شتاب' : 'هنوز روی سرور پیکربندی نشده'}</p>
                </div>
              </label>

              <label
                className={`p-4 rounded-2xl border flex items-center gap-3 cursor-pointer transition-all ${
                  selectedGateway === 'mellat'
                    ? 'border-red-600 bg-red-50/40 ring-2 ring-red-600/20'
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <input
                  type="radio"
                  name="gateway"
                  checked={selectedGateway === 'mellat'}
                  disabled={!gatewayAvailability.mellat}
                  onChange={() => setSelectedGateway('mellat')}
                  className="text-red-600 focus:ring-red-500 w-4 h-4"
                />
                <div>
                  <h4 className="font-bold text-xs text-neutral-900">به‌پرداخت ملت (BPM)</h4>
                  <p className="text-[10px] text-neutral-500">{gatewayAvailability.mellat ? 'تسویه و تایید آنی با شاپرک' : 'هنوز روی سرور پیکربندی نشده'}</p>
                </div>
              </label>
            </div>
          </div>

        </div>

        {/* Order Summary Right (5 Cols) */}
        <div className="lg:col-span-5 space-y-6 sticky top-28">
          <div className="bg-white rounded-3xl border border-neutral-200 p-6 space-y-6 shadow-md">
            <h3 className="font-bold text-base text-neutral-900 pb-3 border-b border-neutral-100 flex items-center justify-between">
              <span>خلاصه فاکتور سفارش</span>
              <span className="text-xs text-neutral-500 font-normal">({cart.length} قلم کالا)</span>
            </h3>

            {/* Line items list */}
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {cart.map((item) => (
                <div key={item.product.id} className="flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img 
                      src={item.product.images[0]} 
                      alt={item.product.nameFa} 
                      className="w-10 h-10 object-cover rounded-lg border shrink-0" 
                    />
                    <div className="min-w-0">
                      <h4 className="font-bold text-neutral-900 truncate">{item.product.nameFa}</h4>
                      <p className="text-[10px] text-neutral-400">
                        {item.quantity} عدد × {formatToman(item.product.discountPrice || item.product.price)}
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-neutral-900 shrink-0">
                    {formatToman((item.product.discountPrice || item.product.price) * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Coupon Code Input */}
            <form onSubmit={handleApplyCoupon} className="pt-3 border-t border-neutral-100 flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={e => setCouponCode(e.target.value)}
                placeholder="کد تخفیف را وارد کنید"
                className="flex-1 text-xs p-2.5 border border-neutral-300 rounded-xl focus:border-red-600 focus:outline-hidden font-mono uppercase"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                اعمال
              </button>
            </form>

            {/* Loyalty Points Redemption Card */}
            <div className="pt-3 border-t border-neutral-100 space-y-3">
              {currentCustomer ? (
                <div className={`p-4 rounded-2xl border transition-all ${
                  useLoyaltyPoints 
                    ? 'border-amber-400 bg-amber-50/40 ring-1 ring-amber-400/30' 
                    : 'border-neutral-200 bg-neutral-50/60'
                }`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold shrink-0">
                        <Sparkles className="w-4 h-4 text-amber-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-xs text-neutral-900">باشگاه مشتریان یدک استور</h4>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${tierInfo.badgeClass}`}>
                            {tierInfo.title}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-500 font-medium mt-0.5">
                          موجودی: <strong className="text-amber-700 font-mono font-bold">{customerPoints.toLocaleString('fa-IR')}</strong> امتیاز
                          {customerPoints > 0 && ` (معادل ${formatToman(calculatePointsValue(customerPoints))})`}
                        </p>
                      </div>
                    </div>

                    {customerPoints >= minRedeemPoints && maxPointsAllowed > 0 && (
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={useLoyaltyPoints}
                          onChange={(e) => handleToggleLoyalty(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-neutral-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                      </label>
                    )}
                  </div>

                  {customerPoints < minRedeemPoints ? (
                    <div className="mt-2 text-[11px] text-neutral-500 bg-white/80 p-2 rounded-xl border border-neutral-200 flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      <span>حداقل موجودی مجاز برای تسویه ۵۰ امتیاز است (موجودی فعلی شما: {customerPoints} امتیاز).</span>
                    </div>
                  ) : useLoyaltyPoints ? (
                    <div className="mt-3 pt-3 border-t border-amber-200/60 space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-neutral-700">تعداد امتیاز جهت تبدیل به تخفیف:</span>
                        <span className="font-mono font-black text-amber-700">
                          {effectiveRedeemedPoints.toLocaleString('fa-IR')} امتیاز
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min={minRedeemPoints}
                          max={maxPointsAllowed}
                          step={10}
                          value={effectiveRedeemedPoints}
                          onChange={(e) => setRedeemedPoints(Number(e.target.value))}
                          className="flex-1 accent-amber-500 cursor-pointer"
                        />
                        <span className="text-[11px] font-mono text-neutral-500 font-bold">
                          {maxPointsAllowed} حداکثر
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1">
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => setRedeemedPoints(maxPointsAllowed)}
                            className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-md transition-colors cursor-pointer"
                          >
                            حداکثر مجاز
                          </button>
                          <button
                            type="button"
                            onClick={() => setRedeemedPoints(Math.floor(maxPointsAllowed / 2))}
                            className="px-2 py-0.5 text-[10px] font-bold bg-neutral-200/80 hover:bg-neutral-300 text-neutral-700 rounded-md transition-colors cursor-pointer"
                          >
                            ۵۰٪
                          </button>
                        </div>

                        <span className="text-xs font-bold text-emerald-700 font-mono">
                          تخفیف: {formatToman(loyaltyDiscount)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-2 text-[11px] text-neutral-500">
                      برای فعال‌سازی و کسر تخفیف تا سقف {formatToman(calculatePointsValue(maxPointsAllowed))} کلید بالا را روشن نمایید.
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/70 text-xs space-y-2">
                  <div className="flex items-center gap-2 text-amber-900 font-bold">
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>باشگاه وفاداری و تخفیف با امتیاز</span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    با ورود به حساب یا ثبت‌نام در سایت، می‌توانید از امتیازات وفاداری خود برای تخفیف این سفارش استفاده کنید.
                  </p>
                  <button
                    type="button"
                    onClick={() => onNavigate('account')}
                    className="text-[11px] font-bold text-amber-900 underline hover:text-amber-700 cursor-pointer block"
                  >
                    ورود به حساب کاربری
                  </button>
                </div>
              )}
            </div>

            {/* Price Calculations */}
            <div className="space-y-2 pt-3 border-t border-neutral-100 text-xs text-neutral-600">
              <div className="flex justify-between">
                <span>مجموع ارزش قطعات:</span>
                <span className="font-bold text-neutral-900">{formatToman(cartTotal)}</span>
              </div>

              {appliedDiscount > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>تخفیف ویژه کوپن:</span>
                  <span>- {formatToman(appliedDiscount)}</span>
                </div>
              )}

              {loyaltyDiscount > 0 && (
                <div className="flex justify-between text-amber-700 font-bold animate-in fade-in">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>تخفیف امتیاز وفاداری ({effectiveRedeemedPoints} امتیاز):</span>
                  </span>
                  <span>- {formatToman(loyaltyDiscount)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>هزینه بسته‌بندی و ارسال:</span>
                <span className="font-bold text-neutral-900">{formatToman(shippingCost)}</span>
              </div>

              <div className="pt-3 border-t border-neutral-200 flex justify-between text-base font-black text-neutral-900">
                <span>مبلغ نهایی پرداخت:</span>
                <span className="text-red-600 font-mono text-lg">{formatToman(finalTotal)}</span>
              </div>

              {/* Points to be earned notification */}
              <div className="mt-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-between text-xs text-emerald-800">
                <span className="flex items-center gap-1.5 font-medium">
                  <Coins className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>امتیاز وفاداری دریافتی از این خرید:</span>
                </span>
                <span className="font-black font-mono text-emerald-700">
                  +{pointsEarnedFromThisOrder.toLocaleString('fa-IR')} امتیاز
                </span>
              </div>
            </div>

            {/* Submit & Payment Actions */}
            <div className="space-y-2 pt-2">
              <button
                onClick={() => handleProcessPayment(false)}
                disabled={isProcessing}
                className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50"
              >
                {isProcessing ? (
                  <span>در حال انتقال به درگاه بانکی...</span>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>پرداخت امن و ثبت نهایی سفارش</span>
                  </>
                )}
              </button>

              {import.meta.env.DEV && (
                <button
                  onClick={() => handleProcessPayment(true)}
                  disabled={isProcessing}
                  className="w-full py-2 text-[11px] text-neutral-400 hover:text-red-600 text-center transition-colors"
                >
                  (تست حالت شبیه‌سازی خطای پرداخت بانکی)
                </button>
              )}
            </div>

            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100 text-[11px] text-neutral-500 space-y-1">
              <div className="flex items-center gap-1.5 text-neutral-700 font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>گارانتی خرید بدون ریسک:</span>
              </div>
              <p>در صورت مغایرت قطعه یا عدم رضایت مکانیک، وجه شما ظرف ۲۴ ساعت بدون کسر هزینه مسترد می‌گردد.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
