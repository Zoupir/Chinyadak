type AnyRecord = Record<string, any>;

type PublicPayload = {
  mode?: string;
  path?: string;
  entity?: AnyRecord | null;
  bootstrap?: {
    catalog?: { products?: AnyRecord[]; total?: number };
    categories?: { categories?: AnyRecord[] };
    vehicles?: { brands?: AnyRecord[]; models?: AnyRecord[] };
    cms?: {
      articles?: AnyRecord[];
      sliders?: AnyRecord[];
      pages?: AnyRecord[];
      settings?: AnyRecord | null;
    };
  };
};

const ROOT_START = '<div id="root" data-server-rendered="1">';
const PAYLOAD_START = '<script id="__YADAK_SERVER_ROUTE__" type="application/json">';
const PRIVATE_PREFIXES = ['/admin','/account','/checkout','/tracking','/invoice','/compare','/part-request','/cart','/wishlist'];

export const isPrivateStorefrontPath = (pathname: string): boolean => {
  const clean = String(pathname || '/').split('?')[0].replace(/\/+$/, '') || '/';
  return PRIVATE_PREFIXES.some(prefix => clean === prefix || clean.startsWith(prefix + '/'));
};

const esc = (value: unknown): string => String(value ?? '')
  .replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/'/g, '&#039;');

const safeUrl = (value: unknown): string => {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  if (raw.startsWith('/')) return raw;
  try {
    const parsed = new URL(raw);
    return ['http:', 'https:', 'tel:', 'mailto:'].includes(parsed.protocol) ? parsed.toString() : '';
  } catch { return ''; }
};

const safeColor = (value: unknown, fallback: string): string => {
  const raw = String(value ?? '').trim();
  return /^(#[0-9a-f]{3,8}|rgb(a)?\([^)]+\)|hsl(a)?\([^)]+\)|[a-z]{3,20})$/i.test(raw) ? raw : fallback;
};

const linkToHref = (value: unknown): string => {
  const raw = String(value ?? '').trim();
  if (!raw) return '#';
  const absolute = safeUrl(raw);
  if (absolute) return absolute;
  const [kind, ...rest] = raw.split(':');
  const param = rest.join(':');
  const routes: Record<string, string> = {
    home: '/', shop: '/shop', blog: '/blog', about: '/about', guarantee: '/guarantee',
    category: `/category/${encodeURIComponent(param)}`,
    product: `/product/${encodeURIComponent(param)}`,
    article: `/article/${encodeURIComponent(param)}`,
    'car-brand': `/brand/${encodeURIComponent(param)}`,
    brand: `/brand/${encodeURIComponent(param)}`,
    'car-model': `/car-model/${encodeURIComponent(param)}`,
    model: `/car-model/${encodeURIComponent(param)}`,
    page: `/page/${encodeURIComponent(param)}`
  };
  return routes[kind] || (raw.startsWith('/') ? raw : `/${encodeURIComponent(raw)}`);
};

const imageOf = (item: AnyRecord): string => safeUrl(item?.imageUrl || item?.desktopImageUrl || item?.images?.[0] || item?.logo || item?.iconUrl || item?.image);
const titleOf = (item: AnyRecord, fallback = ''): string => String(item?.title || item?.nameFa || item?.nameEn || fallback);
const money = (value: unknown): string => {
  const number = Number(value || 0);
  return Number.isFinite(number) && number > 0 ? `${new Intl.NumberFormat('fa-IR').format(number)} تومان` : 'استعلام قیمت';
};

const parsePayload = (html: string): PublicPayload | null => {
  const start = html.indexOf(PAYLOAD_START);
  if (start < 0) return null;
  const contentStart = start + PAYLOAD_START.length;
  const end = html.indexOf('</script>', contentStart);
  if (end < 0) return null;
  try { return JSON.parse(html.slice(contentStart, end)) as PublicPayload; } catch { return null; }
};

const homePage = (payload: PublicPayload): AnyRecord | undefined =>
  payload.bootstrap?.cms?.pages?.find((page: AnyRecord) => page?.slug === 'home');

const sectionFor = (payload: PublicPayload, key: string): AnyRecord | undefined =>
  homePage(payload)?.sections?.find((section: AnyRecord) => section?.sectionKey === key);

const visibleSection = (payload: PublicPayload, key: string): boolean => sectionFor(payload, key)?.isVisible !== false;

const sourceItems = (payload: PublicPayload, section: AnyRecord | undefined): AnyRecord[] => {
  const source = String(section?.contentSource || 'manual');
  const max = Math.max(1, Math.min(100, Number(section?.contentSourceLimit || section?.maxItems || 12)));
  const products = payload.bootstrap?.catalog?.products || [];
  const categories = payload.bootstrap?.categories?.categories || [];
  const brands = payload.bootstrap?.vehicles?.brands || [];
  const articles = payload.bootstrap?.cms?.articles || [];
  const sliders = payload.bootstrap?.cms?.sliders || [];
  if (source === 'categories') return categories.slice(0, max).map((item, i) => ({ ...item, title: item.nameFa, imageUrl: item.iconUrl || item.imageUrl, link: `category:${item.slug}`, order: i + 1 }));
  if (source === 'brands') return brands.slice(0, max).map((item, i) => ({ ...item, title: item.nameFa, imageUrl: item.logo, link: `brand:${item.slug || item.id}`, order: i + 1 }));
  if (source === 'products') return products.slice(0, max).map((item, i) => ({ ...item, title: item.nameFa, imageUrl: item.images?.[0], link: `product:${item.slug || item.id}`, order: i + 1 }));
  if (source === 'articles') return articles.slice(0, max).map((item, i) => ({ ...item, title: item.title, imageUrl: item.imageUrl, link: `article:${item.slug || item.id}`, order: i + 1 }));
  if (source === 'sliders') return sliders.filter(item => item?.isActive !== false).sort((a, b) => Number(a.order || 0) - Number(b.order || 0)).slice(0, max);
  return [...(section?.items || [])].filter(item => item?.isVisible !== false).sort((a, b) => Number(a.order || 0) - Number(b.order || 0)).slice(0, max);
};

const renderServerProduct = (product: AnyRecord): string => {
  const image = imageOf(product);
  const title = titleOf(product, 'قطعه خودرو');
  const href = `/product/${encodeURIComponent(String(product.slug || product.id || ''))}`;
  const price = product.discountPrice ?? product.price;
  return `<article class="yn-product-card">
    <a class="yn-product-image" href="${esc(href)}">${image ? `<img src="${esc(image)}" alt="${esc(product?.seo?.images?.[image]?.alt || title)}" width="320" height="240" loading="lazy">` : '<span class="yn-image-placeholder" aria-hidden="true"></span>'}</a>
    <div class="yn-product-copy"><div class="yn-product-meta">${product.isBestSeller ? '<span>پرفروش</span>' : ''}${product.brandManufacturer ? `<small>${esc(product.brandManufacturer)}</small>` : ''}</div>
    <a class="yn-product-title" href="${esc(href)}">${esc(title)}</a>
    ${product.oemNumber ? `<small class="yn-oem">OEM: ${esc(product.oemNumber)}</small>` : ''}
    <div class="yn-product-bottom"><strong>${esc(money(price))}</strong><a href="${esc(href)}">مشاهده</a></div></div>
  </article>`;
};

const renderProducts = (products: AnyRecord[], title: string, subtitle = '', variant = ''): string => {
  if (!products.length) return '';
  return `<section class="yn-section yn-products-section ${esc(variant)}"><div class="yn-heading"><div><h2>${esc(title)}</h2>${subtitle ? `<p>${esc(subtitle)}</p>` : ''}</div><a href="/shop">مشاهده همه</a></div><div class="yn-product-grid">${products.map(renderServerProduct).join('')}</div></section>`;
};

const renderHero = (payload: PublicPayload): string => {
  const section = sectionFor(payload, 'hero');
  const slides = (payload.bootstrap?.cms?.sliders || []).filter(item => item?.isActive !== false).sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
  const active = slides.length ? slides : [{ title: section?.title || 'قطعات مطمئن برای خودروی شما', subtitle: section?.subtitle || 'فروش تخصصی قطعات خودروهای چینی با تضمین اصالت و فیتمنت دقیق.', imageUrl: section?.imageUrl, link: section?.buttonLink || 'shop', buttonText: section?.buttonText || 'مشاهده فروشگاه' }];
  const brands = payload.bootstrap?.vehicles?.brands || [];
  return `<section class="yn-hero" data-yadak-slider>
    <div class="yn-hero-stage">${active.map((slide, index) => {
      const image = imageOf(slide);
      const style = image ? ` style="background-image:linear-gradient(90deg,rgba(4,22,40,.08),rgba(4,22,40,.48)),url('${esc(image)}')"` : '';
      return `<article class="yn-slide" data-slide="${index}"${index ? ' hidden' : ''}${style}><div class="yn-slide-copy">${slide.tag ? `<span>${esc(slide.tag)}</span>` : ''}<h1>${esc(slide.title || section?.title || 'فروشگاه تخصصی قطعات خودروهای چینی')}</h1><p>${esc(slide.subtitle || section?.subtitle || '')}</p><a href="${esc(linkToHref(slide.link || section?.buttonLink || 'shop'))}">${esc(slide.buttonText || section?.buttonText || 'مشاهده فروشگاه')}</a></div></article>`;
    }).join('')}
    ${active.length > 1 ? `<div class="yn-slider-controls"><button type="button" data-slider-prev aria-label="اسلاید قبلی">‹</button><div>${active.map((_, i) => `<button type="button" data-slider-dot="${i}" aria-label="اسلاید ${i + 1}"${i === 0 ? ' aria-current="true"' : ''}></button>`).join('')}</div><button type="button" data-slider-next aria-label="اسلاید بعدی">›</button></div>` : ''}</div>
    <aside class="yn-finder"><h2>خودروی خود را انتخاب کنید</h2><p>برای دسترسی سریع به قطعات سازگار</p><div class="yn-finder-links">${brands.slice(0, 6).map(brand => `<a href="/brand/${encodeURIComponent(String(brand.slug || brand.id))}">${esc(brand.nameFa || brand.nameEn)}</a>`).join('')}</div><a class="yn-finder-cta" href="/shop">مشاهده کاتالوگ</a></aside>
  </section>`;
};

const renderCategories = (payload: PublicPayload): string => {
  const section = sectionFor(payload, 'featured-categories');
  const sourced = sourceItems(payload, section);
  const categories = sourced.length ? sourced : (payload.bootstrap?.categories?.categories || []).slice(0, Number(section?.maxItems || 12));
  if (!categories.length) return '';
  return `<section class="yn-section yn-category-section"><div class="yn-heading"><div><h2>${esc(section?.title || 'دسته‌بندی‌های تخصصی قطعات یدکی')}</h2>${section?.subtitle ? `<p>${esc(section.subtitle)}</p>` : ''}</div><a href="/shop">همه دسته‌ها</a></div><div class="yn-category-grid">${categories.map(item => {
    const href = item.link ? linkToHref(item.link) : `/category/${encodeURIComponent(String(item.slug || item.id))}`;
    const image = imageOf(item);
    return `<a class="yn-category-card" href="${esc(href)}">${image ? `<img src="${esc(image)}" alt="${esc(titleOf(item))}" width="88" height="88" loading="lazy">` : '<span class="yn-category-placeholder">⚙</span>'}<strong>${esc(titleOf(item))}</strong>${item.description ? `<small>${esc(item.description)}</small>` : ''}</a>`;
  }).join('')}</div></section>`;
};

const renderBrands = (payload: PublicPayload): string => {
  const section = sectionFor(payload, 'manufacturers');
  const sourced = sourceItems(payload, section);
  const brands = sourced.length ? sourced : (payload.bootstrap?.vehicles?.brands || []);
  if (!brands.length) return '';
  return `<section class="yn-section"><div class="yn-heading"><h2>${esc(section?.title || 'برند قطعات بر اساس برند خودرو')}</h2></div><div class="yn-brand-grid">${brands.slice(0, Number(section?.maxItems || 12)).map(item => { const image = imageOf(item); const href = item.link ? linkToHref(item.link) : `/brand/${encodeURIComponent(String(item.slug || item.id))}`; return `<a href="${esc(href)}">${image ? `<img src="${esc(image)}" alt="${esc(titleOf(item))}" width="112" height="72" loading="lazy">` : ''}<span>${esc(titleOf(item))}</span></a>`; }).join('')}</div></section>`;
};

const renderPartsBrands = (payload: PublicPayload): string => {
  const settings = payload.bootstrap?.cms?.settings || {};
  const section = sectionFor(payload, 'parts-brands');
  const items = (settings.popularPartsBrands || []).filter((item: AnyRecord) => item?.isVisible !== false).slice(0, Number(section?.maxItems || 12));
  if (!items.length) return '';
  return `<section class="yn-section yn-parts-brands"><div class="yn-heading"><h2>${esc(section?.title || 'برندهای محبوب قطعات')}</h2></div><div class="yn-parts-brand-grid">${items.map((item: AnyRecord) => `<a href="${esc(linkToHref(item.link || 'shop'))}">${item.imageUrl ? `<img src="${esc(safeUrl(item.imageUrl))}" alt="${esc(item.title)}" loading="lazy">` : ''}<strong>${esc(item.title)}</strong></a>`).join('')}</div></section>`;
};

const renderBannerPlacement = (payload: PublicPayload, key: string): string => {
  if (!visibleSection(payload, key)) return '';
  const settings = payload.bootstrap?.cms?.settings || {};
  const placement = (settings.bannerPlacements || []).find((item: AnyRecord) => item?.key === key && item?.isVisible !== false);
  let items = (placement?.items || []).filter((item: AnyRecord) => item?.isVisible !== false).sort((a: AnyRecord, b: AnyRecord) => Number(a.order || 0) - Number(b.order || 0));
  if (!items.length) {
    const section = sectionFor(payload, key);
    items = sourceItems(payload, section);
    if (!items.length && section?.imageUrl) items = [{ title: section.title, subtitle: section.subtitle, desktopImageUrl: section.imageUrl, link: section.buttonLink, buttonText: section.buttonText }];
  }
  if (!items.length) return '';
  return `<section class="yn-banners yn-banners-${esc(key)}">${items.map((item: AnyRecord) => { const image = imageOf(item); return `<a href="${esc(linkToHref(item.link || 'shop'))}" class="yn-banner">${image ? `<img src="${esc(image)}" alt="${esc(item.alt || item.title || '')}" loading="lazy">` : ''}${item.title || item.subtitle ? `<span><strong>${esc(item.title || '')}</strong>${item.subtitle ? `<small>${esc(item.subtitle)}</small>` : ''}</span>` : ''}</a>`; }).join('')}</section>`;
};

const renderTestimonials = (payload: PublicPayload): string => {
  const section = sectionFor(payload, 'testimonials');
  const items = sourceItems(payload, section);
  if (!items.length || section?.isVisible === false) return '';
  return `<section class="yn-section yn-testimonials"><div class="yn-heading"><div><h2>${esc(section?.title || 'نظر مشتریان ما')}</h2>${section?.subtitle ? `<p>${esc(section.subtitle)}</p>` : ''}</div></div><div class="yn-testimonial-grid">${items.map(item => `<article><strong>${esc(item.title || '')}</strong><span>★★★★★</span><p>${esc(item.content || item.subtitle || '')}</p></article>`).join('')}</div></section>`;
};

const renderArticles = (payload: PublicPayload): string => {
  const section = sectionFor(payload, 'articles');
  const articles = (payload.bootstrap?.cms?.articles || []).slice(0, Number(section?.maxItems || 3));
  if (!articles.length || section?.isVisible === false) return '';
  return `<section class="yn-section yn-articles"><div class="yn-heading"><div><h2>${esc(section?.title || 'راهنما و مقالات')}</h2>${section?.subtitle ? `<p>${esc(section.subtitle)}</p>` : ''}</div><a href="/blog">مشاهده همه</a></div><div class="yn-article-grid">${articles.map(article => { const image = imageOf(article); const href = `/article/${encodeURIComponent(String(article.slug || article.id || ''))}`; return `<article><a href="${esc(href)}">${image ? `<img src="${esc(image)}" alt="${esc(article.title || '')}" loading="lazy">` : ''}<div><small>${esc(article.category || '')}</small><h3>${esc(article.title || '')}</h3><p>${esc(article.summary || '')}</p></div></a></article>`; }).join('')}</div></section>`;
};

const renderServiceStrip = (payload: PublicPayload): string => {
  const section = sectionFor(payload, 'service-strip');
  const items = sourceItems(payload, section);
  if (!items.length || section?.isVisible === false) return '';
  return `<section class="yn-service-strip">${items.map(item => `<div><strong>${esc(item.title || '')}</strong><small>${esc(item.content || item.subtitle || '')}</small></div>`).join('')}</section>`;
};

const renderHome = (payload: PublicPayload): string => {
  const products = payload.bootstrap?.catalog?.products || [];
  const featured = products.filter(item => item?.isFeatured);
  const best = products.filter(item => item?.isBestSeller);
  const maintenance = products.filter(item => item?.isMaintenancePart);
  const take = (preferred: AnyRecord[], count = 8) => {
    const seen = new Set<string>();
    return [...preferred, ...products].filter(item => { const id = String(item?.id || item?.slug || ''); if (!id || seen.has(id)) return false; seen.add(id); return true; }).slice(0, count);
  };
  const blocks: Record<string, () => string> = {
    hero: () => visibleSection(payload, 'hero') ? renderHero(payload) : '',
    'featured-categories': () => visibleSection(payload, 'featured-categories') ? renderCategories(payload) : '',
    'promo-small': () => renderBannerPlacement(payload, 'promo-small'),
    'featured-products': () => visibleSection(payload, 'featured-products') ? renderProducts(take(featured), sectionFor(payload, 'featured-products')?.title || 'محصولات ویژه', sectionFor(payload, 'featured-products')?.subtitle || 'محصولات منتخب، جدید و پرفروش فروشگاه', 'yn-featured-products') : '',
    'wide-banner-1': () => renderBannerPlacement(payload, 'wide-banner-1'),
    manufacturers: () => visibleSection(payload, 'manufacturers') ? renderBrands(payload) : '',
    'parts-brands': () => visibleSection(payload, 'parts-brands') ? renderPartsBrands(payload) : '',
    'promo-medium': () => renderBannerPlacement(payload, 'promo-medium'),
    'weekly-deals': () => visibleSection(payload, 'weekly-deals') ? renderProducts(take(best), sectionFor(payload, 'weekly-deals')?.title || 'بهترین پیشنهادهای این هفته', sectionFor(payload, 'weekly-deals')?.subtitle || 'فرصت محدود برای خرید قطعات منتخب', 'yn-weekly-deals') : '',
    'promo-large': () => renderBannerPlacement(payload, 'promo-large'),
    'maintenance-products': () => visibleSection(payload, 'maintenance-products') ? renderProducts(take(maintenance), sectionFor(payload, 'maintenance-products')?.title || 'قطعات مصرفی و سرویس دوره‌ای', sectionFor(payload, 'maintenance-products')?.subtitle || '', 'yn-maintenance-products') : '',
    testimonials: () => renderTestimonials(payload),
    'shipping-banner': () => { const s = sectionFor(payload, 'shipping-banner'); return s?.isVisible === false ? '' : `<section class="yn-shipping"><span>📦</span><div><strong>${esc(s?.title || 'ارسال سریع')}</strong><small>${esc(s?.subtitle || 'ارسال مطمئن سفارش‌ها به سراسر کشور')}</small></div></section>`; },
    articles: () => renderArticles(payload),
    'service-strip': () => renderServiceStrip(payload)
  };
  const defaults = ['hero','featured-categories','promo-small','featured-products','wide-banner-1','manufacturers','parts-brands','promo-medium','weekly-deals','promo-large','maintenance-products','testimonials','shipping-banner','articles','service-strip'];
  const requested = Array.isArray(payload.bootstrap?.cms?.settings?.homeLayoutOrder) ? payload.bootstrap!.cms!.settings!.homeLayoutOrder : [];
  const order = [...new Set([...requested.filter((key: string) => blocks[key]), ...defaults])];
  return `<main class="yn-home" data-yadak-server-route="home">${order.map(key => blocks[key]?.() || '').join('')}</main>`;
};

const menuItems = (payload: PublicPayload): AnyRecord[] => {
  const settings = payload.bootstrap?.cms?.settings || {};
  const configured = (settings.headerMenus || settings.navigationMenus || []).filter((item: AnyRecord) => item?.isVisible !== false && !item?.parentId);
  if (configured.length) return configured.slice(0, 14);
  return [
    { title: 'فروشگاه', link: 'shop' },
    ...(payload.bootstrap?.categories?.categories || []).slice(0, 7).map((cat: AnyRecord) => ({ title: cat.nameFa || cat.nameEn, link: `category:${cat.slug || cat.id}` })),
    { title: 'مجله', link: 'blog' }
  ];
};

const renderHeader = (payload: PublicPayload): string => {
  const settings = payload.bootstrap?.cms?.settings || {};
  const title = String(settings.siteTitle || 'یدک استور').split('|')[0].trim();
  const logo = safeUrl(settings.logoUrl);
  const announcement = String(settings.announcementText || '').trim();
  const phone = String(settings.contactPhone || '').trim();
  return `<header class="yn-header">${announcement ? `<div class="yn-announcement">${esc(announcement)}</div>` : ''}<div class="yn-header-main"><a class="yn-brand" href="/">${logo ? `<img src="${esc(logo)}" alt="${esc(title)}" width="${Math.max(110, Math.min(280, Number(settings.logoWidthPx || 165)))}" height="58">` : `<strong>${esc(title)}</strong>`}</a><form class="yn-search" action="/shop" method="get"><input type="search" name="q" placeholder="جستجو در میان قطعات، کد فنی، برند و خودرو" aria-label="جستجو"><button type="submit">جستجو</button></form><div class="yn-header-actions"><a class="yn-hot" href="/part-request">درخواست قطعه</a><a href="/account">حساب کاربری</a>${phone ? `<a href="tel:${esc(phone.replace(/[^+\d]/g, ''))}">${esc(phone)}</a>` : ''}</div></div><div class="yn-nav-shell"><a class="yn-category-button" href="/shop">☰ همه دسته‌بندی‌ها</a><nav class="yn-nav" aria-label="منوی اصلی">${menuItems(payload).map(item => `<a href="${esc(linkToHref(item.link || item.url || ''))}">${esc(item.title || item.originalTitle || '')}</a>`).join('')}</nav></div></header>`;
};

const renderFooter = (payload: PublicPayload): string => {
  const settings = payload.bootstrap?.cms?.settings || {};
  const title = String(settings.siteTitle || 'یدک استور').split('|')[0].trim();
  const columns = (settings.footerColumns || []).slice(0, 4);
  const about = settings.footerAboutText || settings.siteSlogan || 'فروشگاه تخصصی قطعات خودرو';
  return `<footer class="yn-footer"><div class="yn-footer-grid"><div class="yn-footer-about"><strong>${esc(settings.footerAboutTitle || title)}</strong><p>${esc(about)}</p>${settings.contactPhone ? `<a href="tel:${esc(String(settings.contactPhone).replace(/[^+\d]/g, ''))}">${esc(settings.contactPhone)}</a>` : ''}${settings.supportEmail ? `<a href="mailto:${esc(settings.supportEmail)}">${esc(settings.supportEmail)}</a>` : ''}</div>${columns.length ? columns.map((column: AnyRecord) => `<nav><strong>${esc(column.title || '')}</strong>${(column.links || []).filter((item: AnyRecord) => item?.title).map((item: AnyRecord) => `<a href="${esc(linkToHref(item.url || '#'))}">${esc(item.title)}</a>`).join('')}</nav>`).join('') : `<nav><strong>دسترسی سریع</strong><a href="/shop">فروشگاه</a><a href="/blog">مجله</a><a href="/about">درباره ما</a><a href="/guarantee">ضمانت و اصالت</a></nav>`}</div><div class="yn-footer-bottom">${esc(settings.footerCopyrightText || settings.footerCopyright || `© ${title}`)}</div></footer>`;
};

const normalCss = `<style id="yadak-normal-storefront-style">
:root[data-render-mode="website"]{--yn-primary:#f59e0b;--yn-dark:#0f2942;--yn-bg:#f4f6f8;--yn-text:#172033;--yn-max:1780px}#root[data-server-rendered="1"]{background:var(--yn-bg);color:var(--yn-text);font-family:Vazirmatn,system-ui,sans-serif;direction:rtl;min-height:100vh}.yn-header{background:#fff;box-shadow:0 1px 0 #e5e7eb;position:relative;z-index:5}.yn-announcement{background:#0d3f68;color:#fff;text-align:center;padding:7px 16px;font-size:.76rem}.yn-header-main{max-width:var(--yn-max);margin:auto;display:grid;grid-template-columns:auto minmax(320px,1fr) auto;align-items:center;gap:18px;padding:10px 18px;background:#0b5f96}.yn-brand{display:flex;align-items:center;color:#fff;text-decoration:none}.yn-brand img{max-height:56px;width:auto;object-fit:contain}.yn-search{display:flex;min-width:0;background:#fff;border-radius:6px;overflow:hidden;border:1px solid #d7dde3}.yn-search input{border:0;outline:0;min-width:0;flex:1;padding:11px 13px;font:inherit;font-size:.79rem}.yn-search button{border:0;background:#f59e0b;color:#151515;font-weight:900;padding:0 18px;cursor:pointer}.yn-header-actions{display:flex;gap:8px;align-items:center}.yn-header-actions a{padding:9px 11px;border:1px solid #ffffff3d;border-radius:6px;text-decoration:none;color:#fff;font-size:.74rem;font-weight:800;white-space:nowrap}.yn-header-actions .yn-hot{background:#ef6c24;border-color:#ef6c24}.yn-nav-shell{background:#fff;border-top:1px solid #edf0f3;display:flex;align-items:stretch;justify-content:center}.yn-category-button{background:#f5a000;color:#111827;text-decoration:none;font-size:.78rem;font-weight:900;padding:10px 18px;white-space:nowrap}.yn-nav{max-width:var(--yn-max);display:flex;justify-content:center;gap:22px;overflow:auto;padding:10px 18px;white-space:nowrap;scrollbar-width:none}.yn-nav a{color:#273647;text-decoration:none;font-size:.76rem;font-weight:800}.yn-home{display:flex;flex-direction:column;gap:24px;padding-bottom:0}.yn-hero{position:relative;width:100%;max-width:none;margin:0 auto;min-height:455px}.yn-hero-stage{min-height:455px;overflow:hidden;background:#0b78be}.yn-slide{min-height:455px;background-size:cover;background-position:center;position:relative}.yn-slide-copy{position:absolute;right:43%;top:50%;transform:translateY(-50%);max-width:45%;color:#fff;text-shadow:0 1px 3px #0006}.yn-slide-copy>span{display:inline-block;background:#10a63a;color:#fff;padding:5px 12px;border-radius:4px;font-size:.72rem;font-weight:900}.yn-slide-copy h1{font-size:clamp(2rem,3.1vw,3.35rem);margin:12px 0;line-height:1.45}.yn-slide-copy p{line-height:2;margin:0 0 18px;font-size:.9rem}.yn-slide-copy>a,.yn-finder-cta{display:inline-flex;background:#f59e0b;color:#111827;border-radius:5px;padding:10px 18px;text-decoration:none;font-weight:900}.yn-finder{position:absolute;left:max(40px,calc((100vw - var(--yn-max))/2 + 24px));top:50%;transform:translateY(-50%);width:300px;background:#fff;border-radius:10px;padding:18px;box-shadow:0 12px 35px #0f172a32}.yn-finder h2{font-size:1rem;margin:0 0 4px}.yn-finder p{font-size:.73rem;color:#6b7280;margin:0}.yn-finder-links{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin:13px 0}.yn-finder-links a{border:1px solid #e5e7eb;border-radius:5px;padding:8px;text-align:center;color:#374151;text-decoration:none;font-size:.72rem}.yn-finder-cta{width:100%;justify-content:center}.yn-slider-controls{position:absolute;bottom:14px;right:50%;transform:translateX(50%);display:flex;align-items:center;gap:10px}.yn-slider-controls>button{width:31px;height:31px;border:0;border-radius:50%;background:#fff;color:#111;font-size:1.25rem}.yn-slider-controls>div{display:flex;gap:6px}.yn-slider-controls [data-slider-dot]{width:9px;height:9px;border:0;border-radius:50%;background:#ffffff80;padding:0}.yn-slider-controls [aria-current="true"]{background:#fff}.yn-section,.yn-banners,.yn-shipping{max-width:var(--yn-max);width:calc(100% - 24px);margin:0 auto}.yn-heading{display:flex;align-items:end;justify-content:space-between;gap:14px;margin-bottom:13px}.yn-heading h2{font-size:1.08rem;margin:0}.yn-heading p{font-size:.75rem;color:#6b7280;margin:4px 0 0}.yn-heading>a{font-size:.74rem;color:#0d5d92;text-decoration:none;font-weight:800}.yn-category-section{padding-top:12px}.yn-category-grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:7px}.yn-category-card{background:#fff;border:1px solid #e5e7eb;border-radius:4px;text-decoration:none;color:#1f2937;padding:10px 6px;text-align:center;min-width:0}.yn-category-card img,.yn-category-placeholder{width:64px;height:64px;object-fit:contain;display:flex;margin:0 auto 6px;align-items:center;justify-content:center}.yn-category-card strong{font-size:.69rem;line-height:1.45;display:block}.yn-category-card small{font-size:.56rem;color:#7c8794;display:block;margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.yn-product-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.yn-product-card{display:grid;grid-template-columns:118px 1fr;background:#fff;border:1px solid #e5e7eb;border-radius:11px;overflow:hidden;min-width:0}.yn-product-image{padding:8px;display:flex}.yn-product-image img,.yn-image-placeholder{width:100%;height:100%;min-height:116px;object-fit:contain;background:#f8fafc;border-radius:7px}.yn-product-copy{padding:10px 9px 10px 4px;display:flex;flex-direction:column;min-width:0}.yn-product-meta{display:flex;gap:6px;align-items:center;font-size:.61rem}.yn-product-meta span{background:#f5a000;padding:2px 5px;border-radius:3px}.yn-product-meta small,.yn-oem{color:#6b7280}.yn-product-title{color:#111827;text-decoration:none;font-size:.76rem;font-weight:800;line-height:1.7;margin:6px 0}.yn-oem{font-size:.62rem}.yn-product-bottom{display:flex;align-items:end;justify-content:space-between;gap:8px;margin-top:auto}.yn-product-bottom strong{font-size:.76rem;color:#e25023}.yn-product-bottom a{font-size:.64rem;color:#0d5d92;text-decoration:none}.yn-weekly-deals{max-width:none!important;width:100%!important;background:linear-gradient(90deg,#ef6c00,#f58d00);padding:25px max(12px,calc((100vw - var(--yn-max))/2));box-sizing:border-box}.yn-weekly-deals .yn-heading h2,.yn-weekly-deals .yn-heading p,.yn-weekly-deals .yn-heading>a{color:#fff}.yn-weekly-deals .yn-product-card{border-color:#fff;background:#fff}.yn-banners{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.yn-banners-wide-banner-1{grid-template-columns:1fr;max-width:none;width:100%}.yn-banners-promo-small{grid-template-columns:repeat(3,minmax(0,1fr))}.yn-banner{position:relative;min-height:150px;border-radius:9px;overflow:hidden;background:#e5e7eb;display:block}.yn-banners-wide-banner-1 .yn-banner{border-radius:0;min-height:370px}.yn-banner img{width:100%;height:100%;max-height:390px;object-fit:cover;display:block}.yn-banner>span{position:absolute;right:18px;bottom:15px;color:#fff;text-shadow:0 1px 4px #000;background:#0005;padding:8px 10px;border-radius:6px}.yn-banner>span strong,.yn-banner>span small{display:block}.yn-brand-grid,.yn-parts-brand-grid{display:grid;grid-template-columns:repeat(10,minmax(0,1fr));gap:8px}.yn-brand-grid a,.yn-parts-brand-grid a{background:#fff;border:1px solid #e5e7eb;border-radius:3px;padding:8px;text-decoration:none;color:#374151;text-align:center;min-height:82px;display:flex;flex-direction:column;align-items:center;justify-content:center}.yn-brand-grid img,.yn-parts-brand-grid img{max-width:100%;height:48px;object-fit:contain;margin-bottom:5px}.yn-brand-grid span,.yn-parts-brand-grid strong{font-size:.65rem}.yn-parts-brands{padding-top:3px}.yn-testimonials{max-width:none!important;width:100%!important;background:#eaf5fb;padding:28px max(12px,calc((100vw - var(--yn-max))/2));box-sizing:border-box}.yn-testimonial-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.yn-testimonial-grid article{background:#fff;border:1px solid #dbe6ee;border-radius:6px;padding:15px}.yn-testimonial-grid span{color:#f59e0b;display:block}.yn-testimonial-grid p{font-size:.73rem;color:#6b7280;line-height:1.9}.yn-shipping{display:flex;align-items:center;gap:15px;background:linear-gradient(90deg,#ffd769,#f5a000);padding:20px 28px;border-radius:6px}.yn-shipping>span{font-size:2rem}.yn-shipping strong,.yn-shipping small{display:block}.yn-article-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.yn-article-grid article{background:#fff;border:1px solid #e5e7eb;border-radius:7px;overflow:hidden}.yn-article-grid a{text-decoration:none;color:#1f2937}.yn-article-grid img{width:100%;aspect-ratio:16/9;object-fit:cover}.yn-article-grid article div{padding:13px}.yn-article-grid small{color:#e25023}.yn-article-grid h3{font-size:.86rem;line-height:1.7;margin:6px 0}.yn-article-grid p{font-size:.7rem;line-height:1.8;color:#6b7280}.yn-service-strip{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));background:#08ae40;color:#fff;overflow:hidden;width:100%;margin:0}.yn-service-strip>div{padding:17px;text-align:center;border-left:1px solid #ffffff33}.yn-service-strip strong,.yn-service-strip small{display:block}.yn-service-strip small{font-size:.69rem;opacity:.9}.yn-footer{background:#111;color:#fff;padding:42px max(20px,calc((100vw - var(--yn-max))/2)) 18px}.yn-footer-grid{display:grid;grid-template-columns:1.5fr repeat(3,1fr);gap:32px}.yn-footer strong{font-weight:900}.yn-footer p{font-size:.75rem;line-height:2;color:#cbd5e1}.yn-footer a{display:block;color:#e5e7eb;text-decoration:none;font-size:.73rem;margin-top:8px}.yn-footer-bottom{border-top:1px solid #ffffff18;margin-top:28px;padding-top:16px;text-align:center;color:#8f98a4;font-size:.68rem}.ys-main{background:#f4f6f8}.ys-header{display:none}.ys-footer{display:none}@media(max-width:1200px){.yn-header-main{grid-template-columns:auto 1fr}.yn-header-actions{grid-column:1/-1;justify-content:center}.yn-category-grid{grid-template-columns:repeat(6,minmax(0,1fr))}.yn-product-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.yn-brand-grid,.yn-parts-brand-grid{grid-template-columns:repeat(5,minmax(0,1fr))}.yn-slide-copy{right:35%;max-width:55%}.yn-finder{width:270px;left:16px}.yn-testimonial-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.yn-footer-grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:760px){.yn-header-main{display:flex;flex-wrap:wrap;padding:9px 12px}.yn-brand{order:1}.yn-header-actions{order:2;margin-inline-start:auto}.yn-header-actions a:not(.yn-hot){display:none}.yn-search{order:3;width:100%}.yn-nav-shell{overflow:auto;justify-content:flex-start}.yn-category-button{display:none}.yn-nav{justify-content:flex-start}.yn-hero{min-height:auto}.yn-hero-stage,.yn-slide{min-height:350px}.yn-slide-copy{right:16px;left:16px;top:24%;transform:none;max-width:none}.yn-slide-copy h1{font-size:1.55rem}.yn-finder{position:relative;left:auto;top:auto;transform:none;width:auto;margin:-78px 12px 0;z-index:3}.yn-category-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.yn-product-grid{grid-template-columns:1fr}.yn-product-card{grid-template-columns:112px 1fr}.yn-banners,.yn-banners-promo-small{grid-template-columns:1fr}.yn-banners-wide-banner-1 .yn-banner{min-height:230px}.yn-brand-grid,.yn-parts-brand-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.yn-article-grid{grid-template-columns:1fr}.yn-service-strip{grid-template-columns:repeat(2,minmax(0,1fr))}.yn-footer-grid{grid-template-columns:1fr}.yn-testimonial-grid{grid-template-columns:1fr 1fr}}@media(max-width:460px){.yn-category-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.yn-brand-grid,.yn-parts-brand-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.yn-testimonial-grid{grid-template-columns:1fr}.yn-service-strip{grid-template-columns:1fr}}
</style>`;

const replaceRootChrome = (html: string, payload: PublicPayload): string => {
  const rootStart = html.indexOf(ROOT_START);
  const payloadStart = html.indexOf(PAYLOAD_START);
  if (rootStart < 0 || payloadStart < 0 || payloadStart <= rootStart) return html;
  const beforeRoot = html.slice(0, rootStart);
  const oldRoot = html.slice(rootStart, payloadStart);
  const afterRoot = html.slice(payloadStart);
  let main = '';
  if ((payload.path || '/') === '/') main = renderHome(payload);
  else {
    const mainStart = oldRoot.indexOf('<main ');
    const mainEnd = oldRoot.lastIndexOf('</main>');
    main = mainStart >= 0 && mainEnd > mainStart ? oldRoot.slice(mainStart, mainEnd + 7) : oldRoot;
  }
  const settings = payload.bootstrap?.cms?.settings || {};
  const rootStyle = `--yn-primary:${safeColor(settings.primaryColor, '#f59e0b')};--yn-dark:${safeColor(settings.headerBgColor, '#0f2942')};--yn-bg:${safeColor(settings.siteBgColor, '#f4f6f8')};--yn-text:${safeColor(settings.textColor, '#172033')}`;
  const root = `<div id="root" data-server-rendered="1" data-server-authoritative="1" data-content-source="server" style="${esc(rootStyle)}">${renderHeader(payload)}${main}${renderFooter(payload)}</div>`;
  return `${beforeRoot}${root}${afterRoot}`;
};

export const normalizePublicStorefrontDocument = (html: string, pathname: string): string => {
  if (isPrivateStorefrontPath(pathname)) return html;
  const payload = parsePayload(html);
  if (!payload) return html;
  const upgraded = replaceRootChrome(html, payload);
  if (upgraded.includes('id="yadak-normal-storefront-style"')) return upgraded;
  return upgraded.replace('</head>', `${normalCss}<noscript><style>#root[data-server-authoritative="1"]{visibility:visible!important}</style></noscript></head>`);
};
