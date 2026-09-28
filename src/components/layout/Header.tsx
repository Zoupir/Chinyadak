import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { SearchAutocomplete } from '../search/SearchAutocomplete';
import { 
  Wrench, 
  Car, 
  ShoppingBag, 
  Heart, 
  Layers, 
  PhoneCall, 
  Truck, 
  HelpCircle, 
  ChevronDown, 
  SlidersHorizontal,
  ShieldAlert,
  Search,
  CheckCircle2,
  Settings,
  Sparkles,
  ArrowRightLeft,
  User,
  LogOut,
  Edit3,
  ExternalLink,
  ShieldCheck,
  Share2
} from 'lucide-react';
import { formatToman } from '../../utils/formatters';
import { ShareButton } from '../common/ShareButton';

interface HeaderProps {
  onOpenVehicleModal: () => void;
  onOpenCartDrawer: () => void;
  onNavigate: (view: string, param?: string) => void;
  currentView: string;
  currentParam?: string;
  onOpenAuthModal?: (mode: 'login' | 'register') => void;
  onOpenAiSearch?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenVehicleModal,
  onOpenCartDrawer,
  onNavigate,
  currentView,
  currentParam,
  onOpenAuthModal,
  onOpenAiSearch
}) => {
  const { 
    brands,
    selectedVehicle, 
    cartCount, 
    cartTotal, 
    wishlist, 
    compareList, 
    categories, 
    settings,
    currentCustomer,
    customerLogout,
    getCustomerPoints,
    adminAuth,
    adminLogout
  } = useStore();

  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [isBrandsMenuOpen, setIsBrandsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Hover timers to prevent menu abrupt closing
  const megaTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const brandsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMegaMenuEnter = () => {
    if (megaTimeoutRef.current) clearTimeout(megaTimeoutRef.current);
    setIsMegaMenuOpen(true);
  };

  const handleMegaMenuLeave = () => {
    megaTimeoutRef.current = setTimeout(() => {
      setIsMegaMenuOpen(false);
    }, 400);
  };

  const handleBrandsMenuEnter = () => {
    if (brandsTimeoutRef.current) clearTimeout(brandsTimeoutRef.current);
    setIsBrandsMenuOpen(true);
  };

  const handleBrandsMenuLeave = () => {
    brandsTimeoutRef.current = setTimeout(() => {
      setIsBrandsMenuOpen(false);
    }, 400);
  };

  useEffect(() => {
    return () => {
      if (megaTimeoutRef.current) clearTimeout(megaTimeoutRef.current);
      if (brandsTimeoutRef.current) clearTimeout(brandsTimeoutRef.current);
    };
  }, []);

  const handleMenuClick = (link: string) => {
    if (!link) return;
    if (link.startsWith('http://') || link.startsWith('https://')) {
      window.open(link, '_blank');
      return;
    }
    if (link.includes(':')) {
      const [view, param] = link.split(':');
      onNavigate(view, param);
    } else {
      onNavigate(link);
    }
  };

  // Default menu links fallback if none configured
  const topNavLinks = (settings.navigationMenus && settings.navigationMenus.length > 0)
    ? settings.navigationMenus
    : [
        { id: 'm1', title: 'قطعات مصرفی و سرویس دوره‌ای', link: 'shop:maintenance', badge: 'سرویس' },
        { id: 'm2', title: 'درخواست استعلام قطعه', link: 'part-request', badge: 'سریع' },
        { id: 'm3', title: 'وبلاگ و آموزش', link: 'blog' },
        { id: 'm4', title: 'گاراژ من', link: 'account:garage' }
      ];

  const isAuthenticated = Boolean(currentCustomer || adminAuth.isAuthenticated);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-neutral-200 shadow-xs">
      
      {/* Top Notification Bar */}
      <div className="bg-neutral-900 text-neutral-300 text-[11px] py-1.5 px-4 hidden md:block">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 text-neutral-300">
              <Truck className="w-3.5 h-3.5 text-red-500" />
              {settings.announcementText || 'تضمین ارسال سریع، اصالت شرکتی و سلامت قطعات در سراسر کشور'}
            </span>
            <span className="text-neutral-700">|</span>
            <button 
              onClick={() => onNavigate('part-request')}
              className="hover:text-white transition-colors flex items-center gap-1 text-neutral-300 hover:text-red-400 font-semibold cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-red-400" />
              استعلام و واردات قطعه نایاب
            </button>
            <span className="text-neutral-700">|</span>
            <button 
              onClick={onOpenAiSearch}
              className="hover:text-white transition-colors flex items-center gap-1 text-amber-300 hover:text-amber-200 font-bold cursor-pointer bg-amber-500/10 hover:bg-amber-500/20 px-2 py-0.5 rounded-md border border-amber-500/30"
            >
              <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
              استعلام زنده با هوش مصنوعی و گوگل
            </button>
          </div>

          <div className="flex items-center gap-4">
            {/* Authenticated User Status & Logout */}
            {currentCustomer ? (
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>{currentCustomer.firstName} {currentCustomer.lastName} ({currentCustomer.typeTitle})</span>
                </div>
                <button
                  onClick={() => onNavigate('account', 'loyalty')}
                  className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-bold transition-all cursor-pointer shadow-xs"
                  title="مشاهده باشگاه مشتریان و امتیازات"
                >
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>{getCustomerPoints(currentCustomer.id).toLocaleString('fa-IR')} امتیاز</span>
                </button>
                <button
                  onClick={() => onNavigate('account')}
                  className="hover:text-white text-neutral-300 underline decoration-neutral-600 transition-colors cursor-pointer"
                >
                  حساب من
                </button>
                <button
                  onClick={customerLogout}
                  className="text-red-400 hover:text-red-300 font-bold flex items-center gap-1 cursor-pointer"
                  title="خروج از حساب کاربری"
                >
                  <LogOut className="w-3 h-3" />
                  <span>خروج</span>
                </button>
              </div>
            ) : adminAuth.isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>پنل مدیریت فعال ({adminAuth.currentUser?.fullName || adminAuth.username})</span>
                </div>
                <button
                  onClick={() => onNavigate('admin')}
                  className="text-neutral-300 hover:text-white underline cursor-pointer"
                >
                  داشبورد
                </button>
                <button
                  onClick={adminLogout}
                  className="text-red-400 hover:text-red-300 font-bold flex items-center gap-1 cursor-pointer"
                  title="خروج از حساب مدیریت"
                >
                  <LogOut className="w-3 h-3" />
                  <span>خروج مدیر</span>
                </button>
              </div>
            ) : (
              /* When logged out: show login/register */
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => onOpenAuthModal?.('login')}
                  className="hover:text-white transition-colors text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <span>ورود به حساب</span>
                </button>
                <span className="text-neutral-700">/</span>
                <button 
                  onClick={() => onOpenAuthModal?.('register')}
                  className="hover:text-white transition-colors text-neutral-300 hover:text-white font-medium cursor-pointer"
                >
                  <span>ثبت‌نام خریدار و همکار</span>
                </button>
              </div>
            )}

            <span className="text-neutral-700">|</span>
            <button 
              onClick={() => onNavigate('tracking')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              پیگیری سفارش
            </button>
            <span className="text-neutral-700">|</span>
            <button 
              onClick={() => onNavigate('blog')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              وبلاگ و آموزش
            </button>
            <span className="text-neutral-700">|</span>
            <ShareButton
              view={currentView}
              param={currentParam}
              variant="minimal"
              label="اشتراک‌گذاری صفحه"
              className="text-neutral-400 hover:text-white"
            />
            <span className="text-neutral-700">|</span>
            <a 
              href={`tel:${settings.contactPhone}`} 
              className="flex items-center gap-1.5 hover:text-white transition-colors font-mono"
            >
              <PhoneCall className="w-3 h-3 text-red-500" />
              {settings.contactPhone}
            </a>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MOBILE HEADER LAYOUT (< md)
      ========================================================================= */}
      <div className="md:hidden">
        {/* Row 1: Brand Logo + Controls */}
        <div className="px-3 py-2 flex items-center justify-between gap-2 border-b border-neutral-100">
          {/* Brand Logo */}
          <button 
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 shrink-0 text-right group cursor-pointer"
          >
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt={settings.siteTitle} className="h-8 w-auto object-contain max-w-[120px]" />
            ) : (
              <div className="flex items-center gap-1.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white shadow-xs">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-black text-base tracking-tight text-neutral-900 leading-none">
                    {settings.siteTitle?.split('|')[0]?.trim() || 'چین‌پارت'}
                  </span>
                  <span className="text-[9px] bg-red-600 text-white font-bold px-1 rounded-sm mr-1">
                    PRO
                  </span>
                </div>
              </div>
            )}
          </button>

          {/* Quick Action Controls on Mobile */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* User Auth Button for Mobile */}
            {currentCustomer ? (
              <button
                onClick={() => onNavigate('account')}
                className="h-8 px-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 flex items-center gap-1 text-[11px] font-bold text-neutral-800"
                title="حساب کاربری من"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="truncate max-w-[65px]">{currentCustomer.firstName}</span>
              </button>
            ) : adminAuth.isAuthenticated ? (
              <button
                onClick={() => onNavigate('admin')}
                className="h-8 px-2 rounded-lg bg-amber-500 text-white flex items-center gap-1 text-[11px] font-bold shadow-xs"
                title="پنل مدیریت"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>مدیر</span>
              </button>
            ) : (
              <button
                onClick={() => onOpenAuthModal?.('login')}
                className="h-8 px-2.5 rounded-lg border border-neutral-300 hover:border-neutral-900 bg-white flex items-center gap-1 text-[11px] font-bold text-neutral-800 shadow-xs"
              >
                <User className="w-3.5 h-3.5 text-neutral-600" />
                <span>ورود</span>
              </button>
            )}

            {/* Quick Vehicle Chip */}
            <button
              onClick={onOpenVehicleModal}
              className={`h-8 px-2 rounded-lg border flex items-center gap-1 text-[11px] font-bold ${
                selectedVehicle 
                  ? 'bg-neutral-900 text-white border-neutral-900' 
                  : 'bg-red-50 text-red-700 border-red-200'
              }`}
            >
              <Car className="w-3.5 h-3.5" />
              <span className="truncate max-w-[75px]">{selectedVehicle ? selectedVehicle.modelName : 'خودرو'}</span>
            </button>

            {/* Share Button (Mobile) */}
            <ShareButton
              view={currentView}
              param={currentParam}
              variant="icon"
              className="h-8 w-8 rounded-lg p-0 flex items-center justify-center border-neutral-300 text-neutral-700 bg-white"
            />

            {/* Cart Button */}
            <button
              onClick={onOpenCartDrawer}
              className="h-8 w-8 rounded-lg bg-red-600 text-white flex items-center justify-center relative shadow-xs cursor-pointer"
              title="سبد خرید"
            >
              <ShoppingBag className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-neutral-900 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-white">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Row 2: Full-Width Search Input */}
        <div className="px-3 py-2 bg-neutral-50/70 border-b border-neutral-200/80">
          <SearchAutocomplete
            onSelectProduct={(id) => onNavigate('product', id)}
            onSelectModel={(id) => onNavigate('car-model', id)}
            onSelectCategory={(slug) => onNavigate('category', slug)}
            onSelectArticle={(id) => onNavigate('article', id)}
            onRequestPart={(q) => onNavigate('part-request', q)}
          />
        </div>
      </div>

      {/* =========================================================================
          DESKTOP HEADER LAYOUT (>= md)
      ========================================================================= */}
      <div className="hidden md:flex max-w-7xl mx-auto px-4 py-3 items-center justify-between gap-4">
        {/* Brand Logo */}
        <button 
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2.5 shrink-0 text-right group cursor-pointer"
        >
          {settings.logoUrl ? (
            <img src={settings.logoUrl} alt={settings.siteTitle} className="h-10 w-auto object-contain max-w-[160px]" />
          ) : (
            <>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white shadow-md shadow-red-600/30 group-hover:scale-105 transition-transform">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-xl tracking-tight text-neutral-900 group-hover:text-red-600 transition-colors">
                    {settings.siteTitle?.split('|')[0]?.trim() || 'چین‌پارت'}
                  </span>
                  <span className="text-[10px] bg-red-600 text-white font-black px-1.5 py-0.2 rounded-sm uppercase tracking-wider">
                    PRO
                  </span>
                </div>
                <p className="text-[10px] text-neutral-500 -mt-0.5">{settings.siteSlogan || 'بازار تخصصی قطعات خودروهای چینی'}</p>
              </div>
            </>
          )}
        </button>

        {/* Global Instant Search Autocomplete */}
        <div className="flex-1 max-w-xl mx-2">
          <SearchAutocomplete
            onSelectProduct={(id) => onNavigate('product', id)}
            onSelectModel={(id) => onNavigate('car-model', id)}
            onSelectCategory={(slug) => onNavigate('category', slug)}
            onSelectArticle={(id) => onNavigate('article', id)}
            onRequestPart={(q) => onNavigate('part-request', q)}
          />
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Active Vehicle Button */}
          <button
            onClick={onOpenVehicleModal}
            className={`h-11 px-3.5 rounded-xl border flex items-center gap-2.5 text-xs font-bold transition-all shadow-xs cursor-pointer ${
              selectedVehicle 
                ? 'bg-neutral-900 text-white border-neutral-900 hover:bg-neutral-800' 
                : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100/80 animate-pulse'
            }`}
            title="انتخاب و تغییر خودروی من"
          >
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
              selectedVehicle ? 'bg-red-600 text-white' : 'bg-red-600 text-white'
            }`}>
              <Car className="w-3.5 h-3.5" />
            </div>

            <div className="text-right hidden sm:block">
              {selectedVehicle ? (
                <>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-neutral-400 font-normal">خودروی فعال:</span>
                    <span className="text-red-400 font-black text-[11px] truncate max-w-[110px]">{selectedVehicle.modelName}</span>
                  </div>
                  <p className="text-[10px] text-neutral-300 font-normal">فیلتر قطعات فعال است</p>
                </>
              ) : (
                <>
                  <span className="block text-[11px] font-bold">خودروی خود را انتخاب کنید</span>
                  <span className="text-[9px] text-red-500 font-normal">فقط قطعات سازگار با ماشین شما</span>
                </>
              )}
            </div>
            <ChevronDown className="w-3.5 h-3.5 opacity-60" />
          </button>

          {/* Customer Profile or Admin Status or Login/Register Button */}
          {currentCustomer ? (
            <div className="relative group">
              <button
                onClick={() => onNavigate('account')}
                className="h-11 px-3 rounded-xl border border-neutral-200 hover:border-neutral-300 bg-white flex items-center gap-2 text-xs font-bold text-neutral-800 transition-colors shadow-xs cursor-pointer"
                title="حساب کاربری"
              >
                <div className="w-6 h-6 rounded-lg bg-neutral-900 text-white flex items-center justify-center">
                  <User className="w-3.5 h-3.5" />
                </div>
                <span className="hidden xl:inline">{currentCustomer.firstName}</span>
                <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
              </button>

              <div className="absolute top-full left-0 w-44 bg-white rounded-xl shadow-xl border border-neutral-200 p-1.5 hidden group-hover:block z-50 text-xs before:absolute before:-top-3 before:left-0 before:right-0 before:h-3 before:content-['']">
                <button
                  onClick={() => onNavigate('account', 'loyalty')}
                  className="w-full text-right p-2 hover:bg-amber-50 rounded-lg flex items-center justify-between text-amber-900 font-bold cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>باشگاه مشتریان</span>
                  </div>
                  <span className="text-[10px] bg-amber-200/80 px-1.5 py-0.5 rounded-full font-mono font-black">
                    {getCustomerPoints(currentCustomer.id)} امتیاز
                  </span>
                </button>
                <button
                  onClick={() => onNavigate('account', 'garage')}
                  className="w-full text-right p-2 hover:bg-neutral-50 rounded-lg flex items-center gap-2 text-neutral-700 cursor-pointer"
                >
                  <Car className="w-3.5 h-3.5 text-red-600" />
                  <span>گاراژ خودروها</span>
                </button>
                <button
                  onClick={() => onNavigate('account', 'orders')}
                  className="w-full text-right p-2 hover:bg-neutral-50 rounded-lg flex items-center gap-2 text-neutral-700 cursor-pointer"
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />
                  <span>سفارش‌های من</span>
                </button>
                <button
                  onClick={() => onNavigate('account', 'profile')}
                  className="w-full text-right p-2 hover:bg-neutral-50 rounded-lg flex items-center gap-2 text-neutral-700 cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 text-neutral-600" />
                  <span>مشخصات حساب</span>
                </button>
                <div className="border-t border-neutral-100 my-1"></div>
                <button
                  onClick={customerLogout}
                  className="w-full text-right p-2 hover:bg-red-50 text-red-600 rounded-lg flex items-center gap-2 cursor-pointer font-bold"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>خروج از حساب</span>
                </button>
              </div>
            </div>
          ) : adminAuth.isAuthenticated ? (
            <div className="relative group">
              <button
                onClick={() => onNavigate('admin')}
                className="h-11 px-3 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 flex items-center gap-2 text-xs font-bold text-neutral-900 transition-colors shadow-xs cursor-pointer"
                title="پنل مدیریت"
              >
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span className="hidden xl:inline">{adminAuth.currentUser?.fullName || 'مدیریت'}</span>
                <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
              </button>

              <div className="absolute top-full left-0 w-44 bg-white rounded-xl shadow-xl border border-neutral-200 p-1.5 hidden group-hover:block z-50 text-xs before:absolute before:-top-3 before:left-0 before:right-0 before:h-3 before:content-['']">
                <button
                  onClick={() => onNavigate('admin')}
                  className="w-full text-right p-2 hover:bg-neutral-50 rounded-lg flex items-center gap-2 text-neutral-700 cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5 text-neutral-600" />
                  <span>پنل مدیریت</span>
                </button>
                <div className="border-t border-neutral-100 my-1"></div>
                <button
                  onClick={adminLogout}
                  className="w-full text-right p-2 hover:bg-red-50 text-red-600 rounded-lg flex items-center gap-2 cursor-pointer font-bold"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>خروج مدیر</span>
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => onOpenAuthModal?.('login')}
              className="h-11 px-3 rounded-xl border border-neutral-300 hover:border-neutral-900 bg-white hover:bg-neutral-50 flex items-center gap-1.5 text-xs font-bold text-neutral-800 transition-colors shadow-xs cursor-pointer"
              title="ورود یا ثبت‌نام مشتری"
            >
              <User className="w-4 h-4 text-neutral-600" />
              <span className="hidden sm:inline">ورود / ثبت‌نام</span>
            </button>
          )}

          {/* Compare Button */}
          {compareList.length > 0 && (
            <button
              onClick={() => onNavigate('compare')}
              className="relative p-2.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-700 transition-colors cursor-pointer"
              title="مقایسه محصولات"
            >
              <ArrowRightLeft className="w-5 h-5" />
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                {compareList.length}
              </span>
            </button>
          )}

          {/* Wishlist Button */}
          <button
            onClick={() => onNavigate('account', 'wishlist')}
            className="p-2.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-700 transition-colors relative hidden sm:flex items-center justify-center cursor-pointer"
            title="علاقه‌مندی‌ها"
          >
            <Heart className="w-5 h-5" />
            {wishlist.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-neutral-900 text-white text-[9px] font-bold flex items-center justify-center">
                {wishlist.length}
              </span>
            )}
          </button>

          {/* Share Page Button (Desktop) */}
          <ShareButton
            view={currentView}
            param={currentParam}
            variant="icon"
            className="hidden sm:flex"
          />

          {/* Cart Button */}
          <button
            onClick={onOpenCartDrawer}
            className="h-11 px-3 md:px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl flex items-center gap-2.5 transition-colors shadow-md shadow-red-600/20 font-bold text-xs cursor-pointer"
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-neutral-900 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-white">
                  {cartCount}
                </span>
              )}
            </div>
            <div className="text-right hidden lg:block">
              <span className="block text-[10px] text-red-200">سبد خرید</span>
              <span className="text-xs font-black">{cartCount > 0 ? formatToman(cartTotal) : 'خالی'}</span>
            </div>
          </button>
        </div>
      </div>

      {/* =========================================================================
          SECONDARY NAVIGATION BAR (WITH HOVER BRIDGE & DYNAMIC EDITABLE MENUS)
      ========================================================================= */}
      <div className="border-t border-neutral-200/80 bg-neutral-50/50 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-1">
            
            {/* 1. Mega Menu Toggle with HOVER BRIDGE & DEBOUNCE */}
            <div 
              className="relative"
              onMouseEnter={handleMegaMenuEnter}
              onMouseLeave={handleMegaMenuLeave}
            >
              <button
                onClick={() => {
                  if (megaTimeoutRef.current) clearTimeout(megaTimeoutRef.current);
                  setIsMegaMenuOpen(!isMegaMenuOpen);
                }}
                className={`py-3 px-3.5 flex items-center gap-1.5 rounded-lg transition-colors cursor-pointer ${
                  isMegaMenuOpen ? 'text-red-600 bg-white shadow-xs font-bold' : 'text-neutral-800 hover:text-red-600'
                }`}
              >
                <Layers className="w-4 h-4 text-red-600" />
                <span>دسته‌بندی قطعات خودرو</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isMegaMenuOpen ? 'rotate-180 text-red-600' : ''}`} />
              </button>

              {/* Mega Menu Flyout: With hover bridge so mouse never loses focus */}
              {isMegaMenuOpen && (
                <div 
                  className="absolute top-full right-0 w-[820px] bg-white rounded-2xl shadow-2xl border border-neutral-200 p-6 grid grid-cols-3 gap-6 z-50 before:absolute before:-top-4 before:left-0 before:right-0 before:h-5 before:content-['']"
                  onMouseEnter={handleMegaMenuEnter}
                  onMouseLeave={handleMegaMenuLeave}
                >
                  {categories.slice(0, 9).map((cat) => (
                    <div key={cat.id} className="space-y-2">
                      <button
                        onClick={() => {
                          onNavigate('category', cat.slug);
                          setIsMegaMenuOpen(false);
                        }}
                        className="font-bold text-neutral-900 hover:text-red-600 flex items-center gap-2 text-xs text-right group cursor-pointer"
                      >
                        {cat.iconUrl ? (
                          <img src={cat.iconUrl} alt="" className="w-4 h-4 object-contain rounded-xs" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-red-600 group-hover:scale-150 transition-transform"></span>
                        )}
                        <span>{cat.nameFa}</span>
                      </button>
                      <ul className="space-y-1 pr-3 border-r-2 border-neutral-100">
                        {cat.subcategories?.slice(0, 4).map((sub) => (
                          <li key={sub.id}>
                            <button
                              onClick={() => {
                                onNavigate('category', `${cat.slug}?sub=${sub.slug}`);
                                setIsMegaMenuOpen(false);
                              }}
                              className="text-[11px] text-neutral-500 hover:text-red-600 transition-colors text-right block py-0.5 cursor-pointer"
                            >
                              {sub.nameFa}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  <div className="col-span-3 pt-3 border-t border-neutral-100 flex items-center justify-between text-neutral-500 text-[11px]">
                    <span className="text-emerald-700 font-medium">تضمین تطبیق ۱۰۰٪ فیتمنت با خودروی انتخاب‌شده شما</span>
                    <button 
                      onClick={() => { onNavigate('shop'); setIsMegaMenuOpen(false); }}
                      className="text-red-600 hover:underline font-bold cursor-pointer"
                    >
                      مشاهده تمامی دسته‌ها و قطعات ←
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Brands Menu Dropdown with HOVER BRIDGE & DEBOUNCE */}
            <div 
              className="relative"
              onMouseEnter={handleBrandsMenuEnter}
              onMouseLeave={handleBrandsMenuLeave}
            >
              <button
                onClick={() => {
                  if (brandsTimeoutRef.current) clearTimeout(brandsTimeoutRef.current);
                  setIsBrandsMenuOpen(!isBrandsMenuOpen);
                }}
                className={`py-3 px-3 flex items-center gap-1.5 rounded-lg transition-colors cursor-pointer ${
                  isBrandsMenuOpen ? 'text-red-600 bg-white shadow-xs font-bold' : 'text-neutral-700 hover:text-red-600'
                }`}
              >
                <span>برندهای خودرو</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {isBrandsMenuOpen && (
                <div 
                  className="absolute top-full right-0 w-64 bg-white rounded-xl shadow-xl border border-neutral-200 p-2 z-50 divide-y divide-neutral-100 before:absolute before:-top-4 before:left-0 before:right-0 before:h-5 before:content-['']"
                  onMouseEnter={handleBrandsMenuEnter}
                  onMouseLeave={handleBrandsMenuLeave}
                >
                  {brands.map(brand => (
                    <button
                      key={brand.id}
                      onClick={() => {
                        onNavigate('car-brand', brand.slug);
                        setIsBrandsMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-between p-2 hover:bg-neutral-50 rounded-lg text-right group cursor-pointer"
                    >
                      <span className="font-bold text-neutral-800 group-hover:text-red-600">{brand.nameFa}</span>
                      <span className="text-[10px] text-neutral-400 font-mono">{brand.nameEn}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 3. DYNAMIC EDITABLE NAVIGATION MENU ITEMS */}
            {topNavLinks.map(item => (
              <button
                key={item.id}
                onClick={() => handleMenuClick(item.link)}
                className="py-3 px-3 text-neutral-700 hover:text-red-600 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <span>{item.title}</span>
                {item.badge && (
                  <span className="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-md font-bold">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}

          </div>

          {/* Left Controls & Admin Shortcut */}
          <div className="flex items-center gap-2">
            {adminAuth.isAuthenticated && (
              <button
                onClick={() => onNavigate('admin')}
                className="py-1 px-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                title="ویرایش منوهای هدر و اضافه کردن دسته‌بندی"
              >
                <Edit3 className="w-3 h-3 text-amber-600" />
                <span>ویرایش منوی بالا</span>
              </button>
            )}

            <button
              onClick={() => onNavigate('admin')}
              className={`py-1.5 px-3 rounded-lg border text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                currentView === 'admin'
                  ? 'bg-neutral-900 text-white border-neutral-900'
                  : 'bg-white hover:bg-neutral-100 text-neutral-700 border-neutral-300'
              }`}
            >
              <Settings className="w-3.5 h-3.5 text-red-600" />
              <span>پنل مدیریت و انبار</span>
            </button>
          </div>

        </div>
      </div>

    </header>
  );
};
