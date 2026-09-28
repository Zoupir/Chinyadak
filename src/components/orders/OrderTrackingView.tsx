import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Order, OrderStatus } from '../../types';
import { formatToman, getGradeInfo } from '../../utils/formatters';
import { 
  Search, 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  AlertCircle, 
  ArrowLeft,
  FileText
} from 'lucide-react';

interface OrderTrackingViewProps {
  initialOrderNumber?: string;
  onNavigate: (view: string, param?: string) => void;
}

export const OrderTrackingView: React.FC<OrderTrackingViewProps> = ({
  initialOrderNumber,
  onNavigate
}) => {
  const { getOrderByTracking, orders } = useStore();

  const [orderNumber, setOrderNumber] = useState(initialOrderNumber || '');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [foundOrder, setFoundOrder] = useState<Order | undefined>(undefined);
  const [searched, setSearched] = useState(false);
  const [isTracking, setIsTracking] = useState(false);

  const handleTrackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) return;
    setIsTracking(true);
    try {
      const result = await getOrderByTracking(orderNumber, phoneNumber);
      setFoundOrder(result);
      setSearched(true);
    } finally {
      setIsTracking(false);
    }
  };

  // Step index helper
  const getStatusStepIndex = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return 0;
      case 'paid': return 1;
      case 'processing': return 2;
      case 'ready_to_ship': return 3;
      case 'shipped': return 4;
      case 'delivered': return 5;
      default: return 1;
    }
  };

  const steps = [
    { title: 'ثبت سفارش', desc: 'در انتظار پرداخت' },
    { title: 'پرداخت موفق', desc: 'تاییدیه درگاه بانکی' },
    { title: 'پردازش در انبار', desc: 'بسته‌بندی و تست فنی' },
    { title: 'آماده ارسال', desc: 'تحویل به متصدی حمل' },
    { title: 'ارسال شده', desc: 'در مسیر تحویل به مشتری' },
    { title: 'تحویل داده شد', desc: 'پایان موفق فرایند' }
  ];

  const currentStep = foundOrder ? getStatusStepIndex(foundOrder.status) : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-black text-neutral-900">پیگیری هوشمند وضعیت سفارش</h1>
        <p className="text-xs text-neutral-500">
          شماره سفارش و شماره موبایل ثبت‌شده در هنگام خرید را برای مشاهده وضعیت مرسوله وارد فرمایید.
        </p>
      </div>

      {/* Track Form */}
      <div className="bg-white rounded-3xl border border-neutral-200 p-6 shadow-xs">
        <form onSubmit={handleTrackSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-6">
            <label className="block text-xs font-bold text-neutral-700 mb-1.5">شماره سفارش (کد رهگیری فاکتور):</label>
            <input
              type="text"
              value={orderNumber}
              onChange={e => setOrderNumber(e.target.value)}
              placeholder="مثال: CHP-84920"
              className="w-full text-xs p-3 border border-neutral-300 rounded-xl focus:border-red-600 focus:outline-hidden font-mono uppercase"
              required
            />
          </div>

          <div className="sm:col-span-4">
            <label className="block text-xs font-bold text-neutral-700 mb-1.5">شماره موبایل خریدار:</label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={e => setPhoneNumber(e.target.value)}
              placeholder="0912..."
              className="w-full text-xs p-3 border border-neutral-300 rounded-xl focus:border-red-600 focus:outline-hidden font-mono text-left"
              required
            />
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={isTracking}
              className="w-full h-11 disabled:opacity-60 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Search className="w-4 h-4" />
              <span>{isTracking ? 'در حال بررسی...' : 'رهگیری'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Result Section */}
      {searched && (
        foundOrder ? (
          <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-md space-y-8">
            
            {/* Status Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-neutral-100 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {foundOrder.statusTitle}
                  </span>
                  <span className="text-xs text-neutral-400">ثبت در {foundOrder.date}</span>
                </div>
                <h3 className="text-lg font-black text-neutral-900 font-mono">
                  سفارش شماره: {foundOrder.orderNumber}
                </h3>
              </div>

              {foundOrder.trackingPostCode && (
                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs text-right">
                  <span className="text-neutral-400 block text-[10px]">کد مرسوله پستی / بارنامه:</span>
                  <span className="font-mono font-bold text-neutral-900 text-sm mt-0.5 block">
                    {foundOrder.trackingPostCode}
                  </span>
                </div>
              )}
            </div>

            {/* Stepper Timeline */}
            <div className="space-y-4">
              <h4 className="font-bold text-sm text-neutral-900">مراحل ارسال سفارش:</h4>
              <div className="relative">
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                  {steps.map((st, idx) => {
                    const isDone = idx <= currentStep;
                    const isCurrent = idx === currentStep;
                    return (
                      <div 
                        key={idx}
                        className={`p-3 rounded-2xl border text-center transition-all ${
                          isCurrent
                            ? 'bg-red-50 border-red-500 ring-2 ring-red-500/20'
                            : isDone
                            ? 'bg-neutral-50 border-neutral-200'
                            : 'bg-neutral-50/40 border-neutral-100 opacity-50'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 text-xs font-bold ${
                          isDone ? 'bg-red-600 text-white' : 'bg-neutral-200 text-neutral-500'
                        }`}>
                          {isDone ? '✓' : idx + 1}
                        </div>
                        <h5 className="font-bold text-xs text-neutral-900">{st.title}</h5>
                        <p className="text-[10px] text-neutral-500 mt-0.5">{st.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Shipping Destination */}
            <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-neutral-800">
                <MapPin className="w-4 h-4 text-red-600" />
                <span>اطلاعات مقصد و خریدار:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-neutral-600">
                <div>تحویل‌گیرنده: <strong>{foundOrder.customer.firstName} {foundOrder.customer.lastName}</strong></div>
                <div>شماره تماس: <strong className="font-mono">{foundOrder.customer.phone}</strong></div>
                <div>شهر مقصد: <strong>{foundOrder.customer.province} - {foundOrder.customer.city}</strong></div>
              </div>
              <div className="text-neutral-500 pt-1">
                نشانی: {foundOrder.customer.address}
              </div>
            </div>

            {/* Order Items */}
            <div className="space-y-3">
              <h4 className="font-bold text-sm text-neutral-900">اقلام این سفارش:</h4>
              <div className="space-y-2">
                {foundOrder.items.map((item, idx) => (
                  <div key={idx} className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <img src={item.image} alt={item.productName} className="w-12 h-12 object-cover rounded-lg border bg-white" />
                      <div>
                        <h5 className="font-bold text-neutral-900">{item.productName}</h5>
                        <div className="flex items-center gap-2 text-[10px] text-neutral-400 mt-0.5 font-mono">
                          <span>OEM: {item.oemNumber}</span>
                          {item.vehicleInfo && <span>· مناسب: {item.vehicleInfo}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="text-left font-bold text-neutral-900">
                      <div>{item.quantity} عدد</div>
                      <div className="text-red-600 text-xs mt-0.5">{formatToman(item.price * item.quantity)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="pt-4 border-t border-neutral-100 flex items-center justify-between text-sm font-bold text-neutral-900">
              <span>مبلغ کل پرداخت شده:</span>
              <span className="text-red-600 text-base">{formatToman(foundOrder.total)}</span>
            </div>

          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-neutral-200 p-8 text-center space-y-3">
            <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
            <h3 className="font-bold text-neutral-900 text-base">سفارشی با این مشخصات یافت نشد</h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              لطفاً شماره سفارش دریافتی را مجدداً بررسی فرمایید یا با پشتیبانی تماس بگیرید.
            </p>
          </div>
        )
      )}
    </div>
  );
};
