import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Car,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Headphones,
  PackageCheck,
  Search,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Truck,
  Wrench
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { formatToman } from '../../utils/formatters';
import { LiveSectionModal } from '../common/LiveSectionModal';
import type { PageSectionItem } from '../../types';

interface MarketplaceRtlHomeProps {
  onNavigate: (view: string, param?: string) => void;
  onOpenVehicleModal: () => void;
}

export const MarketplaceRtlHome: React.FC<MarketplaceRtlHomeProps> = ({
  onNavigate,
  onOpenVehicleModal
}) => {
  const {
    products,
    brands,
    categories,
    sliders,
    articles,
    selectedVehicle,
    addToCart,
    settings,
    pages,
    isLiveEditActive,
    setIsLiveEditActive,
    adminAuth
  } = useStore();

  const activeSlides = useMemo(
    () => sliders.filter(slide => slide.isActive).sort((a, b) => a.order - b.order),
    [sliders]
  );

  const homeSections = useMemo(
    () => pages.find(page => page.slug === 'home')?.sections || [],
    [pages]
  );
  const sectionConfig = (key: string) => homeSections.find(section => section.sectionKey === key);
  const sectionVisible = (key: string) => sectionConfig(key)?.isVisible !== false;
  const backgroundFit = (mode?: string) => {
    const value = mode || 'cover';
    if (value === 'stretch' || value === 'full') return '100% 100%';
    if (value === 'original' || value.startsWith('repeat')) return 'auto';
    if (value === 'side' || value === 'banner') return 'cover';
    return value;
  };
  const backgroundRepeat = (mode?: string) =>
    mode === 'repeat' ? 'repeat' : mode === 'repeat-x' ? 'repeat-x' : mode === 'repeat-y' ? 'repeat-y' : 'no-repeat';
  const sectionStyle = (key: string): React.CSSProperties => {
    const section = sectionConfig(key);
    if (!section) return {};
    const imageOpacity = Math.max(0, Math.min(100, Number(section.backgroundImageOpacity ?? 100))) / 100;
    const overlayAlpha = Math.max(0, Math.min(1, 1 - imageOpacity));
    return {
      backgroundColor: section.backgroundColor || undefined,
      backgroundImage: section.imageUrl
        ? `linear-gradient(rgba(0,0,0,${overlayAlpha}), rgba(0,0,0,${overlayAlpha})), url(${section.imageUrl})`
        : undefined,
      backgroundSize: section.imageUrl ? backgroundFit(section.imageMode) : undefined,
      backgroundRepeat: section.imageUrl ? backgroundRepeat(section.imageMode) : undefined,
      backgroundPosition: section.imageUrl ? 'center' : undefined,
      color: section.textColor || undefined,
      borderRadius: section.borderRadiusPx !== undefined ? `${section.borderRadiusPx}px` : undefined,
      paddingTop: section.paddingTopPx !== undefined ? `${section.paddingTopPx}px` : undefined,
      paddingBottom: section.paddingBottomPx !== undefined ? `${section.paddingBottomPx}px` : undefined,
      paddingInline: section.paddingInlinePx !== undefined ? `${section.paddingInlinePx}px` : undefined,
      minHeight: section.minHeightPx ? `${section.minHeightPx}px` : undefined,
      textAlign: section.contentAlign || undefined,
      width: `${Math.max(20, Math.min(100, Number(section.widthPercent ?? (section.fullWidth ? 95 : 100))))}%`,
      maxWidth: section.fullWidth || section.maxWidthPx === 0 ? 'none' : `${Number(section.maxWidthPx || 1280)}px`,
      marginInline: 'auto',
      ['--builder-gap' as any]: `${section.gapPx ?? 12}px`,
      ['--builder-cols' as any]: String(section.desktopColumns || 3),
      ['--builder-tablet-cols' as any]: String(section.tabletColumns || Math.min(section.desktopColumns || 3, 2)),
      ['--builder-mobile-cols' as any]: String(section.mobileColumns || 1),
      ['--builder-item-basis' as any]: `${100 / Math.max(1, section.desktopColumns || 3)}%`,
      ['--builder-tablet-item-basis' as any]: `${100 / Math.max(1, section.tabletColumns || Math.min(section.desktopColumns || 3, 2))}%`,
      ['--builder-mobile-item-basis' as any]: `${100 / Math.max(1, section.mobileColumns || 1)}%`,
      ['--builder-item-radius' as any]: `${section.itemRadiusPx ?? 10}px`,
      ['--builder-image-size' as any]: `${section.imageSizePx ?? 72}px`,
      ['--builder-width' as any]: `${Math.max(20, Math.min(100, Number(section.widthPercent ?? (section.fullWidth ? 95 : 100))))}%`,
      ['--builder-tablet-width' as any]: `${Math.max(20, Math.min(100, Number(section.tabletWidthPercent ?? section.widthPercent ?? (section.fullWidth ? 96 : 100))))}%`,
      ['--builder-mobile-width' as any]: `${Math.max(20, Math.min(100, Number(section.mobileWidthPercent ?? section.widthPercent ?? 100)))}%`,
      ['--builder-max-width' as any]: section.fullWidth || section.maxWidthPx === 0 ? 'none' : `${Number(section.maxWidthPx || 1280)}px`,
      ['--builder-padding-top' as any]: section.paddingTopPx !== undefined ? `${section.paddingTopPx}px` : undefined,
      ['--builder-padding-bottom' as any]: section.paddingBottomPx !== undefined ? `${section.paddingBottomPx}px` : undefined,
      ['--builder-padding-inline' as any]: section.paddingInlinePx !== undefined ? `${section.paddingInlinePx}px` : undefined,
      ['--builder-section-radius' as any]: section.borderRadiusPx !== undefined ? `${section.borderRadiusPx}px` : undefined,
      ['--builder-min-height' as any]: section.minHeightPx ? `${section.minHeightPx}px` : undefined,
      ['--builder-bg' as any]: section.backgroundColor || undefined,
      ['--builder-text' as any]: section.textColor || undefined,
      ['--builder-item-bg' as any]: section.itemBackgroundColor || undefined,
      ['--builder-item-text' as any]: section.itemTextColor || undefined,
      ['--builder-item-border' as any]: section.itemBorderColor || undefined,
      ['--builder-item-padding' as any]: section.itemPaddingPx !== undefined ? `${section.itemPaddingPx}px` : undefined,
      ['--builder-item-font-size' as any]: section.itemFontSizePx !== undefined ? `${section.itemFontSizePx}px` : undefined,
      ['--builder-item-image-radius' as any]: section.itemImageRadiusPx !== undefined ? `${section.itemImageRadiusPx}px` : undefined,
      ['--builder-margin-top' as any]: section.marginTopPx !== undefined ? `${section.marginTopPx}px` : undefined,
      ['--builder-margin-bottom' as any]: section.marginBottomPx !== undefined ? `${section.marginBottomPx}px` : undefined,
      ['--builder-heading-size' as any]: section.headingFontSizePx !== undefined ? `${section.headingFontSizePx}px` : undefined,
      ['--builder-subtitle-size' as any]: section.subtitleFontSizePx !== undefined ? `${section.subtitleFontSizePx}px` : undefined,
      ['--builder-item-title-size' as any]: section.itemTitleFontSizePx !== undefined ? `${section.itemTitleFontSizePx}px` : undefined,
      ['--builder-item-content-size' as any]: section.itemContentFontSizePx !== undefined ? `${section.itemContentFontSizePx}px` : undefined,
      ['--builder-image-width' as any]: (section.itemImageWidthPx ?? section.imageSizePx) !== undefined ? `${section.itemImageWidthPx ?? section.imageSizePx}px` : undefined,
      ['--builder-image-height' as any]: (section.itemImageHeightPx ?? section.imageSizePx) !== undefined ? `${section.itemImageHeightPx ?? section.imageSizePx}px` : undefined,
      ['--builder-image-fit' as any]: section.itemImageFit || 'contain',
      ['--builder-item-min-height' as any]: section.itemMinHeightPx !== undefined ? `${section.itemMinHeightPx}px` : undefined,
      ['--builder-item-align' as any]: section.itemTextAlign || section.contentAlign || 'right',
      ['--builder-mobile-item-min' as any]: `${section.mobileItemMinWidthPx ?? 240}px`,
      ['--deal-timer-size' as any]: `${section.dealTimerFontSizePx ?? 18}px`,
      ['--deal-title-color' as any]: section.dealTitleColor || '#ffffff',
      ['--deal-subtitle-color' as any]: section.dealSubtitleColor || '#fff7ed',
      ['--deal-timer-color' as any]: section.dealTimerTextColor || '#b45309',
      ['--deal-timer-bg' as any]: section.dealTimerBoxBgColor || '#ffffff',
      ['--finder-width' as any]: `${section.finderWidthPx ?? 300}px`,
      ['--finder-padding' as any]: `${section.finderPaddingPx ?? 18}px`,
      ['--finder-radius' as any]: `${section.finderRadiusPx ?? 8}px`,
      ['--finder-title-size' as any]: `${section.finderTitleFontSizePx ?? 15}px`,
      ['--finder-text-size' as any]: `${section.finderTextFontSizePx ?? 11}px`,
      ['--finder-label-size' as any]: `${section.finderLabelFontSizePx ?? 10}px`,
      ['--finder-value-size' as any]: `${section.finderValueFontSizePx ?? 11}px`,
      ['--finder-button-size' as any]: `${section.finderButtonFontSizePx ?? 11}px`,
      ['--finder-bg' as any]: section.finderBackgroundColor || '#ffffff',
      ['--finder-text' as any]: section.finderTextColor || '#111827',
      ['--finder-field-bg' as any]: section.finderFieldBackgroundColor || '#fafafa',
      ['--finder-field-text' as any]: section.finderFieldTextColor || '#222b35',
      ['--finder-button-bg' as any]: section.finderButtonBackgroundColor || '#f5a000',
      ['--finder-button-text' as any]: section.finderButtonTextColor || '#111827'
    };
  };

  const itemVisualStyle = (key: string, item: PageSectionItem): React.CSSProperties => {
    const section = sectionConfig(key);
    const perItem = /promo|banner/i.test(key);
    const pick = <T,>(itemValue:T|undefined, sectionValue:T|undefined) => perItem ? (itemValue ?? sectionValue) : sectionValue;
    return {
      backgroundColor: pick(item.backgroundColor, section?.itemBackgroundColor) || undefined,
      color: pick(item.textColor, section?.itemTextColor) || undefined,
      borderColor: pick(item.borderColor, section?.itemBorderColor) || undefined,
      borderRadius: `${pick(item.borderRadiusPx, section?.itemRadiusPx) ?? 10}px`,
      padding: pick(item.paddingPx, section?.itemPaddingPx) !== undefined
        ? `${pick(item.paddingPx, section?.itemPaddingPx)}px` : undefined,
      fontSize: pick(item.fontSizePx, section?.itemFontSizePx) !== undefined
        ? `${pick(item.fontSizePx, section?.itemFontSizePx)}px` : undefined,
      minHeight: pick(item.minHeightPx, section?.itemMinHeightPx) !== undefined
        ? `${pick(item.minHeightPx, section?.itemMinHeightPx)}px` : undefined,
      textAlign: pick(item.textAlignment || item.textAlign, section?.itemTextAlign) || undefined,
      ['--item-image-width' as any]: `${pick(item.imageWidthPx, section?.itemImageWidthPx ?? section?.imageSizePx) ?? 72}px`,
      ['--item-image-height' as any]: `${pick(item.imageHeightPx, section?.itemImageHeightPx ?? section?.imageSizePx) ?? 72}px`,
      ['--item-image-fit' as any]:
        perItem && item.imageMode === 'stretch' ? 'fill' :
        perItem && ['cover','contain'].includes(item.imageMode || '') ? item.imageMode :
        pick(item.imageFit, section?.itemImageFit) || 'contain',
      ['--builder-image-fit' as any]: perItem
        ? backgroundFit(item.imageMode || item.imageFit || section?.itemImageFit || 'cover')
        : backgroundFit(section?.itemImageFit || 'cover'),
      ['--item-image-radius' as any]: `${pick(item.imageRadiusPx, section?.itemImageRadiusPx) ?? 0}px`,
      ['--item-title-size' as any]: pick(item.titleFontSizePx, section?.itemTitleFontSizePx) !== undefined ? `${pick(item.titleFontSizePx, section?.itemTitleFontSizePx)}px` : undefined,
      ['--item-content-size' as any]: pick(item.contentFontSizePx, section?.itemContentFontSizePx) !== undefined ? `${pick(item.contentFontSizePx, section?.itemContentFontSizePx)}px` : undefined
    };
  };

  const bannerGridItemStyle = (item: PageSectionItem): React.CSSProperties => ({
    ['--banner-cols-desktop' as any]: String(Math.max(10,Math.min(100,Math.round(item.widthPercent ?? 100)))),
    ['--banner-cols-tablet' as any]: String(Math.max(10,Math.min(100,Math.round(item.tabletWidthPercent ?? item.widthPercent ?? 100)))),
    ['--banner-cols-mobile' as any]: String(Math.max(10,Math.min(100,Math.round(item.mobileWidthPercent ?? 100)))),
    ['--banner-height-desktop' as any]: `${item.heightPx ?? item.minHeightPx ?? 178}px`,
    ['--banner-height-tablet' as any]: `${item.tabletHeightPx ?? item.heightPx ?? item.minHeightPx ?? 178}px`,
    ['--banner-height-mobile' as any]: `${item.mobileHeightPx ?? item.tabletHeightPx ?? item.heightPx ?? item.minHeightPx ?? 168}px`
  });
  const sourceItemsFor = (
    source: 'manual' | 'categories' | 'brands' | 'products' | 'articles',
    limit: number
  ): PageSectionItem[] => {
    const max = Math.max(1, Math.min(100, limit || 12));
    if (source === 'categories') {
      return categories.slice(0, max).map((item, index) => ({
        id: `source-category-${item.id}`,
        title: item.nameFa,
        subtitle: item.description || item.nameEn,
        imageUrl: item.iconUrl || item.imageUrl || '',
        link: `category:${item.slug}`,
        isVisible: true,
        order: index + 1
      }));
    }
    if (source === 'brands') {
      return brands.slice(0, max).map((item, index) => ({
        id: `source-brand-${item.id}`,
        title: item.nameFa,
        subtitle: item.nameEn,
        imageUrl: item.logo || '',
        link: `car-brand:${item.slug || item.id}`,
        isVisible: true,
        order: index + 1
      }));
    }
    if (source === 'products') {
      return products.slice(0, max).map((item, index) => ({
        id: `source-product-${item.id}`,
        title: item.nameFa,
        subtitle: item.shortDescription || item.oemNumber,
        imageUrl: item.images?.[0] || '',
        badge: item.oemNumber,
        link: `product:${item.slug || item.id}`,
        isVisible: true,
        order: index + 1
      }));
    }
    if (source === 'articles') {
      return articles.slice(0, max).map((item, index) => ({
        id: `source-article-${item.id}`,
        title: item.title,
        subtitle: item.summary,
        imageUrl: item.imageUrl || '',
        link: `article:${item.slug || item.id}`,
        isVisible: true,
        order: index + 1
      }));
    }
    return [];
  };

  const sortedItems = (key: string) => {
    const section = sectionConfig(key);
    const source = section?.contentSource || 'manual';
    const base = source === 'manual'
      ? [...(section?.items || [])]
      : sourceItemsFor(source, section?.contentSourceLimit || section?.maxItems || 12);
    return base
      .filter(item => item.isVisible !== false)
      .sort((a, b) => a.order - b.order);
  };

  const bannerBackgroundStyle = (
    item: PageSectionItem,
    image: string,
    withOverlay = false
  ): React.CSSProperties => {
    if (!image) return {};
    const mode = item.imageMode || (item.imageFit === 'contain' ? 'contain' : 'cover');
    const repeat =
      mode === 'repeat' ? 'repeat' :
      mode === 'repeat-x' ? 'repeat-x' :
      mode === 'repeat-y' ? 'repeat-y' :
      'no-repeat';
    const size =
      mode === 'stretch' ? '100% 100%' :
      mode === 'original' || mode.startsWith('repeat') ? 'auto' :
      mode;

    return withOverlay
      ? {
          backgroundImage: `linear-gradient(90deg, rgba(0,0,0,.24), rgba(0,0,0,.62)), url(${image})`,
          backgroundSize: `100% 100%, ${size}`,
          backgroundRepeat: `no-repeat, ${repeat}`,
          backgroundPosition: 'center, center',
          ['--builder-image-fit' as any]: size
        }
      : {
          backgroundImage: `url(${image})`,
          backgroundSize: size,
          backgroundRepeat: repeat,
          backgroundPosition: 'center',
          ['--builder-image-fit' as any]: size
        };
  };

  const freeLayoutStyle = (
    owner: any,
    key: 'tag' | 'title' | 'subtitle' | 'button',
    fallback: { x: number; y: number; width: number }
  ): React.CSSProperties => {
    const layouts = owner?.responsiveLayout || {};
    const desktop = { ...fallback, ...(layouts.desktop?.[key] || {}) };
    const tablet = owner?.inheritTabletFromDesktop === false
      ? { ...desktop, ...(layouts.tablet?.[key] || {}) }
      : desktop;
    const mobile = owner?.inheritMobileFromDesktop === false
      ? { ...desktop, ...(layouts.mobile?.[key] || {}) }
      : desktop;

    return {
      ['--free-d-x' as any]: String(desktop.x),
      ['--free-d-y' as any]: String(desktop.y),
      ['--free-d-w' as any]: String(desktop.width),
      ['--free-d-h' as any]: desktop.height ? `${desktop.height}%` : 'auto',
      ['--free-d-font' as any]: desktop.fontSizePx ? `${desktop.fontSizePx}px` : undefined,
      ['--free-d-wrap' as any]: desktop.wrap === 'nowrap' ? 'nowrap' : 'normal',
      ['--free-t-x' as any]: String(tablet.x),
      ['--free-t-y' as any]: String(tablet.y),
      ['--free-t-w' as any]: String(tablet.width),
      ['--free-t-h' as any]: tablet.height ? `${tablet.height}%` : 'auto',
      ['--free-t-font' as any]: tablet.fontSizePx ? `${tablet.fontSizePx}px` : undefined,
      ['--free-t-wrap' as any]: tablet.wrap === 'nowrap' ? 'nowrap' : 'normal',
      ['--free-m-x' as any]: String(mobile.x),
      ['--free-m-y' as any]: String(mobile.y),
      ['--free-m-w' as any]: String(mobile.width),
      ['--free-m-h' as any]: mobile.height ? `${mobile.height}%` : 'auto',
      ['--free-m-font' as any]: mobile.fontSizePx ? `${mobile.fontSizePx}px` : undefined,
      ['--free-m-wrap' as any]: mobile.wrap === 'nowrap' ? 'nowrap' : 'normal'
    };
  };

  const freeElementStyle = (
    owner: any,
    key: 'tag' | 'title' | 'subtitle' | 'button',
    fallback: { x: number; y: number; width: number }
  ): React.CSSProperties => {
    const base = freeLayoutStyle(owner, key, fallback);
    const align = owner?.textAlignment || owner?.textAlign || 'right';
    if (key === 'title') {
      const color=owner?.titleColor || owner?.textColor || '#ffffff';
      return { ...base, color, textAlign: align, ['--free-color' as any]: color };
    }
    if (key === 'subtitle') {
      const color=owner?.subtitleColor || '#e5e7eb';
      return { ...base, color, textAlign: align, ['--free-color' as any]: color };
    }
    if (key === 'button') {
      const backgroundColor=owner?.buttonBgColor || '#f59e0b';
      const color=owner?.buttonTextColor || '#111827';
      return {
        ...base,
        backgroundColor,
        color,
        textAlign: 'center',
        ['--free-bg' as any]: backgroundColor,
        ['--free-color' as any]: color
      };
    }
    const backgroundColor=owner?.badgeBgColor || '#16a34a';
    const color=owner?.badgeTextColor || '#ffffff';
    return {
      ...base,
      backgroundColor,
      color,
      textAlign: align,
      ['--free-bg' as any]: backgroundColor,
      ['--free-color' as any]: color
    };
  };

  const [heroIndex, setHeroIndex] = useState(0);
  const [liveSectionId, setLiveSectionId] = useState<string | null>(null);
  const [isHeroHovered, setIsHeroHovered] = useState(false);
  const heroNavigation = settings.heroSliderNavigation || 'dots';
  const heroAnimation = settings.heroSliderAnimation || 'fade';
  const heroAutoplayMs = Math.max(1500, Number(settings.heroSliderAutoplayMs || 6500));
  const heroLoop = settings.heroSliderLoop !== false;

  const moveHero = (delta: number) => {
    if (activeSlides.length <= 1) return;
    setHeroIndex(current => {
      const next = current + delta;
      if (heroLoop) return (next + activeSlides.length) % activeSlides.length;
      return Math.max(0, Math.min(activeSlides.length - 1, next));
    });
  };

  useEffect(() => {
    if (activeSlides.length <= 1) return;
    if (settings.heroSliderPauseOnHover !== false && isHeroHovered) return;
    const timer = window.setInterval(() => {
      setHeroIndex(current => {
        if (!heroLoop && current >= activeSlides.length - 1) return current;
        return (current + 1) % activeSlides.length;
      });
    }, heroAutoplayMs);
    return () => window.clearInterval(timer);
  }, [activeSlides.length, heroAutoplayMs, heroLoop, isHeroHovered, settings.heroSliderPauseOnHover]);

  useEffect(() => {
    if (heroIndex >= activeSlides.length) setHeroIndex(0);
  }, [activeSlides.length, heroIndex]);

  const hero = activeSlides[heroIndex] || activeSlides[0];
  const fillProducts = (preferred: typeof products, count = 8) => {
    const seen = new Set<string>();
    return [...preferred, ...products]
      .filter(product => {
        if (seen.has(product.id)) return false;
        seen.add(product.id);
        return true;
      })
      .slice(0, count);
  };

  const featured = products.filter(p => p.isFeatured);
  const bestSellers = products.filter(p => p.isBestSeller);
  const maintenance = products.filter(p => p.isMaintenancePart);
  const productStrip = fillProducts(featured, 8);
  const deals = fillProducts(bestSellers, 8);
  const serviceParts = fillProducts(maintenance, 8);
  const [featuredTab, setFeaturedTab] = useState<'engine' | 'service' | 'suspension'>('engine');
  const [vinQuery, setVinQuery] = useState('');

  const visibleFeaturedProducts =
    featuredTab === 'service'
      ? fillProducts(products.filter(product => ['filters', 'oils', 'maintenance'].includes(product.categorySlug || '') || product.isMaintenancePart), 8)
      : featuredTab === 'suspension'
      ? fillProducts(products.filter(product => ['suspension', 'brakes', 'steering'].includes(product.categorySlug || '')), 8)
      : fillProducts(products.filter(product => ['engine', 'turbo', 'cooling'].includes(product.categorySlug || '') || product.isFeatured), 8);

  const wideBannerSection = sectionConfig('wide-banner-1');
  const wideBannerItem = sortedItems('wide-banner-1')[0] || (
    isLiveEditActive && adminAuth.isAuthenticated
      ? {
          id: `${wideBannerSection?.id || 'wide-banner-1'}-live-placeholder`,
          title: wideBannerSection?.title || 'بنر عریض میانی',
          subtitle: wideBannerSection?.subtitle || 'این بنر خالی است؛ برای افزودن تصویر و محتوا ویرایشش کنید.',
          imageUrl: wideBannerSection?.imageUrl || '',
          link: wideBannerSection?.buttonLink || '',
          buttonText: wideBannerSection?.buttonText || 'ویرایش بنر',
          isVisible: true,
          order: 1
        }
      : undefined
  );

  const handleLiveEditCapture = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isLiveEditActive || !adminAuth.isAuthenticated) return;
    const target = event.target as HTMLElement;
    const sectionElement = target.closest<HTMLElement>('[data-section-key]');
    if (!sectionElement) return;

    const sectionKey = sectionElement.dataset.sectionKey;
    const section = homeSections.find(item => item.sectionKey === sectionKey);
    if (!section) return;

    event.preventDefault();
    event.stopPropagation();
    setLiveSectionId(section.id);
  };

  const goLink = (link?: string) => {
    if (!link) return;
    if (/^https?:\/\//i.test(link)) {
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

  const ReferenceProductCard = ({ product }: { product: (typeof products)[number] }) => {
    const effectivePrice = product.discountPrice || product.price;
    const hasDiscount = Boolean(product.discountPrice && product.discountPrice < product.price);
    return (
      <article className="marketplace-ref-product-card">
        <button
          type="button"
          className="marketplace-ref-product-image"
          onClick={() => onNavigate('product', product.id)}
          aria-label={product.nameFa}
        >
          {product.images?.[0] ? <img src={product.images[0]} alt={product.seo?.images?.[product.images[0]]?.alt || product.nameFa} title={product.seo?.images?.[product.images[0]]?.title || product.nameFa} /> : <Wrench className="w-7 h-7" />}
          {hasDiscount && <span className="marketplace-ref-sale">فروش ویژه</span>}
        </button>
        <div className="marketplace-ref-product-info">
          <div className="marketplace-ref-badges">
            {product.isBestSeller && <span>پرفروش</span>}
            <span className="muted">{product.brandManufacturer || 'قطعه اصلی'}</span>
          </div>
          <button type="button" className="marketplace-ref-product-title" onClick={() => onNavigate('product', product.id)}>
            {product.nameFa}
          </button>
          <small className="marketplace-ref-sku">{product.oemNumber || product.partNumber || product.sku}</small>
          <div className="marketplace-ref-rating">★★★★★ <em>({product.reviewsCount || 0})</em></div>
          <div className="marketplace-ref-product-bottom">
            <div>
              {hasDiscount && <del>{formatToman(product.price)}</del>}
              <strong>{formatToman(effectivePrice)}</strong>
            </div>
            <button
              type="button"
              className="marketplace-ref-add"
              onClick={(event) => {
                event.stopPropagation();
                addToCart(product, 1, selectedVehicle || null);
              }}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>افزودن</span>
            </button>
          </div>
        </div>
      </article>
    );
  };

  return (
    <div
      className={`marketplace-rtl-home ${isLiveEditActive && adminAuth.isAuthenticated ? 'is-live-editing' : ''}`}
      dir="rtl"
      onClickCapture={handleLiveEditCapture}
    >
      {isLiveEditActive && adminAuth.isAuthenticated && (
        <div className="marketplace-live-edit-toolbar">
          <span>ویرایش زنده فعال است — روی هر سکشن کلیک کن</span>
          <button type="button" onClick={(event) => { event.stopPropagation(); setIsLiveEditActive(false); }}>خروج از ویرایش</button>
        </div>
      )}
      {sectionVisible('hero') && (
      <section className="marketplace-hero-shell" data-section-key="hero" data-finder-side={sectionConfig('hero')?.finderSide || 'left'} style={sectionStyle('hero')}>
        <div
          key={hero?.id || heroIndex}
          className="marketplace-hero-banner"
          data-slider-animation={heroAnimation}
          onMouseEnter={() => setIsHeroHovered(true)}
          onMouseLeave={() => setIsHeroHovered(false)}
          style={{
            ...(hero?.imageUrl || sectionConfig('hero')?.imageUrl ? (() => {
              const image = hero?.imageUrl || sectionConfig('hero')?.imageUrl || '';
              const mode = hero?.imageMode || sectionConfig('hero')?.imageMode || 'cover';
              return {
                backgroundImage: `url(${image})`,
                backgroundSize: backgroundFit(mode),
                backgroundRepeat: backgroundRepeat(mode),
                backgroundPosition: 'center'
              };
            })() : {}),
            backgroundColor: hero?.bgColor || sectionConfig('hero')?.backgroundColor || undefined,
            borderRadius: `${sectionConfig('hero')?.borderRadiusPx ?? 0}px`
          }}
        >
          <div
            className="marketplace-hero-overlay"
            style={{ opacity: hero?.gradientOverlay === false ? 0 : Math.max(0, Math.min(1, Number(hero?.overlayOpacity ?? 60) / 100)) }}
          />
          {hero?.responsiveLayout ? (
            <div className="marketplace-free-layout-layer" aria-label="محتوای اسلاید">
              {(hero?.tag || sectionConfig('hero')?.badge) && (
                <span
                  className="marketplace-free-layout-el marketplace-free-tag"
                  style={{
                    ...freeElementStyle(hero, 'tag', { x: 70, y: 18, width: 20 })
                  }}
                >
                  {hero?.tag || sectionConfig('hero')?.badge}
                </span>
              )}
              <h1
                className="marketplace-free-layout-el marketplace-free-title"
                style={{
                  ...freeElementStyle(hero, 'title', { x: 58, y: 29, width: 34 })
                }}
              >
                {hero?.title ?? sectionConfig('hero')?.title ?? ''}
              </h1>
              <p
                className="marketplace-free-layout-el marketplace-free-subtitle"
                style={{
                  ...freeElementStyle(hero, 'subtitle', { x: 60, y: 51, width: 32 })
                }}
              >
                {hero?.subtitle ?? sectionConfig('hero')?.subtitle ?? ''}
              </p>
              <button
                type="button"
                className="marketplace-free-layout-el marketplace-free-button"
                style={{
                  ...freeElementStyle(hero, 'button', { x: 75, y: 69, width: 17 })
                }}
                onClick={() => goLink(hero?.link || sectionConfig('hero')?.buttonLink)}
              >
                {hero?.buttonText ?? sectionConfig('hero')?.buttonText ?? ''}
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="marketplace-hero-content" style={{ textAlign: hero?.textAlignment || sectionConfig('hero')?.contentAlign || 'right' }}>
              <span
                className="marketplace-kicker"
                style={{ backgroundColor: hero?.badgeBgColor || undefined, color: hero?.badgeTextColor || undefined }}
              >{hero?.tag ?? sectionConfig('hero')?.badge ?? ''}</span>
              <h1 style={{ color: hero?.titleColor || undefined }}>{hero?.title || sectionConfig('hero')?.title || 'قطعات مطمئن برای خودروی شما'}</h1>
              <p style={{ color: hero?.subtitleColor || undefined }}>{hero?.subtitle || sectionConfig('hero')?.subtitle || 'خرید تخصصی قطعات خودروهای چینی با تضمین اصالت، فیتمنت دقیق و ارسال سریع.'}</p>
              <button
                type="button"
                style={{ backgroundColor: hero?.buttonBgColor || undefined, color: hero?.buttonTextColor || undefined }}
                onClick={() => goLink(hero?.link || sectionConfig('hero')?.buttonLink)}
              >
                {hero?.buttonText ?? sectionConfig('hero')?.buttonText ?? ''}
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          )}

          {activeSlides.length > 1 && (heroNavigation === 'arrows' || heroNavigation === 'both') && (
            <div className="marketplace-hero-arrows" aria-label="کنترل اسلایدر">
              <button type="button" onClick={() => moveHero(-1)} disabled={!heroLoop && heroIndex === 0} aria-label="اسلاید قبلی">
                <ChevronRight className="w-5 h-5" />
              </button>
              <button type="button" onClick={() => moveHero(1)} disabled={!heroLoop && heroIndex === activeSlides.length - 1} aria-label="اسلاید بعدی">
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>
          )}

          {activeSlides.length > 1 && (heroNavigation === 'dots' || heroNavigation === 'both') && (
            <div className="marketplace-hero-dots" aria-label="اسلایدهای صفحه اصلی">
              {activeSlides.map((slide, index) => (
                <button
                  key={slide.id}
                  type="button"
                  className={index === heroIndex ? 'active' : ''}
                  onClick={() => setHeroIndex(index)}
                  aria-label={`اسلاید ${index + 1}`}
                />
              ))}
            </div>
          )}

          <div className="marketplace-vehicle-finder">
            <h3>خودروی خود را انتخاب کنید</h3>
            <p>تا فقط قطعات سازگار نمایش داده شوند</p>
            <div className="marketplace-finder-grid">
              <button type="button" onClick={onOpenVehicleModal}>
                <span>برند</span>
                <strong>{selectedVehicle?.brandName || 'انتخاب'}</strong>
              </button>
              <button type="button" onClick={onOpenVehicleModal}>
                <span>مدل</span>
                <strong>{selectedVehicle?.modelName || 'انتخاب'}</strong>
              </button>
              <button type="button" onClick={onOpenVehicleModal}>
                <span>سال</span>
                <strong>{selectedVehicle?.year || 'انتخاب'}</strong>
              </button>
              <button type="button" onClick={onOpenVehicleModal}>
                <span>موتور</span>
                <strong>{selectedVehicle?.engine || 'انتخاب'}</strong>
              </button>
              <button type="button" onClick={onOpenVehicleModal}>
                <span>گیربکس</span>
                <strong>انتخاب</strong>
              </button>
              <button type="button" onClick={onOpenVehicleModal}>
                <span>تیپ</span>
                <strong>انتخاب</strong>
              </button>
            </div>

            <div className="marketplace-finder-or"><span>یا</span></div>

            <div className="marketplace-finder-vin">
              <input
                value={vinQuery}
                onChange={(event) => setVinQuery(event.target.value)}
                placeholder="جستجو با VIN / شماره شاسی"
                dir="ltr"
                aria-label="جستجو با شماره شاسی"
              />
            </div>

            <button
              className="marketplace-search-car"
              type="button"
              onClick={() => vinQuery.trim() ? onNavigate('part-request', vinQuery.trim()) : onOpenVehicleModal()}
            >
              <Search className="w-4 h-4" />
              جستجو
            </button>
          </div>
        </div>
      </section>
      )}

      {sectionVisible('featured-categories') && (
      <section className="marketplace-section marketplace-category-row" data-section-key="featured-categories" data-mobile-display={sectionConfig('featured-categories')?.mobileDisplayMode || 'grid'} style={sectionStyle('featured-categories')}>
        <div className="marketplace-section-heading compact">
          <h2>{sectionConfig('featured-categories')?.title || 'دسته‌بندی‌های ویژه'}</h2>
        </div>
        <div className="marketplace-round-list builder-section-grid">
          {(sortedItems('featured-categories').length
            ? sortedItems('featured-categories')
            : categories.slice(0, sectionConfig('featured-categories')?.maxItems || 9).map((cat,index): PageSectionItem => ({
                id:cat.id,
                title:cat.nameFa,
                imageUrl:cat.iconUrl || cat.imageUrl,
                link:`category:${cat.slug}`,
                order:index+1,
                isVisible:true
              }))
          ).slice(0, sectionConfig('featured-categories')?.maxItems || 100).map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => goLink(item.link)}
              style={itemVisualStyle('featured-categories', item)}
            >
              <span className="marketplace-round-icon">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.title || ''} style={{borderRadius:`${item.imageRadiusPx ?? sectionConfig('featured-categories')?.itemImageRadiusPx ?? 0}px`}} />
                ) : (
                  <Wrench className="w-6 h-6" />
                )}
              </span>
              <strong>{item.title}</strong>
            </button>
          ))}
        </div>
      </section>
      )}

      {sectionVisible('promo-small') && (
      <section className="marketplace-section marketplace-promo-grid three builder-section-grid" data-section-key="promo-small" data-mobile-display={sectionConfig('promo-small')?.mobileDisplayMode || 'grid'} style={sectionStyle('promo-small')}>
        {sortedItems('promo-small').map((item, index) => (
          <button
            key={item.id}
            type="button"
            className="marketplace-promo-card"
            style={{
              ...itemVisualStyle('promo-small', item as PageSectionItem),
              ...bannerGridItemStyle(item as PageSectionItem),
              ...bannerBackgroundStyle(item as PageSectionItem, item.imageUrl || '')
            }}
            onClick={() => goLink(item.link)}
          >
            {item.responsiveLayout ? (
              <span className="marketplace-free-layout-layer" aria-hidden="true">
                {item.badge && (
                  <span className="marketplace-free-layout-el marketplace-free-tag" style={freeElementStyle(item, 'tag', { x: 70, y: 16, width: 22 })}>{item.badge}</span>
                )}
                <h3 className="marketplace-free-layout-el marketplace-free-title marketplace-free-promo-title" style={freeElementStyle(item, 'title', { x: 55, y: 24, width: 38 })}>{item.title || ''}</h3>
                {item.subtitle && <span className="marketplace-free-layout-el marketplace-free-subtitle marketplace-free-promo-subtitle" style={freeElementStyle(item, 'subtitle', { x: 58, y: 48, width: 34 })}>{item.subtitle}</span>}
                <small className="marketplace-free-layout-el marketplace-free-button marketplace-free-promo-button" style={freeElementStyle(item, 'button', { x: 73, y: 70, width: 20 })}>{item.buttonText || ''}</small>
              </span>
            ) : (
              <>
                {item.subtitle && <span style={{color:item.subtitleColor||'#e5e7eb'}}>{item.subtitle}</span>}
                {item.title && <h3 style={{color:item.titleColor||item.textColor||'#ffffff'}}>{item.title}</h3>}
                {item.buttonText && <small style={{backgroundColor:item.buttonBgColor||'#f59e0b',color:item.buttonTextColor||'#111827'}}>{item.buttonText}</small>}
              </>
            )}
          </button>
        ))}
      </section>
      )}

      {sectionVisible('featured-products') && (
      <section className="marketplace-section" data-section-key="featured-products" data-mobile-display={sectionConfig('featured-products')?.mobileDisplayMode || 'grid'} style={sectionStyle('featured-products')}>
        <div className="marketplace-section-heading">
          <div>
            <h2>{sectionConfig('featured-products')?.title || 'محصولات ویژه'}</h2>
            <p>{sectionConfig('featured-products')?.subtitle || 'محصولات منتخب، جدید و پرفروش فروشگاه'}</p>
          </div>
          <button type="button" onClick={() => onNavigate('shop')}>
            مشاهده همه
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
        <div className="marketplace-product-tabs" role="tablist" aria-label="فیلتر محصولات ویژه">
          <button type="button" className={featuredTab === 'engine' ? 'active' : ''} onClick={() => setFeaturedTab('engine')}>قطعات موتور</button>
          <button type="button" className={featuredTab === 'service' ? 'active' : ''} onClick={() => setFeaturedTab('service')}>روغن و فیلترها</button>
          <button type="button" className={featuredTab === 'suspension' ? 'active' : ''} onClick={() => setFeaturedTab('suspension')}>جلوبندی و تعلیق</button>
        </div>
        <div className="marketplace-product-grid builder-section-grid">
          {visibleFeaturedProducts.slice(0, sectionConfig('featured-products')?.maxItems || visibleFeaturedProducts.length).map(product => (
            <ReferenceProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
      )}

      {sectionVisible('wide-banner-1') && wideBannerItem && (
      <section
        className="marketplace-wide-banner marketplace-banner-grid"
        data-section-key="wide-banner-1"
        data-mobile-display={sectionConfig('wide-banner-1')?.mobileDisplayMode || 'grid'}
        style={sectionStyle('wide-banner-1')}
      >
        <button
          type="button"
          className="marketplace-wide-banner-item"
          style={{
            ...itemVisualStyle('wide-banner-1', wideBannerItem),
            ...bannerGridItemStyle(wideBannerItem),
            ...bannerBackgroundStyle(wideBannerItem, wideBannerItem.imageUrl || '', true)
          }}
          onClick={() => goLink(wideBannerItem.link)}
        >
          {wideBannerItem.responsiveLayout ? (
            <span className="marketplace-free-layout-layer" aria-hidden="true">
              {wideBannerItem.badge && <span className="marketplace-free-layout-el marketplace-free-tag" style={freeElementStyle(wideBannerItem, 'tag', { x: 72, y: 16, width: 20 })}>{wideBannerItem.badge}</span>}
              {wideBannerItem.title && <h2 className="marketplace-free-layout-el marketplace-free-title" style={freeElementStyle(wideBannerItem, 'title', { x: 62, y: 28, width: 32 })}>{wideBannerItem.title}</h2>}
              {wideBannerItem.subtitle && <span className="marketplace-free-layout-el marketplace-free-subtitle" style={freeElementStyle(wideBannerItem, 'subtitle', { x: 68, y: 18, width: 24 })}>{wideBannerItem.subtitle}</span>}
              {wideBannerItem.buttonText && <small className="marketplace-free-layout-el marketplace-free-button" style={freeElementStyle(wideBannerItem, 'button', { x: 78, y: 72, width: 14 })}>{wideBannerItem.buttonText}</small>}
            </span>
          ) : (
            <div className="marketplace-wide-banner-copy" style={{textAlign:wideBannerItem.textAlignment || 'right'}}>
              {wideBannerItem.subtitle && <span style={{color:wideBannerItem.subtitleColor || '#f5a000'}}>{wideBannerItem.subtitle}</span>}
              {wideBannerItem.title && <h2 style={{color:wideBannerItem.titleColor || '#ffffff'}}>{wideBannerItem.title}</h2>}
              {wideBannerItem.buttonText && <small style={{backgroundColor:wideBannerItem.buttonBgColor || '#ffffff',color:wideBannerItem.buttonTextColor || '#111827'}}>{wideBannerItem.buttonText}</small>}
            </div>
          )}
        </button>
      </section>
      )}

      {sectionVisible('manufacturers') && (
      <section className="marketplace-section marketplace-brands" data-section-key="manufacturers" data-mobile-display={sectionConfig('manufacturers')?.mobileDisplayMode || 'grid'} style={sectionStyle('manufacturers')}>
        <div className="marketplace-section-heading compact">
          <h2>{sectionConfig('manufacturers')?.title || 'برندهای خودرو'}</h2>
          <button type="button" onClick={() => onNavigate('shop')}>مشاهده همه</button>
        </div>
        <div className="marketplace-brand-row builder-section-grid">
          {(sectionConfig('manufacturers')?.items?.length
            ? sortedItems('manufacturers').slice(0, sectionConfig('manufacturers')?.maxItems || sortedItems('manufacturers').length)
            : brands.slice(0, sectionConfig('manufacturers')?.maxItems || brands.length).map((brand, index) => ({
                id: brand.id,
                title: brand.nameFa,
                imageUrl: brand.logo,
                link: `car-brand:${brand.slug}`,
                isVisible: true,
                order: index + 1
              }))
          ).map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (item.link?.startsWith('car-brand:')) onNavigate('car-brand', item.link.split(':')[1]);
                else goLink(item.link);
              }}
              style={itemVisualStyle('manufacturers', item)}
            >
              <span style={{ width: 'var(--builder-image-size)', height: 'var(--builder-image-size)' }}>
                {item.imageUrl ? <img src={item.imageUrl} alt={item.title || 'برند خودرو'} style={{ maxWidth: '100%', maxHeight: '100%' }} /> : <Car className="w-6 h-6" />}
              </span>
              <small>{item.title}</small>
            </button>
          ))}
        </div>
      </section>
      )}

      {sectionVisible('parts-brands') && (
      <section className="marketplace-section marketplace-brand-tiles" data-section-key="parts-brands" data-mobile-display={sectionConfig('parts-brands')?.mobileDisplayMode || 'grid'} style={sectionStyle('parts-brands')}>
        <div className="marketplace-section-heading compact">
          <h2>{sectionConfig('parts-brands')?.title || 'برندهای محبوب قطعات'}</h2>
        </div>
        <div className="marketplace-logo-tiles marketplace-logo-tiles-with-images builder-section-grid">
          {(settings.popularPartsBrands || []).filter(item => item.isVisible !== false).slice(0, sectionConfig('parts-brands')?.maxItems || 12).map((item) => (
            <button key={item.id} type="button" onClick={() => goLink(item.link)} style={itemVisualStyle('parts-brands', item as PageSectionItem)}>
              {item.imageUrl ? (
                <span className="marketplace-parts-brand-logo has-image">
                  <img src={item.imageUrl} alt={item.title} />
                  <strong>{item.title}</strong>
                </span>
              ) : (
                <span className="marketplace-parts-brand-copy no-image">
                  <strong>{item.title}</strong>
                </span>
              )}
            </button>
          ))}
        </div>
      </section>
      )}

      {sectionVisible('promo-medium') && (
      <section className="marketplace-section marketplace-promo-grid two builder-section-grid" data-section-key="promo-medium" data-mobile-display={sectionConfig('promo-medium')?.mobileDisplayMode || 'grid'} style={sectionStyle('promo-medium')}>
        {sortedItems('promo-medium').map((item, index) => (
          <button
            key={item.id}
            type="button"
            className="marketplace-promo-card marketplace-promo-medium"
            style={{
              ...itemVisualStyle('promo-medium', item as PageSectionItem),
              ...bannerGridItemStyle(item as PageSectionItem),
              ...bannerBackgroundStyle(item as PageSectionItem, item.imageUrl || '')
            }}
            onClick={() => goLink(item.link)}
          >
            {item.responsiveLayout ? (
              <span className="marketplace-free-layout-layer" aria-hidden="true">
                {item.badge && <span className="marketplace-free-layout-el marketplace-free-tag" style={freeElementStyle(item, 'tag', { x: 70, y: 16, width: 22 })}>{item.badge}</span>}
                <h3 className="marketplace-free-layout-el marketplace-free-title marketplace-free-promo-title" style={freeElementStyle(item, 'title', { x: 55, y: 24, width: 38 })}>{item.title || ''}</h3>
                {item.subtitle && <span className="marketplace-free-layout-el marketplace-free-subtitle marketplace-free-promo-subtitle" style={freeElementStyle(item, 'subtitle', { x: 58, y: 48, width: 34 })}>{item.subtitle}</span>}
                <small className="marketplace-free-layout-el marketplace-free-button marketplace-free-promo-button" style={freeElementStyle(item, 'button', { x: 73, y: 70, width: 20 })}>{item.buttonText || ''}</small>
              </span>
            ) : (
              <>
                {item.subtitle && <span style={{color:item.subtitleColor||'#e5e7eb'}}>{item.subtitle}</span>}
                {item.title && <h3 style={{color:item.titleColor||item.textColor||'#ffffff'}}>{item.title}</h3>}
                {item.buttonText && <small style={{backgroundColor:item.buttonBgColor||'#f59e0b',color:item.buttonTextColor||'#111827'}}>{item.buttonText}</small>}
              </>
            )}
          </button>
        ))}
      </section>
      )}

      {sectionVisible('weekly-deals') && (
      <section
        className="marketplace-deals"
        data-section-key="weekly-deals"
        data-mobile-display={sectionConfig('weekly-deals')?.mobileDisplayMode || 'grid'}
        data-timer-align={sectionConfig('weekly-deals')?.dealTimerAlign || 'left'}
        data-content-valign={sectionConfig('weekly-deals')?.dealContentVerticalAlign || 'center'}
        style={sectionStyle('weekly-deals')}
      >
        <div className="marketplace-section marketplace-deals-inner">
          <div className="marketplace-section-heading inverse">
            <div className="marketplace-deal-heading">
              <div className="marketplace-deal-copy">
                <h2>{sectionConfig('weekly-deals')?.title || 'بهترین پیشنهادهای این هفته'}</h2>
                <p>{sectionConfig('weekly-deals')?.subtitle || 'فرصت محدود برای خرید قطعات منتخب'}</p>
              </div>
              <div className="marketplace-deal-timer" aria-label="زمان باقی‌مانده پیشنهاد">
                <span>۰۶</span><b>:</b><span>۲۳</span><b>:</b><span>۲۹</span><b>:</b><span>۴۹</span>
              </div>
            </div>
            <button type="button" onClick={() => onNavigate('shop')}>مشاهده همه</button>
          </div>
          <div className="marketplace-product-grid builder-section-grid">
            {deals.slice(0, sectionConfig('weekly-deals')?.maxItems || deals.length).map(product => (
              <ReferenceProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>
      )}

      {sectionVisible('promo-large') && (
      <section className="marketplace-section marketplace-feature-banners builder-section-grid" data-section-key="promo-large" data-layout-variant={sectionConfig('promo-large')?.layoutVariant || 'mosaic'} data-mobile-display={sectionConfig('promo-large')?.mobileDisplayMode || 'grid'} style={sectionStyle('promo-large')}>
        {sortedItems('promo-large').map((item, index) => {
          const image = item.imageUrl || '';
          return (
            <button
              key={item.id}
              type="button"
              className={index % 3 === 0 ? 'large' : 'small'}
              style={{
                ...itemVisualStyle('promo-large', item),
                ...bannerGridItemStyle(item),
                ...bannerBackgroundStyle(item as PageSectionItem, image, true)
              }}
              onClick={() => goLink(item.link)}
            >
              {item.responsiveLayout ? (
                <span className="marketplace-free-layout-layer" aria-hidden="true">
                  {item.badge && <span className="marketplace-free-layout-el marketplace-free-tag" style={freeElementStyle(item, 'tag', { x: 68, y: 15, width: 22 })}>{item.badge}</span>}
                  <h3 className="marketplace-free-layout-el marketplace-free-title marketplace-free-promo-title" style={freeElementStyle(item, 'title', { x: 54, y: 26, width: 40 })}>{item.title || ''}</h3>
                  {item.subtitle && <span className="marketplace-free-layout-el marketplace-free-subtitle marketplace-free-promo-subtitle" style={freeElementStyle(item, 'subtitle', { x: 58, y: 50, width: 34 })}>{item.subtitle}</span>}
                  {item.buttonText && <small className="marketplace-free-layout-el marketplace-free-button marketplace-free-promo-button" style={freeElementStyle(item, 'button', { x: 73, y: 72, width: 20 })}>{item.buttonText}</small>}
                </span>
              ) : (
                <div>
                  {item.subtitle && <span style={{color:item.subtitleColor||'#e5e7eb'}}>{item.subtitle}</span>}
                  {item.title && <h3 style={{color:item.titleColor||item.textColor||'#ffffff'}}>{item.title}</h3>}
                  {item.buttonText && <small style={{backgroundColor:item.buttonBgColor||'#f59e0b',color:item.buttonTextColor||'#111827'}}>{item.buttonText}</small>}
                </div>
              )}
            </button>
          );
        })}
      </section>
      )}

      {sectionVisible('maintenance-products') && (
      <section className="marketplace-section" data-section-key="maintenance-products" data-mobile-display={sectionConfig('maintenance-products')?.mobileDisplayMode || 'grid'} style={sectionStyle('maintenance-products')}>
        <div className="marketplace-section-heading">
          <div>
            <h2>{sectionConfig('maintenance-products')?.title || 'قطعات مصرفی و سرویس دوره‌ای'}</h2>
            <p>{sectionConfig('maintenance-products')?.subtitle || 'انتخاب‌های سریع برای نگهداری اصولی خودرو'}</p>
          </div>
          <button type="button" onClick={() => onNavigate('shop', 'maintenance')}>
            مشاهده همه
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
        <div className="marketplace-product-grid builder-section-grid">
          {serviceParts.slice(0, sectionConfig('maintenance-products')?.maxItems || serviceParts.length).map(product => (
            <ReferenceProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
      )}

      {sectionVisible('testimonials') && (
      <section className="marketplace-testimonials" data-section-key="testimonials" data-mobile-display={sectionConfig('testimonials')?.mobileDisplayMode || 'grid'} style={sectionStyle('testimonials')}>
        <div className="marketplace-section">
          <div className="marketplace-section-heading compact center">
            <div>
              <h2>{sectionConfig('testimonials')?.title ?? ''}</h2>
              <p>{sectionConfig('testimonials')?.subtitle ?? ''}</p>
            </div>
          </div>
          <div className="marketplace-testimonial-grid builder-section-grid">
            {sortedItems('testimonials').map(item => (
              <article key={item.id} style={itemVisualStyle('testimonials', item)}>
                <div className="marketplace-testimonial-head">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.title || 'تصویر مشتری'} />
                  ) : (
                    <span className="marketplace-testimonial-avatar" aria-hidden="true">
                      {(item.title || '؟').trim().slice(0, 1)}
                    </span>
                  )}
                  <div>
                    <small>{item.title || ''}</small>
                    <strong>★★★★★</strong>
                  </div>
                </div>
                <p>{item.content || item.subtitle || ''}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      )}

      {sectionVisible('shipping-banner') && (
      <section className="marketplace-section marketplace-shipping-banner" data-section-key="shipping-banner" data-mobile-display={sectionConfig('shipping-banner')?.mobileDisplayMode || 'grid'} style={sectionStyle('shipping-banner')}>
        <div>
          {!sectionConfig('shipping-banner')?.imageUrl && <Truck className="w-10 h-10" />}
          <span>{sectionConfig('shipping-banner')?.title ?? ''}</span>
          <strong>{sectionConfig('shipping-banner')?.subtitle ?? ''}</strong>
        </div>
        {!sectionConfig('shipping-banner')?.imageUrl && <PackageCheck className="marketplace-shipping-art" />}
      </section>
      )}

      {sectionVisible('articles') && (
      <section className="marketplace-section marketplace-articles" data-section-key="articles" data-mobile-display={sectionConfig('articles')?.mobileDisplayMode || 'grid'} style={sectionStyle('articles')}>
        <div className="marketplace-section-heading">
          <div>
            <h2>{sectionConfig('articles')?.title || 'راهنما و مقالات'}</h2>
            <p>{sectionConfig('articles')?.subtitle || 'آموزش، نگهداری و انتخاب صحیح قطعات خودرو'}</p>
          </div>
          <button type="button" onClick={() => onNavigate('blog')}>
            مشاهده همه
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
        <div className="marketplace-article-grid marketplace-ref-article-grid">
          <div className="marketplace-ref-article-intro">
            <h3>{sectionConfig('articles')?.title || ''}</h3>
            <p>{sectionConfig('articles')?.subtitle || ''}</p>
            {sectionConfig('articles')?.buttonText && <button type="button" onClick={() => goLink(sectionConfig('articles')?.buttonLink)}>{sectionConfig('articles')?.buttonText}</button>}
          </div>
          {articles.slice(0, sectionConfig('articles')?.maxItems || 3).map(article => (
            <button key={article.id} type="button" onClick={() => onNavigate('article', article.slug || article.id)}>
              <img src={article.imageUrl} alt={article.seo?.images?.[article.imageUrl]?.alt || article.title} title={article.seo?.images?.[article.imageUrl]?.title || article.title} />
              <div>
                <span>{article.category}</span>
                <h3>{article.title}</h3>
                <p>{article.summary}</p>
                <small>{article.readTimeMinutes} دقیقه مطالعه</small>
              </div>
            </button>
          ))}
        </div>
      </section>
      )}

      {sectionVisible('service-strip') && (
      <section className="marketplace-service-strip builder-section-grid" data-section-key="service-strip" data-mobile-display={sectionConfig('service-strip')?.mobileDisplayMode || 'grid'} style={sectionStyle('service-strip')}>
        {sortedItems('service-strip').map((item, index) => {
          const icons = [ShieldCheck, Sparkles, Truck, Headphones];
          const Comp = icons[index % icons.length];
          return (
            <div key={item.id} style={itemVisualStyle('service-strip', item)}>
              <Comp className="w-7 h-7" />
              <span>
                <strong>{item.title || ''}</strong>
                <small>{item.content || item.subtitle || ''}</small>
              </span>
            </div>
          );
        })}
      </section>
      )}

      {liveSectionId && (
        <LiveSectionModal
          pageSlug="home"
          sectionId={liveSectionId}
          isOpen={Boolean(liveSectionId)}
          onClose={() => setLiveSectionId(null)}
        />
      )}
    </div>
  );
};
