import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Share2, 
  QrCode, 
  Send, 
  MessageSquare, 
  ExternalLink,
  Smartphone,
  Sparkles,
  Link as LinkIcon
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { copyToClipboard, getFullShareUrl, getPageShareMeta } from '../../utils/navigation';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  view: string;
  param?: string;
  customTitle?: string;
  customSubtitle?: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  view,
  param,
  customTitle,
  customSubtitle
}) => {
  const { products, categories, models, brands, articles, showToast } = useStore();
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  if (!isOpen) return null;

  const meta = getPageShareMeta(view, param, { products, categories, models, brands, articles });
  const title = customTitle || meta.title;
  const subtitle = customSubtitle || meta.subtitle;
  const fullUrl = getFullShareUrl(view, param);

  const handleCopy = async () => {
    const success = await copyToClipboard(fullUrl);
    if (success) {
      setCopied(true);
      showToast('لینک مستقیم این بخش با موفقیت در کلیپ‌بورد کپی شد!', 'success');
      setTimeout(() => setCopied(false), 2500);
    } else {
      showToast('خطا در کپی لینک. لطفاً به صورت دستی انتخاب و کپی کنید.', 'error');
    }
  };

  const handleNativeShare = async () => {
    if (navigator?.share) {
      try {
        await navigator.share({
          title,
          text: meta.shareText,
          url: fullUrl
        });
        showToast('اشتراک‌گذاری با موفقیت انجام شد', 'success');
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          handleCopy();
        }
      }
    } else {
      handleCopy();
    }
  };

  // Social sharing direct URLs
  const encodedUrl = encodeURIComponent(fullUrl);
  const encodedText = encodeURIComponent(`${title}\n${meta.shareText}`);

  const shareTargets = [
    {
      name: 'تلگرام',
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.52 2.77-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .37z" />
        </svg>
      ),
      url: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
      bg: 'bg-sky-500 hover:bg-sky-600 text-white'
    },
    {
      name: 'واتساپ',
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 012.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 01-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.64c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.03-1.25-.75-.67-1.26-1.5-1.41-1.75-.14-.25-.02-.39.11-.51.11-.11.25-.29.37-.44.13-.14.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.77 2.7 4.29 3.78.6.26 1.07.41 1.43.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.12-.22-.19-.47-.32z" />
        </svg>
      ),
      url: `https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`,
      bg: 'bg-emerald-500 hover:bg-emerald-600 text-white'
    },
    {
      name: 'ایتا (Eitaa)',
      icon: (
        <span className="font-black text-xs">ایتا</span>
      ),
      url: `https://eitaa.com/share/url?url=${encodedUrl}&text=${encodedText}`,
      bg: 'bg-orange-500 hover:bg-orange-600 text-white'
    },
    {
      name: 'بله (Bale)',
      icon: (
        <span className="font-black text-xs">بله</span>
      ),
      url: `https://ble.ir/share/url?url=${encodedUrl}&text=${encodedText}`,
      bg: 'bg-teal-600 hover:bg-teal-700 text-white'
    },
    {
      name: 'X (توییتر)',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      url: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      bg: 'bg-neutral-900 hover:bg-neutral-800 text-white'
    }
  ];

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=10&data=${encodeURIComponent(fullUrl)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-neutral-100 flex flex-col animate-in zoom-in-95 duration-200"
        dir="rtl"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-neutral-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-600/90 flex items-center justify-center text-white shadow-xs">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm text-white">اشتراک‌گذاری لینک مستقیم</h3>
              <p className="text-[11px] text-neutral-400">ارسال صفحه دقیق برای دوستان، تعمیرکار یا همکاران</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Target Section Information Card */}
          <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md">
                {meta.categoryLabel}
              </span>
              <span className="text-[10px] text-neutral-400 font-mono">لینک معتبر و یکتا</span>
            </div>
            <h4 className="font-black text-sm text-neutral-900 line-clamp-2 leading-relaxed">
              {title}
            </h4>
            <p className="text-xs text-neutral-500 line-clamp-2">
              {subtitle}
            </p>
          </div>

          {/* Copy Direct Link Box */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-neutral-700 flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-neutral-500" />
              <span>لینک مستقیم این صفحه / بخش:</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={fullUrl}
                onClick={(e) => (e.target as HTMLInputElement).select()}
                className="flex-1 bg-neutral-100 border border-neutral-200 rounded-xl px-3 py-2.5 text-xs text-neutral-800 font-mono dir-ltr select-all focus:outline-hidden focus:ring-2 focus:ring-red-500"
              />
              <button
                onClick={handleCopy}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shrink-0 shadow-xs ${
                  copied 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-red-600 hover:bg-red-700 text-white active:scale-95'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>کپی شد!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>کپی لینک</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Mobile Native Share Prompt if supported */}
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              onClick={handleNativeShare}
              className="w-full py-2.5 px-4 rounded-xl border border-neutral-300 hover:bg-neutral-50 text-neutral-800 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Smartphone className="w-4 h-4 text-neutral-600" />
              <span>ارسال مستقیم با برنامه‌های گوشی (Web Share)</span>
            </button>
          )}

          {/* Social Platforms Sharing Grid */}
          <div className="space-y-2.5">
            <span className="block text-xs font-bold text-neutral-700">
              ارسال سریع در پیام‌رسان‌ها:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {shareTargets.map((target) => (
                <a
                  key={target.name}
                  href={target.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`p-2.5 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-transform hover:scale-102 active:scale-98 shadow-2xs ${target.bg}`}
                  title={`اشتراک‌گذاری در ${target.name}`}
                >
                  {target.icon}
                  <span className="text-[11px] font-bold">{target.name}</span>
                </a>
              ))}
            </div>
          </div>

          {/* QR Code Toggle for mobile scanning */}
          <div className="border-t border-neutral-100 pt-4">
            <button
              onClick={() => setShowQr(!showQr)}
              className="text-xs font-bold text-neutral-600 hover:text-neutral-900 flex items-center gap-2 cursor-pointer w-full justify-between p-2 rounded-xl hover:bg-neutral-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-neutral-500" />
                <span>نمایش بارکد QR برای اسکن با گوشی</span>
              </div>
              <span className="text-[11px] text-red-600">
                {showQr ? 'بستن بارکد' : 'مشاهده QR'}
              </span>
            </button>

            {showQr && (
              <div className="mt-3 p-4 bg-neutral-50 rounded-2xl border border-neutral-200 text-center space-y-2 animate-in fade-in">
                <div className="w-40 h-40 mx-auto bg-white p-2 rounded-xl shadow-xs border border-neutral-200 flex items-center justify-center">
                  <img
                    src={qrImageUrl}
                    alt="QR Code"
                    className="w-full h-full object-contain"
                    loading="lazy"
                  />
                </div>
                <p className="text-[11px] text-neutral-500">
                  دوربین گوشی خود را روبه‌روی بارکد بگیرید تا این صفحه سریعاً باز شود.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-neutral-50 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
          <span>لینک دارای پشتیبانی کامل از ذخیره‌سازی و نشانه‌گذاری (Bookmark) است</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-neutral-200 hover:bg-neutral-300 text-neutral-700 font-bold transition-colors cursor-pointer"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};
