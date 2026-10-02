import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { formatToman } from '../../utils/formatters';
import { Sparkles, Award, Gift, ShoppingBag, ArrowUpRight, ArrowDownLeft, ShieldCheck, Calculator, Zap, Car, CheckCircle2, TrendingUp, ChevronRight, Clock, Coins } from 'lucide-react';
import { LoyaltyTier } from '../../types';

interface LoyaltyDashboardTabProps {
  onNavigate: (view: string, param?: string) => void;
  onOpenVehicleModal: () => void;
}

export const LoyaltyDashboardTab: React.FC<LoyaltyDashboardTabProps> = ({
  onNavigate,
  onOpenVehicleModal
}) => {
  const { 
    currentCustomer, 
    getCustomerPoints, 
    getCustomerTransactions, 
    getTierInfo, 
    calculatePointsValue,
    settings 
  } = useStore();

  const customerId = currentCustomer?.id;
  const points = getCustomerPoints(customerId);
  const tierInfo = getTierInfo(points);
  const cashValue = calculatePointsValue(points);
  const transactions = getCustomerTransactions(customerId);

  const [filterType, setFilterType] = useState<'all' | 'earned' | 'redeemed' | 'bonus'>('all');
  const [calcInput, setCalcInput] = useState<number>(points > 0 ? points : 100);

  const filteredTransactions = transactions.filter(t => {
    if (filterType === 'all') return true;
    return t.type === filterType;
  });

  const totalEarned = transactions
    .filter(t => t.points > 0)
    .reduce((sum, t) => sum + t.points, 0);

  const totalRedeemed = transactions
    .filter(t => t.points < 0)
    .reduce((sum, t) => sum + Math.abs(t.points), 0);

  const allTiers: {
    tier: LoyaltyTier;
    title: string;
    pointsRange: string;
    multiplier: string;
    color: string;
    bgGrad: string;
    perks: string[];
  }[] = [
    {
      tier: 'bronze',
      title: 'مشتری برنزی',
      pointsRange: '۰ تا ۴۹۹ امتیاز',
      multiplier: 'ضریب ۱x (۱٪ برگشت نقدی)',
      color: 'text-amber-700',
      bgGrad: 'from-amber-900/10 to-stone-900/10 border-amber-800/30',
      perks: ['کسب ۱ امتیاز به ازای هر ۱۰,۰۰۰ تومان خرید', 'امکان تبدیل امتیاز به تخفیف ریالی در فاکتور']
    },
    {
      tier: 'silver',
      title: 'مشتری نقره‌ای',
      pointsRange: '۵۰۰ تا ۹۹۹ امتیاز',
      multiplier: 'ضریب ۱.۲۵x (۱.۲۵٪ برگشت نقدی)',
      color: 'text-slate-400',
      bgGrad: 'from-slate-700/10 to-neutral-800/10 border-slate-500/30',
      perks: ['کسب ۱.۲۵ برابر امتیاز در خریدها', 'دسترسی زودهنگام به حراجی‌های فصلی و جشنواره‌ها']
    },
    {
      tier: 'gold',
      title: 'مشتری طلایی',
      pointsRange: '۱,۰۰۰ تا ۲,۹۹۹ امتیاز',
      multiplier: 'ضریب ۱.۵x (۱.۵٪ برگشت نقدی)',
      color: 'text-amber-400',
      bgGrad: 'from-amber-600/15 to-yellow-600/10 border-amber-500/40',
      perks: [
        'کسب ۱.۵ برابر امتیاز در تمامی خریدها',
        'بسته‌بندی ضربه‌گیر ویژه قطعات حساس بدون هزینه اضافی',
        'اولویت پردازش و ارسال در صف بسته‌بندی انبار'
      ]
    },
    {
      tier: 'diamond',
      title: 'مشتری VIP الماس',
      pointsRange: '۳,۰۰۰+ امتیاز',
      multiplier: 'ضریب ۲.۰x (۲٪ برگشت نقدی)',
      color: 'text-cyan-400',
      bgGrad: 'from-cyan-900/20 to-blue-900/15 border-cyan-400/40',
      perks: [
        'کسب ۲ برابر امتیاز در تمامی خریدها (۲٪ تخفیف قطعی)',
        'ارسال اکسپرس و بیمه‌شده کاملاً رایگان بدون سقف سفارش',
        'مشاوره فنی تلفنی اختصاصی با مهندسین ارشد خودرو',
        'اولویت ترخیص و تامین قطعات نایاب و سفارشی از گمرک'
      ]
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Hero Points Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900 border border-neutral-800 p-6 sm:p-8 text-white shadow-2xl">
        {/* Glow accents */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          {/* Points summary */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 ${tierInfo.badgeClass}`}>
                <Award className="w-4 h-4" />
                <span>{tierInfo.title}</span>
              </span>
              <span className="text-xs text-neutral-400 font-medium">باشگاه وفاداری چین‌پارت</span>
            </div>

            <div>
              <p className="text-xs text-neutral-400 mb-1">موجودی امتیازات فعال شما:</p>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl sm:text-5xl font-black text-amber-400 tracking-tight font-mono">
                  {points.toLocaleString('fa-IR')}
                </span>
                <span className="text-lg font-bold text-neutral-300">امتیاز</span>
              </div>
            </div>

            <div className="p-3.5 bg-neutral-800/80 backdrop-blur-xs rounded-2xl border border-neutral-700/60 inline-flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <Coins className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>ارزش تخفیف نقدی در سبد خرید:</span>
              </div>
              <span className="text-sm font-black text-white font-mono">
                {formatToman(cashValue)}
              </span>
            </div>

            {/* Next Tier Progress */}
            {tierInfo.nextTier ? (
              <div className="space-y-1.5 max-w-md pt-2">
                <div className="flex justify-between text-xs text-neutral-300 font-medium">
                  <span>پیشرفت به سوی {tierInfo.nextTier.title}:</span>
                  <span className="text-amber-400 font-bold">
                    {tierInfo.nextTier.pointsNeeded.toLocaleString('fa-IR')} امتیاز تا ارتقا
                  </span>
                </div>
                <div className="w-full bg-neutral-800 rounded-full h-2.5 overflow-hidden border border-neutral-700">
                  <div 
                    className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${tierInfo.nextTier.percent}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-cyan-300 font-bold pt-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>شما به بالاترین سطح باشگاه وفاداری (VIP الماس) دست یافته‌اید!</span>
              </div>
            )}
          </div>

          {/* Quick Actions & Stats */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
            <button
              onClick={() => onNavigate('shop')}
              className="px-6 py-3.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-2xl font-bold text-xs shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>خرج امتیاز در خرید قطعات</span>
              <ChevronRight className="w-4 h-4 rotate-180" />
            </button>

            <button
              onClick={onOpenVehicleModal}
              className="px-6 py-3 bg-neutral-800/90 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Car className="w-4 h-4 text-amber-400" />
              <span>ثبت خودرو در گاراژ (+۲۰ امتیاز)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mini Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-neutral-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-neutral-400 block font-medium">موجودی فعلی امتیاز</span>
            <span className="text-xl font-black text-neutral-900 font-mono">
              {points.toLocaleString('fa-IR')}
            </span>
            <span className="text-[11px] text-neutral-500 block">امتیاز قابل استفاده</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-neutral-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <ArrowDownLeft className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-neutral-400 block font-medium">کل امتیازات کسب‌شده</span>
            <span className="text-xl font-black text-emerald-600 font-mono">
              +{totalEarned.toLocaleString('fa-IR')}
            </span>
            <span className="text-[11px] text-neutral-500 block">از سفارش‌ها و بونوس‌ها</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-neutral-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
            <ArrowUpRight className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-neutral-400 block font-medium">امتیازات خرج‌شده</span>
            <span className="text-xl font-black text-rose-600 font-mono">
              -{totalRedeemed.toLocaleString('fa-IR')}
            </span>
            <span className="text-[11px] text-neutral-500 block">معادل تخفیف‌های دریافت‌شده</span>
          </div>
        </div>
      </div>

      {/* Ways to Earn Points */}
      <div className="bg-white rounded-3xl border border-neutral-200/80 p-6 sm:p-8 space-y-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-red-600" />
            <h3 className="text-base sm:text-lg font-black text-neutral-900">چگونه امتیاز وفاداری بیشتری کسب کنم؟</h3>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            با هر تعامل در فروشگاه چین‌پارت امتیاز کسب کنید و هزینه خریدهای بعدی خود را کاهش دهید.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/60 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-xs text-neutral-900">خرید قطعات یدکی</h4>
            <p className="text-[11px] text-neutral-600 leading-relaxed">
              به ازای هر ۱۰,۰۰۰ تومان خرید، ۱ امتیاز دریافت کنید (با ضریب سطوح طلایی تا ۲ برابر).
            </p>
            <span className="inline-block text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md">
              ۱٪ تا ۲٪ بازگشت وجه
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/60 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
              <Gift className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-xs text-neutral-900">عضویت در سایت</h4>
            <p className="text-[11px] text-neutral-600 leading-relaxed">
              بلافاصله پس از ثبت شماره تماس و تکمیل پروفایل، ۵۰ امتیاز هدیه خوش‌آمدگویی بگیرید.
            </p>
            <span className="inline-block text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
              +۵۰ امتیاز هدیه
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/60 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
              <Car className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-xs text-neutral-900">ثبت خودرو در گاراژ</h4>
            <p className="text-[11px] text-neutral-600 leading-relaxed">
              با معرفی مدل خودروی چینی خود در بخش گاراژ، ۲۰ امتیاز بونوس فنی دریافت نمایید.
            </p>
            <span className="inline-block text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
              +۲۰ امتیاز بونوس
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/60 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
              <Zap className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-xs text-neutral-900">اولین خرید در سایت</h4>
            <p className="text-[11px] text-neutral-600 leading-relaxed">
              ثبت اولین سفارش موفق علاوه بر امتیاز عادی، ۱۰۰ امتیاز پاداش ویژه خریدار جدید دارد.
            </p>
            <span className="inline-block text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
              +۱۰۰ امتیاز ویژه
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Points Calculator */}
      <div className="bg-white rounded-3xl border border-neutral-200/80 p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-amber-600" />
          <div>
            <h3 className="text-base font-black text-neutral-900">محاسبه‌گر تبدیل امتیاز به تخفیف فاکتور</h3>
            <p className="text-xs text-neutral-500">
              هر ۱ امتیاز وفاداری در تسویه حساب معادل ۱,۰۰۰ تومان کسر هزینه مستقیم از سفارش است.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center bg-neutral-50 p-6 rounded-2xl border border-neutral-200">
          <div className="space-y-3">
            <label className="text-xs font-bold text-neutral-700 block">
              تعداد امتیاز مورد نظر را وارد یا تغییر دهید:
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="10"
                max={Math.max(5000, points * 2)}
                step="10"
                value={calcInput}
                onChange={(e) => setCalcInput(Number(e.target.value))}
                className="flex-1 accent-amber-500 cursor-pointer"
              />
              <input
                type="number"
                min="0"
                value={calcInput}
                onChange={(e) => setCalcInput(Math.max(0, Number(e.target.value)))}
                className="w-24 px-3 py-2 bg-white border border-neutral-300 rounded-xl text-xs font-bold text-center font-mono"
              />
            </div>
            <div className="flex gap-2">
              {[50, 100, 250, 500, 1000].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setCalcInput(val)}
                  className={`px-2.5 py-1 text-[11px] rounded-lg font-bold border transition-colors ${
                    calcInput === val 
                      ? 'bg-neutral-900 text-white border-neutral-900' 
                      : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-100'
                  }`}
                >
                  {val} امتیاز
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 bg-white rounded-xl border border-neutral-200 text-center space-y-1">
            <span className="text-xs text-neutral-500 font-medium">ارزش تخفیف دریافتی در تسویه حساب:</span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono">
              {formatToman(calculatePointsValue(calcInput))}
            </div>
            <p className="text-[11px] text-neutral-400">
              قابلیت کسر خودکار در صفحه مرحله نهایی سفارش (Checkout)
            </p>
          </div>
        </div>
      </div>

      {/* Levels & Tiers Guide */}
      <div className="bg-white rounded-3xl border border-neutral-200/80 p-6 sm:p-8 space-y-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-neutral-900" />
            <h3 className="text-base font-black text-neutral-900">سطوح عضویت باشگاه و مزایای هر سطح</h3>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            با افزایش مجموع خرید و امتیازات، به سطوح بالاتر ارتقا یافته و از امکانات اختصاصی بهره‌مند شوید.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {allTiers.map((t) => {
            const isUserTier = tierInfo.tier === t.tier;
            return (
              <div 
                key={t.tier}
                className={`p-5 rounded-2xl border transition-all relative flex flex-col justify-between ${
                  isUserTier
                    ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/30 shadow-md'
                    : 'border-neutral-200 bg-white hover:border-neutral-300 shadow-xs'
                }`}
              >
                {isUserTier && (
                  <span className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-neutral-950 shadow-xs">
                    سطح فعلی شما
                  </span>
                )}

                <div className="space-y-3">
                  <div>
                    <h4 className={`font-black text-sm ${t.color}`}>{t.title}</h4>
                    <span className="text-[11px] text-neutral-500 font-medium block mt-0.5">{t.pointsRange}</span>
                    <span className="text-[10px] font-bold text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded-md inline-block mt-1">
                      {t.multiplier}
                    </span>
                  </div>

                  <ul className="space-y-1.5 pt-2 border-t border-neutral-100 text-[11px] text-neutral-600">
                    {t.perks.map((perk, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{perk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-3xl border border-neutral-200/80 p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-neutral-900" />
              <h3 className="text-base font-black text-neutral-900">گردش حساب و تاریخچه امتیازات</h3>
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              جزئیات کامل کسب، کسر و دریافت امتیازات هدیه
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-neutral-100 p-1 rounded-xl text-xs font-bold">
            {[
              { id: 'all', label: 'همه تراکنش‌ها' },
              { id: 'earned', label: 'کسب شده' },
              { id: 'redeemed', label: 'خرج شده' },
              { id: 'bonus', label: 'هدیه و پاداش' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id as any)}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  filterType === f.id
                    ? 'bg-white text-neutral-900 shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12 bg-neutral-50 rounded-2xl border border-neutral-200/60 space-y-3">
            <Coins className="w-10 h-10 text-neutral-300 mx-auto" />
            <h4 className="text-xs font-bold text-neutral-700">تراکنشی در این دسته یافت نشد</h4>
            <p className="text-[11px] text-neutral-500">
              با ثبت سفارش و خرید قطعات از فروشگاه، سوابق امتیازات شما در اینجا نمایش داده خواهند شد.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-500 font-medium">
                  <th className="py-3 px-3">نوع عملیات</th>
                  <th className="py-3 px-3">توضیحات و شماره سفارش</th>
                  <th className="py-3 px-3">تاریخ و زمان</th>
                  <th className="py-3 px-3 text-center">تغییر امتیاز</th>
                  <th className="py-3 px-3 text-left">مانده حساب</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-medium">
                {filteredTransactions.map(tx => {
                  const isPositive = tx.points > 0;
                  return (
                    <tr key={tx.id} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="py-3.5 px-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                          tx.type === 'earned'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : tx.type === 'redeemed'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}>
                          {tx.type === 'earned' ? (
                            <>
                              <ArrowDownLeft className="w-3 h-3 text-emerald-600" />
                              <span>کسب امتیاز خرید</span>
                            </>
                          ) : tx.type === 'redeemed' ? (
                            <>
                              <ArrowUpRight className="w-3 h-3 text-rose-600" />
                              <span>تخفیف در سفارش</span>
                            </>
                          ) : (
                            <>
                              <Gift className="w-3 h-3 text-amber-600" />
                              <span>هدیه و پاداش</span>
                            </>
                          )}
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="space-y-0.5">
                          <span className="text-neutral-900 font-bold block">{tx.description}</span>
                          {tx.orderNumber && (
                            <span className="text-[10px] text-neutral-400 font-mono">
                              شماره پیگیری: {tx.orderNumber}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-neutral-500 font-mono text-[11px]">
                        {tx.date}
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <span className={`font-black font-mono text-sm ${
                          isPositive ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {isPositive ? `+${tx.points.toLocaleString('fa-IR')}` : tx.points.toLocaleString('fa-IR')}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-left font-mono font-bold text-neutral-800">
                        {tx.balanceAfter.toLocaleString('fa-IR')} امتیاز
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
