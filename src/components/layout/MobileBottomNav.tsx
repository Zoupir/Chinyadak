import React from 'react';
import { ArrowRightLeft, Car, ChevronUp, Home, Layers, Search, ShoppingBag, User } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

interface MobileBottomNavProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenVehicleModal: () => void;
  onOpenCartDrawer: () => void;
  onOpenAuthModal?: (mode: 'login' | 'register') => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView,
  onNavigate,
  onOpenVehicleModal,
  onOpenCartDrawer,
  onOpenAuthModal
}) => {
  const {
    cartCount,
    selectedVehicle,
    currentCustomer,
    adminAuth,
    compareList,
    settings
  } = useStore();

  const handleUserButtonClick = () => {
    if (currentCustomer) {
      onNavigate('account');
    } else if (adminAuth.isAuthenticated) {
      onNavigate('admin');
    } else if (onOpenAuthModal) {
      onOpenAuthModal('login');
    } else {
      onNavigate('account');
    }
  };

  if (settings.layoutPreset === 'marketplace-rtl' || settings.layoutPreset === 'atelier-rtl') {
    const focusSearch = () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      window.setTimeout(() => {
        document.querySelector<HTMLInputElement>('.marketplace-ref-search input')?.focus();
      }, 220);
    };

    return (
      <nav className="marketplace-mobile-bottom-nav" aria-label="ناوبری موبایل">
        <button type="button" onClick={handleUserButtonClick} className={currentView === 'account' || currentView === 'admin' ? 'active' : ''}>
          <User />
          <span>حساب</span>
        </button>

        <button type="button" onClick={() => onNavigate('shop')} className={currentView === 'shop' || currentView === 'category' ? 'active' : ''}>
          <Layers />
          <span>دسته‌بندی</span>
        </button>

        <button type="button" onClick={onOpenVehicleModal} className={selectedVehicle ? 'active' : ''}>
          <Car />
          <span>فیلتر خودرو</span>
        </button>

        <button type="button" onClick={focusSearch}>
          <Search />
          <span>جستجو</span>
        </button>

        <button type="button" onClick={() => onNavigate('compare')} className={currentView === 'compare' ? 'active' : ''}>
          <span className="marketplace-bottom-icon-wrap">
            <ArrowRightLeft />
            {compareList.length > 0 && <b>{compareList.length}</b>}
          </span>
          <span>مقایسه</span>
        </button>

        <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <ChevronUp />
          <span>بالا</span>
        </button>
      </nav>
    );
  }

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-neutral-200 px-2 py-2 flex items-center justify-around shadow-lg">
      <button
        onClick={() => onNavigate('home')}
        className={`flex flex-col items-center gap-1 text-[10px] font-medium cursor-pointer ${currentView === 'home' ? 'text-red-600 font-bold' : 'text-neutral-500'}`}
      >
        <Home className="w-5 h-5" />
        <span>خانه</span>
      </button>

      <button
        onClick={() => onNavigate('shop')}
        className={`flex flex-col items-center gap-1 text-[10px] font-medium cursor-pointer ${currentView === 'shop' || currentView === 'category' ? 'text-red-600 font-bold' : 'text-neutral-500'}`}
      >
        <Layers className="w-5 h-5" />
        <span>دسته‌بندی</span>
      </button>

      <button onClick={onOpenVehicleModal} className="flex flex-col items-center gap-0.5 -mt-5 cursor-pointer">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white transition-transform active:scale-95 ${selectedVehicle ? 'bg-neutral-900 ring-2 ring-red-600' : 'bg-red-600'}`}>
          <Car className="w-6 h-6" />
        </div>
        <span className="text-[10px] font-bold text-neutral-800">{selectedVehicle ? selectedVehicle.modelName.slice(0, 8) : 'خودروی من'}</span>
      </button>

      <button onClick={onOpenCartDrawer} className="flex flex-col items-center gap-1 text-[10px] font-medium text-neutral-500 relative cursor-pointer">
        <span className="relative">
          <ShoppingBag className="w-5 h-5" />
          {cartCount > 0 && <b className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-600 text-white text-[9px] font-black flex items-center justify-center">{cartCount}</b>}
        </span>
        <span>سبد خرید</span>
      </button>

      <button onClick={handleUserButtonClick} className={`flex flex-col items-center gap-1 text-[10px] font-medium cursor-pointer ${currentView === 'account' || currentView === 'admin' ? 'text-red-600 font-bold' : 'text-neutral-500'}`}>
        <User className="w-5 h-5" />
        <span>{currentCustomer ? currentCustomer.firstName || 'حساب من' : adminAuth.isAuthenticated ? 'پنل مدیر' : 'ورود'}</span>
      </button>
    </div>
  );
};
