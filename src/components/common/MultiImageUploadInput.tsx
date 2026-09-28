import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  X, 
  Check, 
  Sparkles, 
  Trash2, 
  Star, 
  Plus,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';

interface MultiImageUploadInputProps {
  label?: string;
  images: string[];
  onChange: (images: string[]) => void;
  helperText?: string;
  maxImages?: number;
}

const AUTOMOTIVE_PART_PRESETS = [
  { label: 'واتر پمپ فابریک', url: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=800' },
  { label: 'لنت ترمز سرامیکی', url: 'https://images.unsplash.com/photo-1600705722908-bab1e61c0b4d?auto=format&fit=crop&q=80&w=800' },
  { label: 'توربوشارژر و منیفولد', url: 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&q=80&w=800' },
  { label: 'موتور و گیربکس', url: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&q=80&w=800' },
  { label: 'فیلتر روغن و هوا', url: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&q=80&w=800' },
  { label: 'شمع جرقه‌زن ایریدیوم', url: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&q=80&w=800' },
  { label: 'دیسک ترمز سوراخ‌دار', url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800' },
  { label: 'کمک فنر و جلوبندی', url: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&q=80&w=800' }
];

export const MultiImageUploadInput: React.FC<MultiImageUploadInputProps> = ({
  label = 'تصاویر کالا (گالری عکس‌ها):',
  images = [],
  onChange,
  helperText = 'تصویر اول به عنوان عکس شاخص محصول در سایت نمایش داده می‌شود.',
  maxImages = 8
}) => {
  const [mode, setMode] = useState<'upload' | 'url' | 'presets'>('upload');
  const [urlInput, setUrlInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddImage = (newUrl: string) => {
    if (!newUrl || !newUrl.trim()) return;
    if (images.length >= maxImages) {
      alert(`حداکثر می‌توانید ${maxImages} تصویر برای هر محصول اضافه نمایید.`);
      return;
    }
    onChange([...images, newUrl.trim()]);
    setUrlInput('');
  };

  const handleRemoveImage = (indexToRemove: number) => {
    const updated = images.filter((_, idx) => idx !== indexToRemove);
    onChange(updated);
  };

  const handleSetPrimary = (indexToPrimary: number) => {
    if (indexToPrimary === 0) return;
    const target = images[indexToPrimary];
    const rest = images.filter((_, idx) => idx !== indexToPrimary);
    onChange([target, ...rest]);
  };

  const handleFileProcess = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('لطفاً یک فایل تصویری معتبر انتخاب کنید.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        handleAddImage(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach(file => handleFileProcess(file));
    }
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      Array.from(files).forEach(file => handleFileProcess(file));
    }
  };

  return (
    <div className="space-y-3 text-right">
      <div className="flex items-center justify-between">
        <label className="block text-neutral-700 font-bold text-xs">{label}</label>
        <div className="flex items-center gap-1 bg-neutral-100 p-0.5 rounded-lg text-[10px]">
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`px-2 py-0.5 rounded-md font-bold transition-colors ${
              mode === 'upload' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            آپلود از کامپیوتر
          </button>
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`px-2 py-0.5 rounded-md font-bold transition-colors ${
              mode === 'url' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            افزودن با لینک URL
          </button>
          <button
            type="button"
            onClick={() => setMode('presets')}
            className={`px-2 py-0.5 rounded-md font-bold transition-colors ${
              mode === 'presets' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            تصاویر آماده
          </button>
        </div>
      </div>

      {/* Input Mode 1: File Upload */}
      {mode === 'upload' && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
            isDragging 
              ? 'border-red-600 bg-red-50/50' 
              : 'border-neutral-300 hover:border-red-500 bg-neutral-50/60 hover:bg-neutral-50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-neutral-800 block">
              برای آپلود عکس‌های محصول کلیک کنید یا عکس‌ها را بکشید و رها کنید
            </span>
            <span className="text-[10px] text-neutral-400 mt-0.5 block">
              امکان انتخاب همزمان چند عکس (PNG, JPG, WEBP)
            </span>
          </div>
        </div>
      )}

      {/* Input Mode 2: Direct URL */}
      {mode === 'url' && (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://example.com/part-photo.jpg"
              className="w-full p-2.5 pr-8 border border-neutral-300 rounded-xl text-xs font-mono text-left"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddImage(urlInput);
                }
              }}
            />
            <LinkIcon className="w-4 h-4 text-neutral-400 absolute right-2.5 top-3 pointer-events-none" />
          </div>
          <button
            type="button"
            onClick={() => handleAddImage(urlInput)}
            className="px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold shrink-0 flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>افزودن به گالری</span>
          </button>
        </div>
      )}

      {/* Input Mode 3: Presets */}
      {mode === 'presets' && (
        <div className="space-y-2 p-3 bg-neutral-50 rounded-2xl border border-neutral-200">
          <span className="text-[10px] font-bold text-neutral-600 block">
            انتخاب تصویر آماده از کتابخانه قطعات خودرو:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {AUTOMOTIVE_PART_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleAddImage(preset.url)}
                className="p-1.5 rounded-xl border border-neutral-200 bg-white hover:border-red-500 text-right transition-all flex items-center gap-2 group"
              >
                <img src={preset.url} alt={preset.label} className="w-7 h-7 rounded-lg object-cover shrink-0 border" />
                <span className="text-[10px] truncate">{preset.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Gallery List of Uploaded Images */}
      {images.length > 0 ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] text-neutral-500 font-semibold">
            <span>تصاویر ثبت شده ({images.length} از {maxImages}):</span>
            <button
              type="button"
              onClick={() => onChange([])}
              className="text-red-600 hover:text-red-700 text-[10px]"
            >
              حذف همه تصاویر
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {images.map((imgUrl, index) => {
              const isPrimary = index === 0;

              return (
                <div 
                  key={index} 
                  className={`relative group rounded-2xl border overflow-hidden bg-neutral-100 p-1 flex flex-col items-center justify-between transition-all ${
                    isPrimary ? 'border-red-600 ring-2 ring-red-500/20 shadow-xs' : 'border-neutral-200 hover:border-neutral-400'
                  }`}
                >
                  <div className="w-full aspect-square rounded-xl overflow-hidden bg-white flex items-center justify-center relative">
                    <img 
                      src={imgUrl} 
                      alt={`Product image ${index + 1}`} 
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />

                    {/* Primary Badge */}
                    {isPrimary ? (
                      <span className="absolute top-1.5 right-1.5 bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-xs flex items-center gap-0.5">
                        <Star className="w-2.5 h-2.5 fill-current" />
                        <span>عکس اصلی</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(index)}
                        className="absolute top-1.5 right-1.5 bg-neutral-900/80 hover:bg-neutral-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                        title="انتخاب به عنوان عکس شاخص"
                      >
                        شاخص کردن
                      </button>
                    )}

                    {/* Delete Single Image Button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-1.5 left-1.5 w-6 h-6 rounded-lg bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-md transition-transform transform active:scale-90"
                      title="حذف این عکس"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="w-full flex items-center justify-between px-1.5 pt-1 text-[10px] text-neutral-500">
                    <span>تصویر {index + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="text-red-500 hover:text-red-700 text-[10px] font-bold"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-2xl text-center">
          <ImageIcon className="w-6 h-6 text-neutral-400 mx-auto mb-1" />
          <p className="text-xs text-neutral-500 font-semibold">هنوز تصویری برای این کالا افزوده نشده است.</p>
          <p className="text-[10px] text-neutral-400 mt-0.5">از دکمه‌های بالا برای افزودن اولین تصویر استفاده کنید.</p>
        </div>
      )}

      {helperText && <p className="text-[10px] text-neutral-400">{helperText}</p>}
    </div>
  );
};
