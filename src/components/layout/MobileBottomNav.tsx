import React from 'react';
import { Home, Layers, Search, Car, ShoppingBag, User, ShieldCheck } from 'lucide-react';
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
  const { cartCount, selectedVehicle, currentCustomer, adminAuth } = useStore();

  const handleUserButtonClick = () => {
    if (currentCustomer) {
      onNavigate('account');
    } else if (adminAuth.isAuthenticated) {
      onNavigate('admin');
    } else {
      if (onOpenAuthModal) {
        onOpenAuthModal('login');
      } else {
        onNavigate('account');
      }
    }
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-neutral-200 px-2 py-2 flex items-center justify-around shadow-lg">
      <button
        onClick={() => onNavigate('home')}
        className={`flex flex-col items-center gap-1 text-[10px] font-medium cursor-pointer ${
          currentView === 'home' ? 'text-red-600 font-bold' : 'text-neutral-500'
        }`}
      >
        <Home className="w-5 h-5" />
        <span>خانه</span>
      </button>

      <button
        onClick={() => onNavigate('shop')}
        className={`flex flex-col items-center gap-1 text-[10px] font-medium cursor-pointer ${
          currentView === 'shop' || currentView === 'category' ? 'text-red-600 font-bold' : 'text-neutral-500'
        }`}
      >
        <Layers className="w-5 h-5" />
        <span>دسته‌بندی</span>
      </button>

      {/* Central Highlighted Vehicle Finder button */}
      <button
        onClick={onOpenVehicleModal}
        className="flex flex-col items-center gap-0.5 -mt-5 cursor-pointer"
      >
        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white transition-transform active:scale-95 ${
          selectedVehicle ? 'bg-neutral-900 ring-2 ring-red-600' : 'bg-red-600 animate-bounce'
        }`}>
          <Car className="w-6 h-6" />
        </div>
        <span className="text-[10px] font-bold text-neutral-800">
          {selectedVehicle ? selectedVehicle.modelName.slice(0, 8) : 'خودروی من'}
        </span>
      </button>

      <button
        onClick={onOpenCartDrawer}
        className="flex flex-col items-center gap-1 text-[10px] font-medium text-neutral-500 relative cursor-pointer"
      >
        <div className="relative">
          <ShoppingBag className="w-5 h-5" />
          {cartCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-600 text-white text-[9px] font-black flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </div>
        <span>سبد خرید</span>
      </button>

      {/* Dynamic User Button based on auth state */}
      <button
        onClick={handleUserButtonClick}
        className={`flex flex-col items-center gap-1 text-[10px] font-medium cursor-pointer ${
          currentView === 'account' || currentView === 'admin' ? 'text-red-600 font-bold' : 'text-neutral-500'
        }`}
      >
        {currentCustomer ? (
          <>
            <div className="relative">
              <User className="w-5 h-5 text-emerald-600" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
            <span className="text-emerald-700 font-bold">{currentCustomer.firstName || 'حساب من'}</span>
          </>
        ) : adminAuth.isAuthenticated ? (
          <>
            <ShieldCheck className="w-5 h-5 text-amber-600" />
            <span className="text-amber-700 font-bold">پنل مدیر</span>
          </>
        ) : (
          <>
            <User className="w-5 h-5" />
            <span>ورود / ثبت‌نام</span>
          </>
        )}
      </button>
    </div>
  );
};
