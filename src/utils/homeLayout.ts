import type { PageSection } from '../types';

export interface HomeLayoutBlock {
  key: string;
  title: string;
  kind: 'slider' | 'banner' | 'section';
}

export const HOME_LAYOUT_BLOCKS: HomeLayoutBlock[] = [
  { key: 'hero', title: 'اسلایدر اصلی', kind: 'slider' },
  { key: 'featured-categories', title: 'دسته‌بندی‌های منتخب', kind: 'section' },
  { key: 'promo-small', title: 'بنرهای کوچک', kind: 'banner' },
  { key: 'featured-products', title: 'محصولات ویژه', kind: 'section' },
  { key: 'wide-banner-1', title: 'بنر عریض میانی', kind: 'banner' },
  { key: 'manufacturers', title: 'برندهای خودرو', kind: 'section' },
  { key: 'parts-brands', title: 'برندهای قطعات', kind: 'section' },
  { key: 'promo-medium', title: 'بنرهای متوسط', kind: 'banner' },
  { key: 'weekly-deals', title: 'پیشنهادهای هفته', kind: 'section' },
  { key: 'promo-large', title: 'بنرهای بزرگ', kind: 'banner' },
  { key: 'maintenance-products', title: 'قطعات سرویس دوره‌ای', kind: 'section' },
  { key: 'testimonials', title: 'نظر مشتریان', kind: 'section' },
  { key: 'shipping-banner', title: 'بنر ارسال', kind: 'section' },
  { key: 'articles', title: 'مقالات', kind: 'section' },
  { key: 'service-strip', title: 'مزیت‌های فروشگاه', kind: 'section' }
];

export const getHomeLayoutBlocks = (sections: PageSection[]): HomeLayoutBlock[] => {
  const blocks = [...HOME_LAYOUT_BLOCKS];
  const known = new Set(blocks.map(block => block.key));
  sections
    .filter(section => Boolean(section.sectionKey) && !known.has(section.sectionKey!))
    .sort((a, b) => a.order - b.order)
    .forEach(section => {
      blocks.push({ key: section.sectionKey!, title: section.title || section.sectionKey!, kind: 'section' });
    });
  return blocks;
};

export const resolveHomeLayoutOrder = (saved: string[] | undefined, sections: PageSection[]): string[] => {
  const available = getHomeLayoutBlocks(sections).map(block => block.key);
  const allowed = new Set(available);
  const savedValid = Array.isArray(saved) ? saved.filter(key => allowed.has(key)) : [];
  return [...new Set([...savedValid, ...available.filter(key => !savedValid.includes(key))])];
};
