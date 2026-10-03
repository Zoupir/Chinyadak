import React from 'react';
import type { BannerCreative, BannerPlacementConfig } from '../../types';

interface BannerPlacementProps {
  placement: BannerPlacementConfig;
  showEmptyState?: boolean;
  onNavigate: (view: string, param?: string) => void;
  layoutOrder?: number;
}

const navigateTo = (link: string, onNavigate: BannerPlacementProps['onNavigate']) => {
  if (!link) return;
  if (link.startsWith('http://') || link.startsWith('https://')) {
    window.open(link, '_blank', 'noopener,noreferrer');
    return;
  }
  if (link.includes(':')) {
    const [view, ...rest] = link.split(':');
    onNavigate(view, rest.join(':'));
    return;
  }
  onNavigate(link);
};

const BANNER_CONTENT_ORDER: Array<'badge' | 'title' | 'subtitle' | 'button'> = ['badge','title','subtitle','button'];

const BannerCard: React.FC<{ item: BannerCreative; onNavigate: BannerPlacementProps['onNavigate']; ratio: string; mobileRatio: string }> = ({ item, onNavigate, ratio, mobileRatio }) => (
  <button
    type="button"
    className="banner-placement-card"
    style={{
      ['--banner-desktop-ratio' as any]: ratio,
      ['--banner-mobile-ratio' as any]: mobileRatio,
      ['--banner-fit' as any]: item.imageFit,
      ['--banner-title-color' as any]: item.titleColor,
      ['--banner-subtitle-color' as any]: item.subtitleColor,
      ['--banner-overlay' as any]: Math.max(0, Math.min(80, Number(item.overlayOpacity || 0))) / 100,
      ['--banner-copy-align' as any]: item.textAlignment,
      ['--banner-title-size' as any]: `${Math.max(12, Math.min(64, Number(item.titleFontSize || 28)))}px`,
      ['--banner-subtitle-size' as any]: `${Math.max(10, Math.min(36, Number(item.subtitleFontSize || 14)))}px`,
      ['--banner-copy-position' as any]: item.contentPosition === 'top' ? 'flex-start' : item.contentPosition === 'center' ? 'center' : 'flex-end'
    }}
    aria-label={item.alt || item.title || 'بنر فروشگاه'}
    onClick={() => navigateTo(item.link, onNavigate)}
  >
    <picture className="banner-placement-picture">
      {item.mobileImageUrl && <source media="(max-width: 640px)" srcSet={item.mobileImageUrl} />}
      {item.desktopImageUrl && <img src={item.desktopImageUrl} alt={item.alt || item.title} className="banner-placement-image" loading="lazy" />}
    </picture>
    {(item.title || item.subtitle || item.badge || item.buttonText) && (
      <span className="banner-placement-copy" aria-hidden="true">
        {(item.contentOrder?.length ? [...item.contentOrder, ...BANNER_CONTENT_ORDER.filter(key => !item.contentOrder?.includes(key))] : BANNER_CONTENT_ORDER).map(key => {
          if (key === 'badge' && item.badge) return <span key={key} className="banner-placement-badge">{item.badge}</span>;
          if (key === 'title' && item.title) return <strong key={key}>{item.title}</strong>;
          if (key === 'subtitle' && item.subtitle) return <span key={key}>{item.subtitle}</span>;
          if (key === 'button' && item.buttonText) return <small key={key}>{item.buttonText}</small>;
          return null;
        })}
      </span>
    )}
  </button>
);

export const BannerPlacement: React.FC<BannerPlacementProps> = ({ placement, layoutOrder, showEmptyState = false, onNavigate }) => {
  const items = [...placement.items].filter(item => item.isVisible && item.desktopImageUrl).sort((a, b) => a.order - b.order);
  if (!placement.isVisible || (!items.length && !showEmptyState)) return null;
  const columns = Math.max(1, Math.min(4, Number(placement.desktopColumns || 1)));
  const mobileColumns = Math.max(1, Math.min(2, Number(placement.mobileColumns || 1)));
  const isFullWidth = placement.widthMode === 'full';
  const containerStyle: React.CSSProperties = {
    width: isFullWidth ? '100vw' : 'min(100%, 1280px)',
    maxWidth: isFullWidth ? '100vw' : undefined,
    position: isFullWidth ? 'relative' : undefined,
    left: isFullWidth ? '50%' : undefined,
    transform: isFullWidth ? 'translateX(-50%)' : undefined,
    marginInline: isFullWidth ? 0 : 'auto',
    order: layoutOrder,
    ['--banner-gap' as any]: `${Math.max(0, Math.min(32, Number(placement.gapPx || 0)))}px`,
    ['--banner-desktop-columns' as any]: String(columns),
    ['--banner-mobile-columns' as any]: String(mobileColumns)
  };
  return (
    <section className="banner-placement" data-section-key={placement.key} data-banner-placement={placement.key} data-banner-width={placement.widthMode || 'container'} style={containerStyle} aria-label={placement.title}>
      {items.map(item => <BannerCard key={item.id} item={item} ratio={placement.desktopAspectRatio} mobileRatio={placement.mobileAspectRatio} onNavigate={onNavigate} />)}
      {!items.length && showEmptyState && <div className="banner-placement-empty">{placement.title} — برای افزودن تصویر، از بخش «جایگاه‌های بنر» استفاده کنید.</div>}
    </section>
  );
};
