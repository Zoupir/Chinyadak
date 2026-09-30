import React, { useEffect, useState, useRef } from 'react';
import { uploadImage, MediaUploadError, listMediaLibrary, MediaLibraryItem } from '../../api/media';
import { 
  Upload, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  X, 
  Check, 
  Sparkles, 
  RefreshCw,
  FolderOpen
} from 'lucide-react';

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

// Curated high quality automotive presets
const AUTOMOTIVE_PRESETS = {
  logos: [
    { label: 'لوگو KMC موتور', url: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=200&auto=format&fit=crop&q=80' },
    { label: 'لوگو چری (Chery)', url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=200&auto=format&fit=crop&q=80' },
    { label: 'لوگو چانگان (Changan)', url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=200&auto=format&fit=crop&q=80' },
    { label: 'لوگو فونیکس (Fownix)', url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=200&auto=format&fit=crop&q=80' },
  ],
  favicons: [
    { label: 'آیکون آچار و چرخ‌دنده', url: 'https://cdn-icons-png.flaticon.com/512/3202/3202926.png' },
    { label: 'آیکون خودرو اسپرت', url: 'https://cdn-icons-png.flaticon.com/512/743/743131.png' },
    { label: 'آیکون سپر قرمز', url: 'https://cdn-icons-png.flaticon.com/512/1067/1067357.png' },
  ],
  parts: [
    { label: 'لنت ترمز سرامیکی', url: 'https://images.unsplash.com/photo-1600705722908-bab1e61c0b4d?auto=format&fit=crop&q=80&w=800' },
    { label: 'دیسک ترمز خنک‌شونده', url: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=800' },
    { label: 'توربوشارژر و منیفولد', url: 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&q=80&w=800' },
    { label: 'موتور و گیربکس', url: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&q=80&w=800' },
    { label: 'فیلتر روغن و هوا', url: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&q=80&w=800' },
    { label: 'شمع جرقه‌زن ایریدیوم', url: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&q=80&w=800' },
  ],
  banners: [
    { label: 'بنر پیست و خودرو اسپرت', url: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&q=80&w=1600' },
    { label: 'بنر تعمیرگاه تخصصی', url: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=1600' },
    { label: 'بنر قطعات اورجینال شاسی', url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=1600' },
  ],
  articles: [
    { label: 'تعمیرات تخصصی گیربکس', url: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&q=80&w=1000' },
    { label: 'سرویس روغن موتور توربو', url: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&q=80&w=1000' },
    { label: 'بررسی ترمزهای سرامیکی', url: 'https://images.unsplash.com/photo-1600705722908-bab1e61c0b4d?auto=format&fit=crop&q=80&w=1000' },
  ]
};

export const ImageUploadInput: React.FC<ImageUploadInputProps> = ({
  label,
  value,
  onChange,
  placeholder = 'آدرس تصویر یا آپلود فایل...',
  helperText,
  aspectRatio = 'square',
  presetCategory = 'parts',
  className = ''
}) => {
  const [mode, setMode] = useState<'upload' | 'library' | 'url' | 'presets'>('upload');
  const [libraryItems, setLibraryItems] = useState<MediaLibraryItem[]>([]);
  const [libraryQuery, setLibraryQuery] = useState('');
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const presets = AUTOMOTIVE_PRESETS[presetCategory] || AUTOMOTIVE_PRESETS.parts;

  useEffect(() => {
    if (mode !== 'library') return;
    let cancelled = false;
    setLibraryLoading(true);
    listMediaLibrary({ category: 'all', limit: 300 })
      .then(result => {
        if (!cancelled) setLibraryItems(result.items || []);
      })
      .catch(() => {
        if (!cancelled) setLibraryItems([]);
      })
      .finally(() => {
        if (!cancelled) setLibraryLoading(false);
      });
    return () => { cancelled = true; };
  }, [mode]);

  const visibleLibraryItems = libraryItems.filter(item => {
    const q = libraryQuery.trim().toLowerCase();
    if (!q) return true;
    return item.filename.toLowerCase().includes(q) || item.category.toLowerCase().includes(q) || item.relativePath.toLowerCase().includes(q);
  });

  // Upload the original image to the application server; never persist Base64 in product data.
  const handleFileProcess = async (file: File) => {
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      setUploadError('فرمت تصویر مجاز نیست. از JPG، PNG، WEBP یا GIF استفاده کنید.');
      return;
    }

    setFileName(file.name);
    setUploadError('');
    setIsUploading(true);
    try {
      const result = await uploadImage(file, presetCategory);
      onChange(result.url);
    } catch (error) {
      console.error('Image upload failed:', error);
      const message =
        error instanceof MediaUploadError && error.code === 'IMAGE_FORMAT_NOT_ALLOWED'
          ? 'فرمت واقعی فایل تصویر مجاز نیست.'
          : error instanceof MediaUploadError && error.status === 413
            ? 'حجم تصویر بیشتر از حد مجاز سرور است.'
            : 'آپلود تصویر روی سرور انجام نشد.';
      setUploadError(message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleFileProcess(file);
    e.target.value = '';
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
    const file = e.dataTransfer.files?.[0];
    if (file) {
      void handleFileProcess(file);
    }
  };

  const getAspectClass = () => {
    switch (aspectRatio) {
      case 'square': return 'aspect-square max-h-36';
      case 'video': return 'aspect-video max-h-40';
      case 'banner': return 'aspect-[21/9] max-h-48';
      default: return 'max-h-40';
    }
  };

  return (
    <div className={`space-y-2 text-right ${className}`}>
      {label && (
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
              آپلود فایل
            </button>
            <button
              type="button"
              onClick={() => setMode('library')}
              className={`px-2 py-0.5 rounded-md font-bold transition-colors ${
                mode === 'library' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              رسانه‌ها
            </button>
            <button
              type="button"
              onClick={() => setMode('url')}
              className={`px-2 py-0.5 rounded-md font-bold transition-colors ${
                mode === 'url' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              لینک تصویر
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
      )}

      {/* Mode 1: Local File Upload & Drag-and-Drop */}
      {mode === 'upload' && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
            isDragging 
              ? 'border-red-600 bg-red-50/50' 
              : 'border-neutral-300 hover:border-red-500 bg-neutral-50/50 hover:bg-neutral-50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.gif,image/jpeg,image/png,image/webp,image/gif"
            disabled={isUploading}
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-neutral-800 block">
              {isUploading ? 'در حال آپلود روی سرور...' : 'برای آپلود عکس کلیک کنید یا عکس را بکشید و رها کنید'}
            </span>
            <span className="text-[10px] text-neutral-400 mt-0.5 block">
              فرمت‌های مجاز: JPG, PNG, WEBP, GIF — فایل روی هاست ذخیره می‌شود
            </span>
          </div>
          {fileName && !isUploading && (
            <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
              ✓ فایل آپلود شده: {fileName}
            </span>
          )}
          {uploadError && (
            <span className="text-[10px] text-red-600 font-bold bg-red-50 px-2 py-1 rounded-md">
              {uploadError}
            </span>
          )}
        </div>
      )}

      {/* Media Library */}
      {mode === 'library' && (
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 overflow-hidden">
          <div className="p-2.5 border-b border-neutral-200 bg-white">
            <div className="relative">
              <FolderOpen className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                value={libraryQuery}
                onChange={e => setLibraryQuery(e.target.value)}
                placeholder="جستجو در رسانه‌های آپلودشده..."
                className="w-full pr-9 pl-3 py-2 border border-neutral-300 rounded-lg text-[10px]"
              />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto p-2 grid grid-cols-3 sm:grid-cols-4 gap-2">
            {libraryLoading ? (
              <div className="col-span-full py-8 text-center text-[10px] text-neutral-400">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                در حال دریافت رسانه‌ها...
              </div>
            ) : visibleLibraryItems.length ? (
              visibleLibraryItems.map(item => (
                <button
                  key={item.relativePath}
                  type="button"
                  onClick={() => onChange(item.url)}
                  className={`rounded-xl border overflow-hidden bg-white text-right ${
                    value === item.url ? 'border-red-600 ring-1 ring-red-600' : 'border-neutral-200 hover:border-neutral-400'
                  }`}
                  title={item.filename}
                >
                  <div className="aspect-square bg-white">
                    <img src={item.url} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="p-1.5">
                    <span className="block text-[8px] font-bold truncate">{item.filename}</span>
                    <span className="block text-[7px] text-neutral-400 truncate">{item.category}</span>
                  </div>
                </button>
              ))
            ) : (
              <div className="col-span-full py-8 text-center text-[10px] text-neutral-400">
                رسانه‌ای پیدا نشد.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mode 2: Direct URL Input */}
      {mode === 'url' && (
        <div className="relative">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full p-2.5 pl-9 pr-9 border border-neutral-300 rounded-xl text-xs font-mono text-left focus:border-red-600 focus:outline-hidden"
          />
          <LinkIcon className="w-4 h-4 text-neutral-400 absolute right-3 top-3 pointer-events-none" />
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="absolute left-3 top-3 text-neutral-400 hover:text-neutral-700"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Mode 3: Presets Selector */}
      {mode === 'presets' && (
        <div className="space-y-2 p-3 bg-neutral-50 rounded-2xl border border-neutral-200">
          <span className="text-[10px] font-bold text-neutral-600 block">
            انتخاب از کتابخانه تصاویر پیش‌فرض و استاندارد:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {presets.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onChange(preset.url)}
                className={`p-1.5 rounded-xl border text-right transition-all flex items-center gap-2 group ${
                  value === preset.url 
                    ? 'border-red-600 bg-red-50 text-red-700 font-bold' 
                    : 'border-neutral-200 bg-white hover:border-neutral-400 text-neutral-700'
                }`}
              >
                <img src={preset.url} alt={preset.label} className="w-8 h-8 rounded-lg object-cover shrink-0 border" />
                <span className="text-[10px] truncate">{preset.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Preview Section */}
      {value ? (
        <div className="relative p-2 bg-neutral-100 rounded-2xl border border-neutral-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`overflow-hidden rounded-xl border border-neutral-300 bg-white flex items-center justify-center ${getAspectClass()}`}>
              <img 
                src={value} 
                alt="Preview" 
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div>
              <span className="text-xs font-bold text-neutral-800 block">پیش‌نمایش تصویر فعال</span>
              <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
                <Check className="w-3 h-3" />
                آماده انتشار در سایت
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onChange('')}
              className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors text-[11px] flex items-center gap-1"
              title="حذف این تصویر"
            >
              <X className="w-4 h-4" />
              <span>حذف</span>
            </button>
          </div>
        </div>
      ) : (
        helperText && <p className="text-[10px] text-neutral-400">{helperText}</p>
      )}
    </div>
  );
};
