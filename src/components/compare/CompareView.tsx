import React from 'react';
import { useStore } from '../../context/StoreContext';
import { formatToman, getGradeInfo } from '../../utils/formatters';
import { ArrowRightLeft, X, ShoppingBag, CheckCircle2, AlertTriangle } from 'lucide-react';

interface CompareViewProps {
  onNavigate: (view: string, param?: string) => void;
}

export const CompareView: React.FC<CompareViewProps> = ({ onNavigate }) => {
  const { compareList, removeFromCompare, clearCompare, addToCart, selectedVehicle } = useStore();

  if (compareList.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-neutral-400">
          <ArrowRightLeft className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-neutral-900">لیست مقایسه فنی در حال حاضر خالی است</h2>
        <p className="text-xs text-neutral-500 max-w-sm mx-auto">
          برای مقایسه تخصصی قطعات با یکدیگر، در کارت هر محصول روی آیکون مقایسه کلیک نمایید.
        </p>
        <button
          onClick={() => onNavigate('shop')}
          className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold"
        >
          ورود به فهرست قطعات
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-neutral-900">جدول مقایسه فنی قطعات</h1>
          <p className="text-xs text-neutral-500 mt-1">
            مقایسه شاخص‌های کیفی، استانداردهای OEM، گارانتی و قیمت ({compareList.length} محصول)
          </p>
        </div>

        <button
          onClick={clearCompare}
          className="text-xs text-neutral-400 hover:text-red-600 transition-colors"
        >
          پاک کردن کل مقایسه
        </button>
      </div>

      <div className="overflow-x-auto bg-white rounded-3xl border border-neutral-200 shadow-xs">
        <table className="w-full text-xs text-right divide-y divide-neutral-200">
          <thead>
            <tr>
              <th className="p-4 bg-neutral-50 font-bold text-neutral-600 w-44">پارامتر / قطعه</th>
              {compareList.map(p => (
                <th key={p.id} className="p-4 bg-white min-w-[240px] max-w-[280px] align-top relative">
                  <button
                    onClick={() => removeFromCompare(p.id)}
                    className="absolute top-2 left-2 p-1 text-neutral-400 hover:text-red-600 rounded-md hover:bg-neutral-100"
                    title="حذف از مقایسه"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="space-y-3">
                    <img 
                      src={p.images[0]} 
                      alt={p.nameFa} 
                      className="w-full h-32 object-cover rounded-xl border border-neutral-100" 
                    />
                    <h3 
                      onClick={() => onNavigate('product', p.id)}
                      className="font-bold text-xs text-neutral-900 hover:text-red-600 cursor-pointer line-clamp-2"
                    >
                      {p.nameFa}
                    </h3>
                    <div className="text-sm font-black text-red-600">
                      {formatToman(p.discountPrice || p.price)}
                    </div>
                    <button
                      onClick={() => addToCart(p, 1, selectedVehicle)}
                      className="w-full py-2 bg-neutral-900 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>افزودن به سبد</span>
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-neutral-100">
            {/* Grade */}
            <tr className="hover:bg-neutral-50/50">
              <td className="p-4 font-bold text-neutral-500 bg-neutral-50/80">گرید کیفیتی</td>
              {compareList.map(p => {
                const info = getGradeInfo(p.grade);
                return (
                  <td key={p.id} className="p-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${info.bgClass}`}>
                      {info.label}
                    </span>
                  </td>
                );
              })}
            </tr>

            {/* Manufacturer Brand */}
            <tr className="hover:bg-neutral-50/50">
              <td className="p-4 font-bold text-neutral-500 bg-neutral-50/80">برند سازنده قطعه</td>
              {compareList.map(p => (
                <td key={p.id} className="p-4 font-bold text-neutral-900">
                  {p.brandManufacturer}
                </td>
              ))}
            </tr>

            {/* OEM Code */}
            <tr className="hover:bg-neutral-50/50">
              <td className="p-4 font-bold text-neutral-500 bg-neutral-50/80">شماره فنی OEM</td>
              {compareList.map(p => (
                <td key={p.id} className="p-4 font-mono font-bold text-red-600">
                  {p.oemNumber}
                </td>
              ))}
            </tr>

            {/* Warranty */}
            <tr className="hover:bg-neutral-50/50">
              <td className="p-4 font-bold text-neutral-500 bg-neutral-50/80">گارانتی شرکتی</td>
              {compareList.map(p => (
                <td key={p.id} className="p-4 text-neutral-700">
                  {p.warrantyMonths} ماه ضمانت رسمی
                </td>
              ))}
            </tr>

            {/* Country */}
            <tr className="hover:bg-neutral-50/50">
              <td className="p-4 font-bold text-neutral-500 bg-neutral-50/80">کشور سازنده</td>
              {compareList.map(p => (
                <td key={p.id} className="p-4 text-neutral-700">
                  {p.countryOfOrigin}
                </td>
              ))}
            </tr>

            {/* Placement */}
            <tr className="hover:bg-neutral-50/50">
              <td className="p-4 font-bold text-neutral-500 bg-neutral-50/80">محل نصب</td>
              {compareList.map(p => (
                <td key={p.id} className="p-4 text-neutral-700">
                  {p.placement}
                </td>
              ))}
            </tr>

            {/* Compatible Cars */}
            <tr className="hover:bg-neutral-50/50">
              <td className="p-4 font-bold text-neutral-500 bg-neutral-50/80">خودروهای سازگار</td>
              {compareList.map(p => (
                <td key={p.id} className="p-4">
                  <div className="space-y-1">
                    {p.fitments.map((f, i) => (
                      <span key={i} className="block text-[11px] text-neutral-700">
                        • {f.modelName} ({f.engine})
                      </span>
                    ))}
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
