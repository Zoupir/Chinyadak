import type { BannerCreative, BannerPlacementConfig, BannerPlacementKey, PageSection, PageSectionItem, SliderItem } from '../types';

export const BANNER_PLACEMENT_META: Array<Pick<BannerPlacementConfig, 'key' | 'title' | 'desktopAspectRatio' | 'mobileAspectRatio' | 'desktopColumns' | 'mobileColumns'>> = [
  { key: 'wide-banner-1', title: 'بنر عریض میانی', desktopAspectRatio: '16 / 4', mobileAspectRatio: '16 / 9', desktopColumns: 1, mobileColumns: 1 },
  { key: 'promo-large', title: 'بنرهای بزرگ', desktopAspectRatio: '16 / 7', mobileAspectRatio: '16 / 9', desktopColumns: 2, mobileColumns: 1 },
  { key: 'promo-medium', title: 'بنرهای متوسط', desktopAspectRatio: '16 / 7', mobileAspectRatio: '16 / 9', desktopColumns: 2, mobileColumns: 1 },
  { key: 'promo-small', title: 'بنرهای کوچک', desktopAspectRatio: '3 / 1', mobileAspectRatio: '16 / 9', desktopColumns: 3, mobileColumns: 1 }
];

const sectionFor = (sections: PageSection[], key: BannerPlacementKey) =>
  sections.find(section => section.sectionKey === key);

const fromLegacyItem = (item: PageSectionItem, index: number, fallbackImage = ''): BannerCreative => ({
  id: item.id || `banner-${Date.now()}-${index}`,
  title: item.title || '',
  subtitle: item.subtitle || item.content || '',
  badge: item.badge || '',
  desktopImageUrl: item.imageUrl || fallbackImage || '',
  mobileImageUrl: '',
  alt: item.title || '',
  link: item.link || 'shop',
  buttonText: item.buttonText || '',
  isVisible: item.isVisible !== false,
  order: item.order || index + 1,
  imageFit: item.imageMode === 'contain' || item.imageFit === 'contain' ? 'contain' : 'cover',
  overlayOpacity: 34,
  textAlignment: item.textAlignment || item.textAlign || 'right',
  titleColor: item.titleColor || item.textColor || '#ffffff',
  subtitleColor: item.subtitleColor || '#ffffff'
});

const fromLegacySlider = (item: SliderItem, index: number): BannerCreative => ({
  id: item.id || `banner-slide-${index}`,
  title: item.title || '',
  subtitle: item.subtitle || '',
  badge: item.tag || '',
  desktopImageUrl: item.imageUrl || '',
  mobileImageUrl: '',
  alt: item.title || '',
  link: item.link || 'shop',
  buttonText: item.buttonText || '',
  isVisible: item.isActive !== false,
  order: item.order || index + 1,
  imageFit: item.imageMode === 'contain' ? 'contain' : 'cover',
  overlayOpacity: item.overlayOpacity ?? 34,
  textAlignment: item.textAlignment || 'right',
  titleColor: item.titleColor || '#ffffff',
  subtitleColor: item.subtitleColor || '#ffffff'
});

export const migrateLegacyBannerPlacements = (
  sections: PageSection[],
  slides: SliderItem[] = []
): BannerPlacementConfig[] => BANNER_PLACEMENT_META.map(meta => {
  const section = sectionFor(sections, meta.key);
  const sourceItems = section?.contentSource === 'sliders'
    ? [...slides].filter(slide => slide.isActive).sort((a, b) => a.order - b.order).map(fromLegacySlider)
    : (section?.items || []).map((item, index) => fromLegacyItem(item, index, section?.imageUrl || ''));
  const items = sourceItems.length
    ? sourceItems
    : section?.imageUrl
      ? [fromLegacyItem({ id: `${section.id}-legacy-image`, title: section.title, imageUrl: section.imageUrl, link: section.buttonLink, buttonText: section.buttonText, order: 1 }, 0)]
      : [];
  return {
    ...meta,
    isVisible: section?.isVisible !== false,
    widthMode: section?.fullWidth || section?.maxWidthPx === 0 ? 'full' : 'container',
    gapPx: section?.gapPx ?? 12,
    items
  };
});

export const resolveBannerPlacements = (
  saved: BannerPlacementConfig[] | undefined,
  sections: PageSection[],
  slides: SliderItem[] = []
): BannerPlacementConfig[] => {
  if (!Array.isArray(saved) || saved.length === 0) return migrateLegacyBannerPlacements(sections, slides);
  const byKey = new Map(saved.map(item => [item.key, item]));
  return BANNER_PLACEMENT_META.map(meta => {
    const existing = byKey.get(meta.key);
    return {
      ...meta,
      ...existing,
      key: meta.key,
      title: existing?.title || meta.title,
      isVisible: existing?.isVisible ?? true,
      widthMode: existing?.widthMode ?? 'container',
      gapPx: existing?.gapPx ?? 12,
      items: [...(existing?.items || [])].sort((a, b) => a.order - b.order)
    };
  });
};

export const findBannerPlacement = (placements: BannerPlacementConfig[], key: BannerPlacementKey) =>
  placements.find(item => item.key === key);

export const createBannerCreative = (order: number): BannerCreative => ({
  id: `banner-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  title: '',
  subtitle: '',
  badge: '',
  desktopImageUrl: '',
  mobileImageUrl: '',
  alt: '',
  link: 'shop',
  buttonText: '',
  isVisible: true,
  order,
  imageFit: 'cover',
  overlayOpacity: 34,
  textAlignment: 'right',
  titleColor: '#ffffff',
  subtitleColor: '#ffffff'
});
