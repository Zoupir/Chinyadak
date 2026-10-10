import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { ProductCard } from '../product/ProductCard';
import { formatToman } from '../../utils/formatters';
import { 
  Car, 
  ShoppingBag, 
  Heart, 
  User, 
  Plus, 
  Trash2, 
  Check, 
  ArrowLeft, 
  Clock, 
  MapPin, 
  Package, 
  FileText,
  ShieldCheck,
  LogOut,
  Printer,
  Sparkles,
  Coins,
  Award,
  Share2
} from 'lucide-react';
import { InvoiceModal } from '../orders/InvoiceModal';
import { LoyaltyDashboardTab } from './LoyaltyDashboardTab';
import { ShareButton } from '../common/ShareButton';
import { Order } from '../../types';

interface AccountViewProps {
  initialTab?: string;
  onNavigate: (view: string, param?: string) => void;
  onOpenVehicleModal: () => void;
  onOpenAuthModal?: (mode: 'login' | 'register') => void;
}

export const AccountView: React.FC<AccountViewProps> = ({
  initialTab = 'garage',
  onNavigate,
  onOpenVehicleModal,
  onOpenAuthModal
}) => {
  const { 
    refreshCustomerAccount,
    garage, 
    selectedVehicle, 
    setSelectedVehicle, 
    removeFromGarage, 
    orders, 
    wishlist, 
    products,
    partRequests,
    currentCustomer,
    customerLogout,
    updateCustomer,
    getCustomerPoints,
    getTierInfo,
    showToast,
    settings
  } = useStore();

  const customerPoints = getCustomerPoints(currentCustomer?.id);
  const tierInfo = getTierInfo(customerPoints);

  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<Order | null>(null);

  const [activeTab, setActiveTab] = useState<'garage' | 'orders' | 'wishlist' | 'requests' | 'profile' | 'loyalty'>(
    (initialTab as any) || 'garage'
  );

  useEffect(() => {
    if (initialTab && ['garage', 'orders', 'wishlist', 'requests', 'profile', 'loyalty'].includes(initialTab)) {
      setActiveTab(initialTab as any);
    }
  }, [initialTab]);

  useEffect(() => {
    const refresh = () => { if (document.visibilityState === 'visible') void refreshCustomerAccount().catch(() => {}); };
    refresh();
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, [currentCustomer?.id, activeTab]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId as any);
    onNavigate('account', tabId);
  };

  const [profileForm, setProfileForm] = useState({
    firstName: currentCustomer?.firstName || 'کاربر',
    lastName: currentCustomer?.lastName || 'مهمان',
    phone: currentCustomer?.phone || '09121112233',
    address: currentCustomer?.address || 'تهران، خیابان امیرکبیر، پاساژ کاشانی، طبقه همکف، پلاک ۲۸'
  });

  const wishlistProducts = products.filter(p => wishlist.includes(p.id));

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Guest Account Banner */}
      {!currentCustomer && (
        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs animate-in fade-in">
          <div className="space-y-1">
            <span className="font-bold text-amber-900 block">شما هم‌اکنون به عنوان کاربر مهمان در سایت حضور دارید</span>
            <p className="text-amber-700">جهت دسترسی دائم به گاراژ خودروها، آدرس‌ها و تاریخچه سفارش‌ها، وارد شوید یا ثبت‌نام کنید.</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onOpenAuthModal?.('login')}
              className="px-4 py-2 bg-neutral-900 text-white rounded-xl font-bold hover:bg-neutral-800 transition-colors"
            >
              ورود به حساب
            </button>
            <button
              onClick={() => onOpenAuthModal?.('register')}
              className="px-4 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors"
            >
              ثبت‌نام مشتری / مکانیک
            </button>
          </div>
        </div>
      )}

      {/* Account Header */}
      <div className="bg-neutral-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-red-600 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-red-600/30">
            <User className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black">
                {currentCustomer ? `${currentCustomer.firstName} ${currentCustomer.lastName}` : 'حساب کاربری و گاراژ من'}
              </h1>
              {currentCustomer && (
                <span className="text-[10px] bg-red-600/30 border border-red-500/50 text-red-300 px-2 py-0.5 rounded-full font-bold">
                  {currentCustomer.typeTitle}
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              خودروی فعال در سایت: <strong className="text-white">{selectedVehicle ? selectedVehicle.modelName : 'انتخاب نشده'}</strong>
              {currentCustomer?.phone && ` · شماره همراه: ${currentCustomer.phone}`}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <button
                onClick={() => setActiveTab('loyalty')}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>{customerPoints.toLocaleString('fa-IR')} امتیاز باشگاه مشتریان</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-400 text-neutral-950 font-black">
                  {tierInfo.title}
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <ShareButton
            view="account"
            param={activeTab}
            variant="button"
            label="اشتراک‌گذاری لینک این بخش"
            className="bg-white text-neutral-900 border-neutral-200 hover:bg-neutral-50"
          />

          <button
            onClick={onOpenVehicleModal}
            className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 shrink-0"
          >
            <Car className="w-4 h-4 text-red-500" />
            <span>مدیریت گاراژ من ({garage.length})</span>
          </button>

          {currentCustomer && (
            <button
              onClick={customerLogout}
              className="p-2.5 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 rounded-xl text-xs font-bold transition-colors"
              title="خروج از حساب"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center justify-between border-b border-neutral-200 bg-white rounded-2xl p-2 gap-2 shadow-xs overflow-x-auto">
        <div className="flex items-center gap-2">
          {[
            { id: 'loyalty', label: 'باشگاه مشتریان و امتیازات', icon: Sparkles, count: customerPoints },
            { id: 'garage', label: 'گاراژ من (خودروها)', icon: Car, count: garage.length },
            { id: 'orders', label: 'سفارش‌های من', icon: ShoppingBag, count: orders.length },
            { id: 'wishlist', label: 'علاقه‌مندی‌ها', icon: Heart, count: wishlist.length },
            { id: 'requests', label: 'استعلام‌های قطعه', icon: FileText, count: partRequests.length },
            { id: 'profile', label: 'اطلاعات کاربری و آدرس‌ها', icon: User }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-neutral-800 text-neutral-300' : 'bg-neutral-200 text-neutral-700'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="pr-2 shrink-0 hidden sm:block">
          <ShareButton
            view="account"
            param={activeTab}
            variant="badge"
            label="لینک مستقیم تب"
          />
        </div>
      </div>

      {/* Tab: Loyalty Point System & Rewards */}
      {activeTab === 'loyalty' && (
        <LoyaltyDashboardTab
          onNavigate={onNavigate}
          onOpenVehicleModal={onOpenVehicleModal}
        />
      )}

      {/* Tab 1: My Garage */}
      {activeTab === 'garage' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-neutral-900">خودروهای ثبت شده در گاراژ شما</h2>
              <p className="text-xs text-neutral-500">
                با انتخاب هر خودرو، تمام قطعات موجود در سایت بر اساس سازگاری با آن فیلتر می‌شوند.
              </p>
            </div>
            <button
              onClick={onOpenVehicleModal}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>افزودن خودرو جدید</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {garage.map(car => {
              const isCurrent = selectedVehicle?.id === car.id;
              return (
                <div 
                  key={car.id}
                  className={`bg-white rounded-3xl border p-5 space-y-4 transition-all relative ${
                    isCurrent
                      ? 'border-red-600 ring-2 ring-red-600/20 shadow-md'
                      : 'border-neutral-200 hover:border-neutral-300 shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700">
                        {car.customLabel}
                      </span>
                      <h3 className="font-bold text-base text-neutral-900 mt-1">{car.modelName}</h3>
                      <p className="text-xs text-neutral-500">مدل {car.year} · {car.engine}</p>
                    </div>

                    {car.imageUrl && (
                      <img 
                        src={car.imageUrl} 
                        alt={car.modelName} 
                        className="w-16 h-12 object-cover rounded-xl border border-neutral-200" 
                      />
                    )}
                  </div>

                  <div className="p-3 bg-neutral-50 rounded-xl text-xs space-y-1 text-neutral-600">
                    <div className="flex justify-between">
                      <span className="text-neutral-400">گیربکس:</span>
                      <span className="font-semibold">{car.transmission || 'اتوماتیک'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">تاریخ افزودن:</span>
                      <span>{car.addedAt}</span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-neutral-100">
                    <button
                      onClick={() => setSelectedVehicle(car)}
                      disabled={isCurrent}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                        isCurrent
                          ? 'bg-emerald-100 text-emerald-800 cursor-default flex items-center gap-1'
                          : 'bg-neutral-900 hover:bg-red-600 text-white'
                      }`}
                    >
                      {isCurrent ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>خودروی فعال</span>
                        </>
                      ) : (
                        'فعال‌سازی فیلتر'
                      )}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onNavigate('car-model', car.modelId)}
                        className="text-xs text-red-600 hover:underline font-semibold"
                      >
                        کاتالوگ قطعات
                      </button>
                      <button
                        onClick={() => removeFromGarage(car.id)}
                        className="p-2 text-neutral-400 hover:text-red-600 rounded-lg hover:bg-neutral-100"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Orders List */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-black text-neutral-900">سوابق سفارش‌ها و فاکتورها</h2>
            <p className="text-xs text-neutral-500">امکان رهگیری مستقیم بارنامه پستی و وضعیت پردازش انبار</p>
          </div>

          <div className="space-y-4">
            {orders.map(order => (
              <div key={order.id} className="bg-white rounded-3xl border border-neutral-200 p-6 space-y-4 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-100 gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono font-bold text-sm text-neutral-900">{order.orderNumber}</span>
                      <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md font-semibold">
                        {order.statusTitle}
                      </span>
                    </div>
                    <span className="text-xs text-neutral-400">تاریخ ثبت: {order.date}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onNavigate('tracking', order.orderNumber)}
                      className="px-4 py-2 bg-neutral-900 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition-colors"
                    >
                      رهگیری آنلاین مرسوله
                    </button>
                  </div>
                </div>

                {/* Items */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200 flex items-center gap-3 text-xs">
                      <img src={item.image} alt={item.productName} className="w-12 h-12 object-cover rounded-xl border bg-white" />
                      <div>
                        <h4 className="font-bold text-neutral-900 line-clamp-1">{item.productName}</h4>
                        <p className="text-[10px] text-neutral-400 font-mono">OEM: {item.oemNumber}</p>
                        <p className="text-[11px] font-bold text-neutral-700 mt-1">
                          {item.quantity} عدد × {formatToman(item.price)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-neutral-800">
                  <div className="flex items-center gap-4">
                    <span>روش ارسال: {order.shippingMethod.title}</span>
                    <span>مبلغ کل فاکتور: <strong className="text-red-600 text-sm">{formatToman(order.total)}</strong></span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onNavigate('invoice', order.id)}
                      className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-neutral-300"
                      title="نمایش در صفحه مجزا بدون پاپ‌آپ و دانلود PDF"
                    >
                      صفحه جداگانه و PDF
                    </button>
                    <button
                      onClick={() => setSelectedOrderForInvoice(order)}
                      className="px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      <Printer className="w-3.5 h-3.5 text-red-500" />
                      <span>چاپ فاکتور رسمی</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Wishlist */}
      {activeTab === 'wishlist' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-black text-neutral-900">لیست علاقه‌مندی‌ها ({wishlistProducts.length} قطعه)</h2>
            <p className="text-xs text-neutral-500">قطعات ذخیره‌شده برای خرید یا بررسی‌های بعدی</p>
          </div>

          {wishlistProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {wishlistProducts.map(p => (
                <ProductCard 
                  key={p.id} 
                  product={p} 
                  onViewDetails={(id) => onNavigate('product', id)} 
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-neutral-200 p-12 text-center space-y-3">
              <Heart className="w-12 h-12 text-neutral-300 mx-auto" />
              <h3 className="font-bold text-base text-neutral-800">هنوز قطعه‌ای ذخیره نکرده‌اید</h3>
              <p className="text-xs text-neutral-500 mb-4">
                با زدن دکمه قلب در کارت‌های محصول، قطعات موردنیاز را اینجا نگهداری کنید.
              </p>
              <button
                onClick={() => onNavigate('shop')}
                className="px-6 py-2.5 bg-red-600 text-white rounded-xl text-xs font-bold"
              >
                مشاهده محصولات
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Part Requests */}
      {activeTab === 'requests' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-neutral-900">استعلام‌های استعلام قطعات نایاب</h2>
              <p className="text-xs text-neutral-500">وضعیت پیگیری سفارش‌های خاص از کارخانه مادر</p>
            </div>
            <button
              onClick={() => onNavigate('part-request')}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold"
            >
              ثبت استعلام جدید
            </button>
          </div>

          <div className="space-y-3">
            {partRequests.map(req => (
              <div key={req.id} className="p-5 bg-white rounded-2xl border border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-sm text-neutral-900">{req.partName}</span>
                    <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold">
                      {req.status}
                    </span>
                  </div>
                  <p className="text-neutral-500">
                    خودرو: <strong>{req.carBrand} {req.carModel}</strong> (مدل {req.year})
                    {req.oemNumber && ` · پارت OEM: ${req.oemNumber}`}
                  </p>
                  {req.notes && <p className="text-neutral-400 mt-1">توضیحات: {req.notes}</p>}
                </div>

                <div className="text-left text-neutral-400 shrink-0">
                  <div>تاریخ ثبت: {req.createdAt}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Profile & Addresses */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 space-y-6 max-w-2xl">
          <h2 className="text-lg font-black text-neutral-900">مشخصات کاربر و آدرس‌های تحویل سفارش</h2>
          
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (currentCustomer) {
                updateCustomer({
                  ...currentCustomer,
                  firstName: profileForm.firstName,
                  lastName: profileForm.lastName,
                  phone: profileForm.phone,
                  address: profileForm.address
                });
              } else {
                showToast('اطلاعات کاربری با موفقیت به‌روزرسانی شد.');
              }
            }} 
            className="space-y-4 text-xs"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-neutral-500 font-bold block mb-1">نام:</label>
                <input
                  type="text"
                  value={profileForm.firstName}
                  onChange={e => setProfileForm({ ...profileForm, firstName: e.target.value })}
                  className="w-full p-3 border border-neutral-300 rounded-xl"
                  required
                />
              </div>
              <div>
                <label className="text-neutral-500 font-bold block mb-1">نام خانوادگی:</label>
                <input
                  type="text"
                  value={profileForm.lastName}
                  onChange={e => setProfileForm({ ...profileForm, lastName: e.target.value })}
                  className="w-full p-3 border border-neutral-300 rounded-xl"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-neutral-500 font-bold block mb-1">شماره همراه حساب:</label>
              <input
                type="text"
                value={profileForm.phone}
                onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                className="w-full p-3 border border-neutral-300 rounded-xl font-mono text-left"
                required
              />
            </div>

            <div>
              <label className="text-neutral-500 font-bold block mb-1">آدرس پیش‌فرض جهت ارسال سفارشات (تحویل اکسپرس/تیپاکس):</label>
              <textarea
                rows={3}
                value={profileForm.address}
                onChange={e => setProfileForm({ ...profileForm, address: e.target.value })}
                className="w-full p-3 border border-neutral-300 rounded-xl"
                required
              />
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-all shadow-md"
            >
              ذخیره تغییرات حساب کاربری
            </button>
          </form>
        </div>
      )}

      {/* Official Printable Tax Invoice Modal */}
      {selectedOrderForInvoice && (
        <InvoiceModal
          order={selectedOrderForInvoice}
          settings={settings}
          onClose={() => setSelectedOrderForInvoice(null)}
          onOpenDedicatedPage={(orderId) => {
            setSelectedOrderForInvoice(null);
            onNavigate('invoice', orderId);
          }}
        />
      )}

    </div>
  );
};
