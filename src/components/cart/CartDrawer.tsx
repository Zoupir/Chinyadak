import React from 'react';
import { useStore } from '../../context/StoreContext';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowLeft, ShieldCheck, Truck } from 'lucide-react';
import { formatToman, getGradeInfo } from '../../utils/formatters';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedToCheckout: () => void;
  onViewProduct: (productId: string) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  onProceedToCheckout,
  onViewProduct
}) => {
  const { cart, removeFromCart, updateQuantity, cartTotal, cartCount } = useStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div 
        onClick={onClose} 
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity" 
      />

      <div className="absolute inset-y-0 left-0 max-w-full flex pl-0 md:pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Drawer Header */}
          <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-900 text-white">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-red-500" />
              <h2 className="font-bold text-base">سبد خرید شما ({cartCount} قلم کالا)</h2>
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Delivery Note */}
          <div className="bg-emerald-50 px-6 py-2.5 border-b border-emerald-100 flex items-center gap-2 text-xs text-emerald-800 font-medium">
            <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>ارسال اکسپرس و بیمه‌شده قطعات حساس در تهران ۲ ساعته و شهرستان‌ها ۲۴ ساعته</span>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cart.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4 text-neutral-400">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-neutral-800 text-base mb-1">سبد خرید شما در حال حاضر خالی است</h3>
                <p className="text-xs text-neutral-500 mb-6">
                  می‌توانید با انتخاب خودرو یا دسته‌بندی قطعات، لوازم موردنیاز خود را اضافه فرمایید.
                </p>
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 bg-neutral-900 hover:bg-red-600 text-white text-xs font-bold rounded-xl transition-colors"
                >
                  بازگشت به فروشگاه
                </button>
              </div>
            ) : (
              cart.map((item) => {
                const gradeInfo = getGradeInfo(item.product.grade);
                const itemPrice = item.product.discountPrice || item.product.price;
                return (
                  <div 
                    key={item.product.id}
                    className="p-3.5 border border-neutral-200 rounded-xl bg-white shadow-xs relative flex flex-col justify-between"
                  >
                    <div className="flex gap-3">
                      <button 
                        onClick={() => { onViewProduct(item.product.id); onClose(); }}
                        className="w-16 h-16 rounded-lg overflow-hidden border border-neutral-200 bg-neutral-50 shrink-0 hover:opacity-90"
                      >
                        <img 
                          src={item.product.images[0]} 
                          alt={item.product.nameFa} 
                          className="w-full h-full object-cover" 
                        />
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${gradeInfo.bgClass}`}>
                            {gradeInfo.shortLabel}
                          </span>
                          <span className="text-[10px] font-mono text-neutral-400">
                            OEM: {item.product.oemNumber}
                          </span>
                        </div>
                        <h4 
                          onClick={() => { onViewProduct(item.product.id); onClose(); }}
                          className="font-bold text-xs text-neutral-900 hover:text-red-600 cursor-pointer line-clamp-2"
                        >
                          {item.product.nameFa}
                        </h4>

                        {item.selectedVehicle && (
                          <p className="text-[11px] text-emerald-700 font-semibold mt-1">
                            ✓ تطبیق داده شده با {item.selectedVehicle.modelName}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-neutral-100 flex items-center justify-between">
                      {/* Quantity Selector */}
                      <div className="flex items-center border border-neutral-200 rounded-lg overflow-hidden">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center text-xs font-bold text-neutral-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Price & Delete */}
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-xs font-bold text-neutral-900">
                            {formatToman(itemPrice * item.quantity)}
                          </div>
                          {item.quantity > 1 && (
                            <div className="text-[10px] text-neutral-400">
                              هر عدد: {formatToman(itemPrice)}
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="حذف کالا"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Drawer Footer */}
          {cart.length > 0 && (
            <div className="p-6 border-t border-neutral-200 bg-neutral-50 space-y-4">
              <div className="space-y-1.5 text-xs text-neutral-600">
                <div className="flex justify-between">
                  <span>مجموع ارزش اقلام:</span>
                  <span className="font-bold text-neutral-900">{formatToman(cartTotal)}</span>
                </div>
                <div className="flex justify-between text-neutral-500">
                  <span>هزینه بسته‌بندی و ارسال:</span>
                  <span>محاسبه در مرحله نهایی</span>
                </div>
                <div className="pt-2 border-t border-neutral-200 flex justify-between text-sm font-bold text-neutral-900">
                  <span>مبلغ قابل پرداخت:</span>
                  <span className="text-red-600 text-base">{formatToman(cartTotal)}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  onClose();
                  onProceedToCheckout();
                }}
                className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-red-600/20 flex items-center justify-center gap-2 transition-colors"
              >
                <span>ادامه فرایند خرید و ثبت سفارش</span>
                <ArrowLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-neutral-500">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>ضمانت ۷ روزه اصالت و سلامت فیزیکی قطعات</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
