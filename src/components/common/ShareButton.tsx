import React, { useState } from 'react';
import { Share2, Check } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { copyToClipboard, getFullShareUrl } from '../../utils/navigation';
import { ShareModal } from './ShareModal';

interface ShareButtonProps {
  view: string;
  param?: string;
  customTitle?: string;
  customSubtitle?: string;
  variant?: 'icon' | 'button' | 'badge' | 'minimal';
  className?: string;
  label?: string;
  /**
   * If true, clicking opens the rich ShareModal directly.
   * If false, quick-clicks copy the link immediately and alt/long-press or double click opens modal,
   * OR default is opens modal which has 1-click copy + social sharing.
   */
  openModal?: boolean;
}

export const ShareButton: React.FC<ShareButtonProps> = ({
  view,
  param,
  customTitle,
  customSubtitle,
  variant = 'icon',
  className = '',
  label = 'اشتراک‌گذاری',
  openModal = true
}) => {
  const { showToast } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (openModal) {
      setIsModalOpen(true);
      return;
    }

    // Direct copy behavior
    const url = getFullShareUrl(view, param);
    const success = await copyToClipboard(url);
    if (success) {
      setCopied(true);
      showToast('لینک مستقیم صفحه کپی شد!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } else {
      setIsModalOpen(true);
    }
  };

  return (
    <>
      {variant === 'icon' && (
        <button
          onClick={handleClick}
          className={`p-2.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-600 hover:text-neutral-900 transition-all cursor-pointer relative ${className}`}
          title="اشتراک‌گذاری لینک مستقیم این صفحه"
          aria-label="اشتراک‌گذاری"
        >
          {copied ? (
            <Check className="w-4 h-4 text-emerald-600" />
          ) : (
            <Share2 className="w-4 h-4" />
          )}
        </button>
      )}

      {variant === 'button' && (
        <button
          onClick={handleClick}
          className={`h-10 px-3.5 rounded-xl border border-neutral-200 hover:border-neutral-300 bg-white hover:bg-neutral-50 flex items-center gap-2 text-xs font-bold !text-neutral-900 hover:!text-neutral-900 transition-all shadow-2xs cursor-pointer ${className}`}
          title="اشتراک‌گذاری لینک مستقیم این صفحه"
        >
          {copied ? (
            <Check className="w-4 h-4 text-emerald-600" />
          ) : (
            <Share2 className="w-4 h-4 text-neutral-500" />
          )}
          <span className="!text-neutral-900">{copied ? 'کپی شد!' : label}</span>
        </button>
      )}

      {variant === 'badge' && (
        <button
          onClick={handleClick}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200/80 text-neutral-700 text-xs font-bold transition-colors cursor-pointer ${className}`}
          title="اشتراک‌گذاری لینک مستقیم"
        >
          <Share2 className="w-3.5 h-3.5 text-neutral-500" />
          <span>{label}</span>
        </button>
      )}

      {variant === 'minimal' && (
        <button
          onClick={handleClick}
          className={`text-neutral-500 hover:text-red-600 inline-flex items-center gap-1 text-xs font-bold transition-colors cursor-pointer ${className}`}
          title="اشتراک‌گذاری لینک مستقیم"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>{label}</span>
        </button>
      )}

      {/* Share Modal Dialog */}
      <ShareModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        view={view}
        param={param}
        customTitle={customTitle}
        customSubtitle={customSubtitle}
      />
    </>
  );
};
