import React from 'react';
import { Product } from '../../types';
import { useStore } from '../../context/StoreContext';
import { checkProductFitment, formatToman, getGradeInfo } from '../../utils/formatters';
import { ShoppingBag, Heart, ArrowRightLeft, Star, CheckCircle2, AlertTriangle, ShieldCheck, Phone } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onViewDetails: (productId: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onViewDetails }) => {
  const { 
    selectedVehicle, 
    addToCart, 
    toggleWishlist, 
    isInWishlist, 
    addToCompare, 
    isInCompare,
    settings
  } = useStore();

  const fitment = checkProductFitment(product, selectedVehicle);
  const gradeInfo = getGradeInfo(product.grade);
  const hasDiscount = product.discountPrice && product.discountPrice < product.price;
  const discountPercent = hasDiscount 
    ? Math.round(((product.price - product.discountPrice!) / product.price) * 100) 
    : 0;

  return (
    <div className="product-card group bg-white rounded-2xl border border-neutral-200 hover:border-neutral-300 hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden relative">
      {/* Top Media & Actions */}
      <div className="product-card-media relative p-4 pb-0 bg-neutral-50/40">
        {/* Floating Badges */}
        <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5 items-start">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shadow-2xs ${gradeInfo.bgClass}`}>
            {gradeInfo.shortLabel}
          </span>
          {hasDiscount && (
            <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-red-600 text-white shadow-2xs">
              {discountPercent}٪ تخفیف
            </span>
          )}
        </div>

        {/* Quick wishlist & compare icons */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleWishlist(product.id);
            }}
            className={`p-2 rounded-xl border backdrop-blur-xs transition-colors shadow-2xs ${
              isInWishlist(product.id)
                ? 'bg-red-50 text-red-600 border-red-200'
                : 'bg-white/80 hover:bg-white text-neutral-600 border-neutral-200'
            }`}
            title="افزودن به علاقه‌مندی‌ها"
          >
            <Heart className={`w-4 h-4 ${isInWishlist(product.id) ? 'fill-red-600' : ''}`} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              addToCompare(product);
            }}
            className={`p-2 rounded-xl border backdrop-blur-xs transition-colors shadow-2xs ${
              isInCompare(product.id)
                ? 'bg-blue-50 text-blue-600 border-blue-200'
                : 'bg-white/80 hover:bg-white text-neutral-600 border-neutral-200'
            }`}
            title="افزودن به مقایسه"
          >
            <ArrowRightLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Product Image */}
        <div 
          onClick={() => onViewDetails(product.id)}
          className="w-full aspect-4/3 rounded-xl overflow-hidden cursor-pointer relative bg-white border border-neutral-100 group-hover:scale-[1.02] transition-transform duration-300"
        >
          <img 
            src={product.images[0]} 
            alt={product.seo?.images?.[product.images[0]]?.alt || product.nameFa}
          title={product.seo?.images?.[product.images[0]]?.title || product.nameFa}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      </div>

      {/* Card Body */}
      <div className="product-card-body p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Brand & OEM Header */}
          <div className="flex items-center justify-between text-[11px] text-neutral-500 mb-1.5">
            <span className="font-semibold text-neutral-700 truncate max-w-[140px]">
              {product.brandManufacturer}
            </span>
            <span className="font-mono text-[10px] bg-neutral-100 px-1.5 py-0.5 rounded text-neutral-600">
              OEM: {product.oemNumber}
            </span>
          </div>

          {/* Product Title */}
          <h3 
            onClick={() => onViewDetails(product.id)}
            className="font-bold text-sm text-neutral-900 group-hover:text-red-600 transition-colors line-clamp-2 cursor-pointer leading-snug mb-2"
            title={product.nameFa}
          >
            {product.nameFa}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-1 mb-3">
            <div className="flex text-amber-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star 
                  key={i} 
                  className={`w-3 h-3 ${i < Math.floor(product.rating) ? 'fill-amber-400' : 'text-neutral-200'}`} 
                />
              ))}
            </div>
            <span className="text-[10px] text-neutral-400">({product.reviewsCount})</span>
          </div>
        </div>

        <div>
          {/* Fitment Indicator Box (Mandatory Key Feature!) */}
          <div className="mb-3">
            {selectedVehicle ? (
              fitment.isCompatible ? (
                <div className="px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">سازگار با {selectedVehicle.modelName}</span>
                </div>
              ) : (
                <div className="px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-medium flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span className="truncate">عدم تطبیق با {selectedVehicle.modelName}</span>
                </div>
              )
            ) : (
              <div className="text-[11px] text-neutral-500 truncate flex items-center gap-1">
                <span className="text-neutral-400">مناسب:</span>
                <span className="font-medium text-neutral-700">
                  {product.fitments.slice(0, 2).map(f => f.modelName).join('، ')}
                </span>
              </div>
            )}
          </div>

          {/* Price & Add to Cart Footer */}
          <div className="pt-3 border-t border-neutral-100 flex items-center justify-between gap-2">
            <div>
              {hasDiscount && (
                <span className="text-[11px] text-neutral-400 line-through block -mb-0.5">
                  {formatToman(product.price)}
                </span>
              )}
              <div className="text-sm font-black text-neutral-900">
                {Number(product.discountPrice || product.price) > 0 ? formatToman(product.discountPrice || product.price) : 'استعلام قیمت'}
              </div>
            </div>

            {!(Number(product.discountPrice || product.price) > 0) ? (
              settings.contactWhenNoPrice !== false && settings.contactPhone ? (
                <a href={`tel:${settings.contactPhone.replace(/[^0-9+]/g, '')}`}
                  className="h-9 px-3.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
                  title="تماس برای استعلام قیمت"><Phone className="w-3.5 h-3.5" /><span>تماس با ما</span></a>
              ) : <span className="h-9 px-3.5 bg-neutral-100 text-neutral-600 rounded-xl text-xs font-bold flex items-center gap-1.5" title="قیمت ثبت نشده"><Phone className="w-3.5 h-3.5" /><span>استعلام قیمت: {settings.contactPhone || 'شماره تماس ثبت نشده'}</span></span>
            ) : (
              <button onClick={() => addToCart(product, 1, selectedVehicle)}
                className="h-9 px-3.5 bg-neutral-900 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs" title="افزودن به سبد خرید">
                <ShoppingBag className="w-3.5 h-3.5" /><span>خرید</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
