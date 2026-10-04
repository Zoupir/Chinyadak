import React, { useState } from 'react';
import { Image as ImageIcon, FolderOpen, X } from 'lucide-react';
import { MediaPickerModal } from './MediaPickerModal';

interface ImageUploadInputProps {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  helperText?: string;
  aspectRatio?: 'square' | 'video' | 'banner' | 'auto';
  presetCategory?: 'parts' | 'logos' | 'favicons' | 'banners' | 'articles';
  className?: string;
}

export const ImageUploadInput: React.FC<ImageUploadInputProps> = ({
  label,
  value,
  onChange,
  placeholder = 'رسانه‌ای انتخاب نشده است.',
  helperText,
  aspectRatio = 'square',
  presetCategory = 'parts',
  className = ''
}) => {
  const [isMediaOpen, setIsMediaOpen] = useState(false);

  const aspectClass =
    aspectRatio === 'square' ? 'aspect-square' :
    aspectRatio === 'video' ? 'aspect-video' :
    aspectRatio === 'banner' ? 'aspect-[21/9]' :
    'min-h-28';

  return (
    <div className={`space-y-2 text-right ${className}`}>
      {label && <label className="block text-neutral-700 font-bold text-xs">{label}</label>}

      <div className="rounded-2xl border border-neutral-200 bg-neutral-50 overflow-hidden">
        {value ? (
          <div className="p-2 flex items-center gap-3">
            <button type="button" onClick={() => setIsMediaOpen(true)} title="ویرایش اطلاعات این تصویر در کتابخانه رسانه" aria-label="باز کردن اطلاعات تصویر در کتابخانه رسانه" className={`w-28 shrink-0 overflow-hidden rounded-xl bg-white border border-neutral-200 ${aspectClass} cursor-pointer hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500`}>
              <img src={value} alt="" className="w-full h-full object-contain" />
            </button>
            <div className="min-w-0 flex-1">
              <strong className="text-[10px] text-neutral-800 block">رسانه انتخاب‌شده</strong>
              <span className="mt-1 block text-[8px] text-neutral-400 font-mono truncate" dir="ltr">{value}</span>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setIsMediaOpen(true)}
                  className="px-3 py-2 rounded-xl bg-neutral-900 text-white text-[10px] font-black inline-flex items-center gap-1.5"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  تغییر / انتخاب از رسانه‌ها
                </button>
                <button
                  type="button"
                  onClick={() => onChange('')}
                  className="px-3 py-2 rounded-xl bg-red-50 text-red-700 text-[10px] font-bold inline-flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" /> حذف تصویر
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsMediaOpen(true)}
            className={`w-full ${aspectClass} p-5 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-neutral-300 hover:border-blue-500 hover:bg-blue-50/30 transition-colors`}
          >
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 grid place-items-center">
              <ImageIcon className="w-5 h-5" />
            </div>
            <strong className="text-xs text-neutral-800">انتخاب یا آپلود رسانه</strong>
            <span className="text-[9px] text-neutral-400">{placeholder}</span>
          </button>
        )}
      </div>

      {helperText && <p className="text-[9px] text-neutral-400 leading-5">{helperText}</p>}

      <MediaPickerModal
        isOpen={isMediaOpen}
        onClose={() => setIsMediaOpen(false)}
        onSelect={(url) => onChange(url)}
        category={presetCategory}
        initialUrl={value}
        title={label || 'انتخاب رسانه'}
      />
    </div>
  );
};
