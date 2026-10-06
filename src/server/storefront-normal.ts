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

const renderProducts = (products: AnyRecord[], title: string, subtitle = ''): string => {
  if (!products.length) return '';
  return `<section class="yn-section"><div class="yn-heading"><div><h2>${esc(title)}</h2>${subtitle ? `<p>${esc(subtitle)}</p>` : ''}</div><a href="/shop">مشاهده همه</a></div><div class="yn-product-grid">${products.map(renderServerProduct).join('')}</div></section>`;
};

const renderHero = (payload: PublicPayload): string => {
  const section = sectionFor(payload, 'hero');
  const slides = (payload.bootstrap?.cms?.sliders || []).filter(item => item?.isActive !== false).sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
  const active = slides.length ? slides : [{ title: section?.title || 'قطعات مطمئن برای خودروی شما', subtitle: section?.subtitle || 'فروش تخصصی قطعات خودروهای چینی با تضمین اصالت و فیتمنت دقیق.', imageUrl: section?.imageUrl, link: section?.buttonLink || 'shop', buttonText: section?.buttonText || 'مشاهده فروشگاه' }];
  const brands = payload.bootstrap?.vehicles?.brands || [];
  return `<section class="yn-hero" data-yadak-slider>
    <div class="yn-hero-stage">${active.map((slide, index) => {
      const image = imageOf(slide);
      const style = image ? ` style="background-image:linear-gradient(90deg,rgba(0,0,0,.20),rgba(0,0,0,.54)),url('${esc(image)}')"` : '';
      return `<article class="yn-slide" data-slide="${index}"${index ? ' hidden' : ''}${style}><div class="yn-slide-copy">${slide.tag ? `<span>${esc(slide.tag)}</span>` : ''}<h1>${esc(slide.title || section?.title || 'فروشگاه تخصصی قطعات خودروهای چینی')}</h1><p>${esc(slide.subtitle || section?.subtitle || '')}</p><a href="${esc(linkToHref(slide.link || section?.buttonLink || 'shop'))}">${esc(slide.buttonText || section?.buttonText || 'مشاهده فروشگاه')}</a></div></article>`;
    }).join('')}
    ${active.length > 1 ? `<div class="yn-slider-controls"><button type="button" data-slider-prev aria-label="اسلاید قبلی">‹</button><div>${active.map((_, i) => `<button type="button" data-slider-dot="${i}" aria-label="اسلاید ${i + 1}"${i === 0 ? ' aria-current="true"' : ''}></button>`).join('')}</div><button type="button" data-slider-next aria-label="اسلاید بعدی">›</button></div>` : ''}</div>
    <aside class="yn-finder"><h2>خودروی خود را انتخاب کنید</h2><p>برای دسترسی سریع به قطعات سازگار</p><div class="yn-finder-links">${brands.slice(0, 6).map(brand => `<a href="/brand/${encodeURIComponent(String(brand.slug || brand.id))}">${esc(brand.nameFa || brand.nameEn)}</a>`).join('')}</div><a class="yn-finder-cta" href="/shop">مشاهده کاتالوگ</a></aside>
  </section>`;
};

const renderCategories = (payload: PublicPayload): string => {
  const section = sectionFor(payload, 'featured-categories');
  const categories = sourceItems(payload, section).length ? sourceItems(payload, section) : (payload.bootstrap?.categories?.categories || []).slice(0, Number(section?.maxItems || 12));
  if (!categories.length) return '';
  return `<section class="yn-section"><div class="yn-heading"><div><h2>${esc(section?.title || 'دسته‌بندی تخصصی قطعات')}</h2>${section?.subtitle ? `<p>${esc(section.subtitle)}</p>` : ''}</div><a href="/shop">همه دسته‌ها</a></div><div class="yn-category-grid">${categories.map(item => {
    const href = item.link ? linkToHref(item.link) : `/category/${encodeURIComponent(String(item.slug || item.id))}`;
    const image = imageOf(item);
    return `<a class="yn-category-card" href="${esc(href)}">${image ? `<img src="${esc(image)}" alt="${esc(titleOf(item))}" width="88" height="88" loading="lazy">` : '<span class="yn-category-placeholder">⚙</span>'}<strong>${esc(titleOf(item))}</strong></a>`;
  }).join('')}</div></section>`;
};

const renderBrands = (payload: PublicPayload): string => {
  const section = sectionFor(payload, 'manufacturers');
  const brands = sourceItems(payload, section).length ? sourceItems(payload, section) : (payload.bootstrap?.vehicles?.brands || []);
  if (!brands.length) return '';
  return `<section class="yn-section"><div class="yn-heading"><h2>${esc(section?.title || 'خرید بر اساس برند خودرو')}</h2></div><div class="yn-brand-grid">${brands.slice(0, Number(section?.maxItems || 12)).map(item => { const image = imageOf(item); const href = item.link ? linkToHref(item.link) : `/brand/${encodeURIComponent(String(item.slug || item.id))}`; return `<a href="${esc(href)}">${image ? `<img src="${esc(image)}" alt="${esc(titleOf(item))}" width="112" height="72" loading="lazy">` : ''}<span>${esc(titleOf(item))}</span></a>`; }).join('')}</div></section>`;
};

const renderPartsBrands = (payload: PublicPayload): string => {
  const settings = payload.bootstrap?.cms?.settings || {};
  const section = sectionFor(payload, 'parts-brands');
  const items = (settings.popularPartsBrands || []).filter((item: AnyRecord) => item?.isVisible !== false).slice(0, Number(section?.maxItems || 12));
  if (!items.length) return '';
  return `<section class="yn-section"><div class="yn-heading"><h2>${esc(section?.title || 'برندهای محبوب قطعات')}</h2></div><div class="yn-parts-brand-grid">${items.map((item: AnyRecord) => `<a href="${esc(linkToHref(item.link || 'shop'))}">${item.imageUrl ? `<img src="${esc(safeUrl(item.imageUrl))}" alt="${esc(item.title)}" loading="lazy">` : ''}<strong>${esc(item.title)}</strong></a>`).join('')}</div></section>`;
};

const renderBannerPlacement = (payload: PublicPayload, key: string): string => {
  const settings = payload.bootstrap?.cms?.settings || {};
  const placement = (settings.bannerPlacements || []).find((item: AnyRecord) => item?.key === key && item?.isVisible !== false);
  let items = (placement?.items || []).filter((item: AnyRecord) => item?.isVisible !== false).sort((a: AnyRecord, b: AnyRecord) => Number(a.order || 0) - Number(b.order || 0));
  if (!items.length) {
    const section = sectionFor(payload, key);
    if (section?.isVisible === false) return '';
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
  return `<section class="yn-section yn-testimonials"><div class="yn-heading"><div><h2>${esc(section?.title || 'نظر مشتریان')}</h2>${section?.subtitle ? `<p>${esc(section.subtitle)}</p>` : ''}</div></div><div class="yn-testimonial-grid">${items.map(item => `<article><strong>${esc(item.title || '')}</strong><span>★★★★★</span><p>${esc(item.content || item.subtitle || '')}</p></article>`).join('')}</div></section>`;
};

const renderArticles = (payload: PublicPayload): string => {
  const section = sectionFor(payload, 'articles');
  const articles = (payload.bootstrap?.cms?.articles || []).slice(0, Number(section?.maxItems || 3));
  if (!articles.length || section?.isVisible === false) return '';
  return `<section class="yn-section"><div class="yn-heading"><div><h2>${esc(section?.title || 'راهنما و مقالات')}</h2>${section?.subtitle ? `<p>${esc(section.subtitle)}</p>` : ''}</div><a href="/blog">مشاهده همه</a></div><div class="yn-article-grid">${articles.map(article => { const image = imageOf(article); const href = `/article/${encodeURIComponent(String(article.slug || article.id || ''))}`; return `<article><a href="${esc(href)}">${image ? `<img src="${esc(image)}" alt="${esc(article.title || '')}" loading="lazy">` : ''}<div><small>${esc(article.category || '')}</small><h3>${esc(article.title || '')}</h3><p>${esc(article.summary || '')}</p></div></a></article>`; }).join('')}</div></section>`;
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
    'featured-products': () => visibleSection(payload, 'featured-products') ? renderProducts(take(featured), sectionFor(payload, 'featured-products')?.title || 'محصولات ویژه', sectionFor(payload, 'featured-products')?.subtitle || 'محصولات منتخب، جدید و پرفروش فروشگاه') : '',
    'wide-banner-1': () => renderBannerPlacement(payload, 'wide-banner-1'),
    manufacturers: () => visibleSection(payload, 'manufacturers') ? renderBrands(payload) : '',
    'parts-brands': () => visibleSection(payload, 'parts-brands') ? renderPartsBrands(payload) : '',
    'promo-medium': () => renderBannerPlacement(payload, 'promo-medium'),
    'weekly-deals': () => visibleSection(payload, 'weekly-deals') ? renderProducts(take(best), sectionFor(payload, 'weekly-deals')?.title || 'بهترین پیشنهادهای این هفته', sectionFor(payload, 'weekly-deals')?.subtitle || '') : '',
    'promo-large': () => renderBannerPlacement(payload, 'promo-large'),
    'maintenance-products': () => visibleSection(payload, 'maintenance-products') ? renderProducts(take(maintenance), sectionFor(payload, 'maintenance-products')?.title || 'قطعات مصرفی و سرویس دوره‌ای', sectionFor(payload, 'maintenance-products')?.subtitle || '') : '',
    testimonials: () => renderTestimonials(payload),
    'shipping-banner': () => { const s = sectionFor(payload, 'shipping-banner'); return s?.isVisible === false ? '' : `<section class="yn-shipping"><span>🚚</span><div><strong>${esc(s?.title || 'ارسال سریع')}</strong><small>${esc(s?.subtitle || 'ارسال مطمئن سفارش‌ها به سراسر کشور')}</small></div></section>`; },
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
    ...(payload.bootstrap?.categories?.categories || []).slice(0, 9).map((cat: AnyRecord) => ({ title: cat.nameFa || cat.nameEn, link: `category:${cat.slug || cat.id}` })),
    { title: 'مجله', link: 'blog' }
  ];
};

const renderHeader = (payload: PublicPayload): string => {
  const settings = payload.bootstrap?.cms?.settings || {};
  const title = String(settings.siteTitle || 'یدک استور').split('|')[0].trim();
  const logo = safeUrl(settings.logoUrl);
  const announcement = String(settings.announcementText || '').trim();
  return `<header class="yn-header">${announcement ? `<div class="yn-announcement">${esc(announcement)}</div>` : ''}<div class="yn-header-main"><a class="yn-brand" href="/">${logo ? `<img src="${esc(logo)}" alt="${esc(title)}" width="${Math.max(90, Math.min(260, Number(settings.logoWidthPx || 150)))}" height="56">` : `<strong>${esc(title)}</strong>`}</a><div class="yn-header-actions"><a href="/shop">کاتالوگ قطعات</a><a href="/account">حساب کاربری</a></div></div><nav class="yn-nav" aria-label="منوی اصلی">${menuItems(payload).map(item => `<a href="${esc(linkToHref(item.link || item.url || ''))}">${esc(item.title || item.originalTitle || '')}</a>`).join('')}</nav></header>`;
};

const renderFooter = (payload: PublicPayload): string => {
  const settings = payload.bootstrap?.cms?.settings || {};
  const title = String(settings.siteTitle || 'یدک استور').split('|')[0].trim();
  const columns = (settings.footerColumns || []).slice(0, 4);
  const about = settings.footerAboutText || settings.siteSlogan || 'فروشگاه تخصصی قطعات خودرو';
  return `<footer class="yn-footer"><div class="yn-footer-grid"><div class="yn-footer-about"><strong>${esc(settings.footerAboutTitle || title)}</strong><p>${esc(about)}</p>${settings.contactPhone ? `<a href="tel:${esc(String(settings.contactPhone).replace(/[^+\d]/g, ''))}">${esc(settings.contactPhone)}</a>` : ''}${settings.supportEmail ? `<a href="mailto:${esc(settings.supportEmail)}">${esc(settings.supportEmail)}</a>` : ''}</div>${columns.length ? columns.map((column: AnyRecord) => `<nav><strong>${esc(column.title || '')}</strong>${(column.links || []).filter((item: AnyRecord) => item?.title).map((item: AnyRecord) => `<a href="${esc(linkToHref(item.url || '#'))}">${esc(item.title)}</a>`).join('')}</nav>`).join('') : `<nav><strong>دسترسی سریع</strong><a href="/shop">فروشگاه</a><a href="/blog">مجله</a><a href="/about">درباره ما</a><a href="/guarantee">ضمانت و اصالت</a></nav>`}</div><div class="yn-footer-bottom">${esc(settings.footerCopyrightText || settings.footerCopyright || `© ${title}`)}</div></footer>`;
};

const normalCss = `<style id="yadak-normal-storefront-style">
:root[data-render-mode="website"]{--yn-primary:#f59e0b;--yn-dark:#0f2942;--yn-bg:#f5f7f9;--yn-text:#172033}#root[data-server-rendered="1"]{background:var(--yn-bg);color:var(--yn-text);font-family:Vazirmatn,system-ui,sans-serif;direction:rtl;min-height:100vh}.yn-header{background:#fff;box-shadow:0 1px 0 #e5e7eb;position:relative;z-index:5}.yn-announcement{background:#123d5d;color:#fff;text-align:center;padding:7px 16px;font-size:.78rem}.yn-header-main{max-width:1320px;margin:auto;display:flex;align-items:center;justify-content:space-between;gap:20px;padding:11px 18px}.yn-brand{display:flex;align-items:center;color:#111827;text-decoration:none}.yn-brand img{max-height:56px;width:auto;object-fit:contain}.yn-header-actions{display:flex;gap:10px}.yn-header-actions a{padding:9px 13px;border:1px solid #e5e7eb;border-radius:8px;text-decoration:none;color:#26384a;font-size:.82rem;font-weight:800}.yn-nav{border-top:1px solid #edf0f3;max-width:100%;display:flex;justify-content:center;gap:18px;overflow:auto;padding:9px 16px;white-space:nowrap;scrollbar-width:none}.yn-nav a{color:#273647;text-decoration:none;font-size:.78rem;font-weight:800}.yn-home{display:flex;flex-direction:column;gap:26px;padding-bottom:42px}.yn-hero{position:relative;max-width:1320px;width:calc(100% - 28px);margin:18px auto 0;min-height:390px}.yn-hero-stage{min-height:390px;border-radius:14px;overflow:hidden;background:#0b78be}.yn-slide{min-height:390px;background-size:cover;background-position:center;position:relative}.yn-slide-copy{position:absolute;right:45%;top:50%;transform:translateY(-50%);max-width:44%;color:#fff;text-shadow:0 1px 2px #0005}.yn-slide-copy>span{display:inline-block;background:#f59e0b;color:#111827;padding:5px 9px;border-radius:999px;font-size:.72rem;font-weight:900}.yn-slide-copy h1{font-size:clamp(1.7rem,3vw,2.8rem);margin:10px 0;line-height:1.5}.yn-slide-copy p{line-height:2;margin:0 0 16px}.yn-slide-copy>a,.yn-finder-cta{display:inline-flex;background:#f59e0b;color:#111827;border-radius:7px;padding:10px 16px;text-decoration:none;font-weight:900}.yn-finder{position:absolute;left:28px;top:50%;transform:translateY(-50%);width:290px;background:#fff;border-radius:12px;padding:18px;box-shadow:0 12px 35px #0f172a2b}.yn-finder h2{font-size:1rem;margin:0 0 4px}.yn-finder p{font-size:.75rem;color:#6b7280}.yn-finder-links{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin:13px 0}.yn-finder-links a{border:1px solid #e5e7eb;border-radius:7px;padding:8px;text-align:center;color:#374151;text-decoration:none;font-size:.75rem}.yn-finder-cta{width:100%;justify-content:center}.yn-slider-controls{position:absolute;bottom:14px;right:50%;transform:translateX(50%);display:flex;align-items:center;gap:10px}.yn-slider-controls>button{width:31px;height:31px;border:0;border-radius:50%;background:#fff;color:#111;font-size:1.25rem}.yn-slider-controls>div{display:flex;gap:6px}.yn-slider-controls [data-slider-dot]{width:9px;height:9px;border:0;border-radius:50%;background:#ffffff80;padding:0}.yn-slider-controls [aria-current="true"]{background:#fff}.yn-section,.yn-banners,.yn-shipping,.yn-service-strip{max-width:1320px;width:calc(100% - 28px);margin:0 auto}.yn-heading{display:flex;align-items:end;justify-content:space-between;gap:14px;margin-bottom:13px}.yn-heading h2{font-size:1.08rem;margin:0}.yn-heading p{font-size:.77rem;color:#6b7280;margin:4px 0 0}.yn-heading>a{font-size:.76rem;color:#0d5d92;text-decoration:none;font-weight:800}.yn-category-grid{display:grid;grid-template-columns:repeat(9,minmax(0,1fr));gap:8px}.yn-category-card{background:#fff;border:1px solid #e5e7eb;border-radius:8px;text-decoration:none;color:#1f2937;padding:10px 6px;text-align:center;min-width:0}.yn-category-card img,.yn-category-placeholder{width:66px;height:66px;object-fit:contain;display:flex;margin:0 auto 7px;align-items:center;justify-content:center}.yn-category-card strong{font-size:.72rem;line-height:1.5;display:block}.yn-product-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.yn-product-card{display:grid;grid-template-columns:106px 1fr;background:#fff;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;min-width:0}.yn-product-image{padding:8px;display:flex}.yn-product-image img,.yn-image-placeholder{width:100%;height:100%;min-height:112px;object-fit:contain;background:#f8fafc;border-radius:7px}.yn-product-copy{padding:10px 8px 10px 4px;display:flex;flex-direction:column;min-width:0}.yn-product-meta{display:flex;gap:6px;align-items:center;font-size:.62rem}.yn-product-meta span{background:#f59e0b;padding:2px 5px;border-radius:4px}.yn-product-meta small,.yn-oem{color:#6b7280}.yn-product-title{color:#111827;text-decoration:none;font-size:.76rem;font-weight:800;line-height:1.7;margin:6px 0}.yn-oem{font-size:.63rem}.yn-product-bottom{display:flex;align-items:end;justify-content:space-between;gap:8px;margin-top:auto}.yn-product-bottom strong{font-size:.75rem;color:#e25023}.yn-product-bottom a{font-size:.66rem;color:#0d5d92;text-decoration:none}.yn-banners{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.yn-banners-wide-banner-1{grid-template-columns:1fr}.yn-banners-promo-small{grid-template-columns:repeat(3,minmax(0,1fr))}.yn-banner{position:relative;min-height:120px;border-radius:10px;overflow:hidden;background:#e5e7eb;display:block}.yn-banner img{width:100%;height:100%;max-height:380px;object-fit:cover;display:block}.yn-banner>span{position:absolute;right:18px;bottom:15px;color:#fff;text-shadow:0 1px 4px #000;background:#0005;padding:8px 10px;border-radius:7px}.yn-banner>span strong,.yn-banner>span small{display:block}.yn-brand-grid,.yn-parts-brand-grid{display:grid;grid-template-columns:repeat(10,minmax(0,1fr));gap:8px}.yn-brand-grid a,.yn-parts-brand-grid a{background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:9px;text-decoration:none;color:#374151;text-align:center;min-height:86px;display:flex;flex-direction:column;align-items:center;justify-content:center}.yn-brand-grid img,.yn-parts-brand-grid img{max-width:100%;height:52px;object-fit:contain;margin-bottom:5px}.yn-brand-grid span,.yn-parts-brand-grid strong{font-size:.67rem}.yn-testimonial-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.yn-testimonial-grid article{background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:15px}.yn-testimonial-grid span{color:#f59e0b;display:block}.yn-testimonial-grid p{font-size:.75rem;color:#6b7280;line-height:1.9}.yn-shipping{display:flex;align-items:center;gap:15px;background:linear-gradient(90deg,#ffd56a,#f5a000);padding:20px 28px;border-radius:10px}.yn-shipping>span{font-size:2rem}.yn-shipping strong,.yn-shipping small{display:block}.yn-article-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.yn-article-grid article{background:#fff;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden}.yn-article-grid a{text-decoration:none;color:#1f2937}.yn-article-grid img{width:100%;aspect-ratio:16/9;object-fit:cover}.yn-article-grid article div{padding:13px}.yn-article-grid small{color:#e25023}.yn-article-grid h3{font-size:.88rem;line-height:1.7;margin:6px 0}.yn-article-grid p{font-size:.72rem;line-height:1.8;color:#6b7280}.yn-service-strip{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));background:#08a63b;color:#fff;border-radius:8px;overflow:hidden}.yn-service-strip>div{padding:16px;text-align:center;border-left:1px solid #ffffff33}.yn-service-strip strong,.yn-service-strip small{display:block}.yn-service-strip small{font-size:.7rem;opacity:.9}.yn-footer{background:#303336;color:#fff;padding:36px max(20px,calc((100vw - 1280px)/2)) 18px}.yn-footer-grid{display:grid;grid-template-columns:1.5fr repeat(3,1fr);gap:30px}.yn-footer strong{font-weight:900}.yn-footer p{font-size:.76rem;line-height:2;color:#d1d5db}.yn-footer a{display:block;color:#e5e7eb;text-decoration:none;font-size:.75rem;margin-top:8px}.yn-footer-bottom{border-top:1px solid #ffffff18;margin-top:26px;padding-top:16px;text-align:center;color:#9ca3af;font-size:.7rem}.ys-main{background:#f5f7f9}.ys-header{display:none}.ys-footer{display:none}@media(max-width:1000px){.yn-category-grid{grid-template-columns:repeat(5,minmax(0,1fr))}.yn-product-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.yn-brand-grid,.yn-parts-brand-grid{grid-template-columns:repeat(5,minmax(0,1fr))}.yn-slide-copy{right:35%;max-width:55%}.yn-finder{width:250px;left:16px}.yn-testimonial-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.yn-footer-grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:720px){.yn-header-actions{display:none}.yn-nav{justify-content:flex-start}.yn-hero{min-height:auto}.yn-hero-stage,.yn-slide{min-height:330px}.yn-slide-copy{right:18px;left:18px;top:25%;transform:none;max-width:none}.yn-slide-copy h1{font-size:1.5rem}.yn-finder{position:relative;left:auto;top:auto;transform:none;width:auto;margin:-72px 14px 0;z-index:3}.yn-category-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.yn-product-grid{grid-template-columns:1fr}.yn-product-card{grid-template-columns:112px 1fr}.yn-banners,.yn-banners-promo-small{grid-template-columns:1fr}.yn-brand-grid,.yn-parts-brand-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.yn-article-grid{grid-template-columns:1fr}.yn-service-strip{grid-template-columns:repeat(2,minmax(0,1fr))}.yn-footer-grid{grid-template-columns:1fr}.yn-testimonial-grid{grid-template-columns:1fr 1fr}}@media(max-width:460px){.yn-category-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.yn-brand-grid,.yn-parts-brand-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.yn-testimonial-grid{grid-template-columns:1fr}.yn-service-strip{grid-template-columns:1fr}}
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
  const rootStyle = `--yn-primary:${safeColor(settings.primaryColor, '#f59e0b')};--yn-dark:${safeColor(settings.headerBgColor, '#0f2942')};--yn-bg:${safeColor(settings.siteBgColor, '#f5f7f9')};--yn-text:${safeColor(settings.textColor, '#172033')}`;
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
