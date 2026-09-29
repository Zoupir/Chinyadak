import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Car,
  ChevronLeft,
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
    pages
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
      backgroundSize: section.imageUrl ? 'cover' : undefined,
      backgroundPosition: section.imageUrl ? 'center' : undefined,
      color: section.textColor || undefined,
      borderRadius: section.borderRadiusPx !== undefined ? `${section.borderRadiusPx}px` : undefined,
      paddingTop: section.paddingTopPx !== undefined ? `${section.paddingTopPx}px` : undefined,
      paddingBottom: section.paddingBottomPx !== undefined ? `${section.paddingBottomPx}px` : undefined,
      paddingInline: section.paddingInlinePx !== undefined ? `${section.paddingInlinePx}px` : undefined,
      minHeight: section.minHeightPx ? `${section.minHeightPx}px` : undefined,
      textAlign: section.contentAlign || undefined,
      width: section.fullWidth ? '100%' : `${Math.max(20, Math.min(100, Number(section.widthPercent ?? 100)))}%`,
      maxWidth: section.fullWidth || section.maxWidthPx === 0 ? 'none' : `${Number(section.maxWidthPx || 1280)}px`,
      marginInline: 'auto',
      ['--builder-gap' as any]: `${section.gapPx ?? 12}px`,
      ['--builder-cols' as any]: String(section.desktopColumns || 3),
      ['--builder-mobile-cols' as any]: String(section.mobileColumns || 1),
      ['--builder-item-radius' as any]: `${section.itemRadiusPx ?? 10}px`,
      ['--builder-image-size' as any]: `${section.imageSizePx ?? 72}px`,
      ['--builder-width' as any]: section.fullWidth ? '100%' : `${Math.max(20, Math.min(100, Number(section.widthPercent ?? 100)))}%`,
      ['--builder-max-width' as any]: section.fullWidth || section.maxWidthPx === 0 ? 'none' : `${Number(section.maxWidthPx || 1280)}px`,
      ['--builder-padding-top' as any]: section.paddingTopPx !== undefined ? `${section.paddingTopPx}px` : undefined,
      ['--builder-padding-bottom' as any]: section.paddingBottomPx !== undefined ? `${section.paddingBottomPx}px` : undefined,
      ['--builder-padding-inline' as any]: section.paddingInlinePx !== undefined ? `${section.paddingInlinePx}px` : undefined,
      ['--builder-section-radius' as any]: section.borderRadiusPx !== undefined ? `${section.borderRadiusPx}px` : undefined,
      ['--builder-min-height' as any]: section.minHeightPx ? `${section.minHeightPx}px` : undefined,
      ['--builder-bg' as any]: section.backgroundColor || undefined,
      ['--builder-text' as any]: section.textColor || undefined
    };
  };
  const sortedItems = (key: string) =>
    [...(sectionConfig(key)?.items || [])]
      .filter(item => item.isVisible !== false)
      .sort((a, b) => a.order - b.order);

  const hero = activeSlides[0];
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
  const [featuredTab, setFeaturedTab] = useState<'featured' | 'popular' | 'maintenance' | 'new'>('featured');

  const visibleFeaturedProducts =
    featuredTab === 'popular'
      ? fillProducts(bestSellers, 8)
      : featuredTab === 'maintenance'
      ? fillProducts(maintenance, 8)
      : featuredTab === 'new'
      ? products.slice().reverse().slice(0, 8)
      : productStrip;

  const promoImage = (index: number) =>
    activeSlides[index]?.imageUrl ||
    products[index]?.images?.[0] ||
    categories[index]?.imageUrl ||
    hero?.imageUrl ||
    '';

  const goLink = (link?: string) => {
    if (!link) return onNavigate('shop');
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
    <div className="marketplace-rtl-home" dir="rtl">
      {sectionVisible('hero') && (
      <section className="marketplace-hero-shell" data-section-key="hero" style={sectionStyle('hero')}>
        <div
          className="marketplace-hero-banner"
          style={{
            ...(sectionConfig('hero')?.imageUrl || hero?.imageUrl ? { backgroundImage: `url(${sectionConfig('hero')?.imageUrl || hero?.imageUrl})` } : {}),
            borderRadius: `${sectionConfig('hero')?.borderRadiusPx ?? 0}px`
          }}
        >
          <div className="marketplace-hero-overlay" />
          <div className="marketplace-hero-content">
            <span className="marketplace-kicker">{sectionConfig('hero')?.badge || hero?.tag || 'پیشنهاد ویژه قطعات خودرو'}</span>
            <h1>{sectionConfig('hero')?.title || hero?.title || 'قطعات مطمئن برای خودروی شما'}</h1>
            <p>{sectionConfig('hero')?.subtitle || hero?.subtitle || 'خرید تخصصی قطعات خودروهای چینی با تضمین اصالت، فیتمنت دقیق و ارسال سریع.'}</p>
            <button type="button" onClick={() => goLink(sectionConfig('hero')?.buttonLink || hero?.link || 'shop')}>
              {sectionConfig('hero')?.buttonText || hero?.buttonText || 'مشاهده محصولات'}
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="marketplace-vehicle-finder">
            <h3>خودروی خود را انتخاب کنید</h3>
            <p>تا فقط قطعات سازگار نمایش داده شوند</p>
            <div className="marketplace-finder-grid">
              <button type="button" onClick={onOpenVehicleModal}>
                <span>برند خودرو</span>
                <strong>{selectedVehicle?.brandName || 'انتخاب برند'}</strong>
              </button>
              <button type="button" onClick={onOpenVehicleModal}>
                <span>مدل خودرو</span>
                <strong>{selectedVehicle?.modelName || 'انتخاب مدل'}</strong>
              </button>
              <button type="button" onClick={onOpenVehicleModal}>
                <span>سال ساخت</span>
                <strong>{selectedVehicle?.year || 'انتخاب سال'}</strong>
              </button>
              <button type="button" onClick={onOpenVehicleModal}>
                <span>موتور / تیپ</span>
                <strong>{selectedVehicle?.engine || 'انتخاب تیپ'}</strong>
              </button>
            </div>
            <button className="marketplace-search-car" type="button" onClick={onOpenVehicleModal}>
              <Search className="w-4 h-4" />
              جستجوی قطعات خودرو
            </button>
          </div>
        </div>
      </section>
      )}

      {sectionVisible('featured-categories') && (
      <section className="marketplace-section marketplace-category-row" data-section-key="featured-categories" style={sectionStyle('featured-categories')}>
        <div className="marketplace-section-heading compact">
          <h2>{sectionConfig('featured-categories')?.title || 'دسته‌بندی‌های ویژه'}</h2>
        </div>
        <div className="marketplace-round-list">
          {categories.slice(0, sectionConfig('featured-categories')?.maxItems || 9).map(cat => (
            <button key={cat.id} type="button" onClick={() => onNavigate('category', cat.slug)}>
              <span className="marketplace-round-icon">
                {cat.iconUrl || cat.imageUrl ? (
                  <img src={cat.iconUrl || cat.imageUrl} alt={cat.nameFa} />
                ) : (
                  <Wrench className="w-6 h-6" />
                )}
              </span>
              <strong>{cat.nameFa}</strong>
            </button>
          ))}
        </div>
      </section>
      )}

      {sectionVisible('promo-small') && (
      <section className="marketplace-section marketplace-promo-grid three builder-section-grid" data-section-key="promo-small" style={sectionStyle('promo-small')}>
        {(sortedItems('promo-small').length ? sortedItems('promo-small') : [0, 1, 2].map((index) => ({
          id: `promo-fallback-${index}`,
          title: activeSlides[index]?.title || ['باتری و برق خودرو', 'رینگ، جلوبندی و تعلیق', 'پیشنهادهای محدود فروشگاه'][index],
          subtitle: activeSlides[index]?.tag || (index === 0 ? 'پیشنهاد روز' : index === 1 ? 'محصولات منتخب' : 'فروش ویژه'),
          buttonText: 'مشاهده محصولات',
          link: activeSlides[index]?.link || 'shop',
          imageUrl: promoImage(index),
          order: index + 1
        }))).map((item, index) => (
          <button
            key={item.id}
            type="button"
            className="marketplace-promo-card"
            style={{
              ...(item.imageUrl || promoImage(index) ? { backgroundImage: `url(${item.imageUrl || promoImage(index)})` } : {}),
              borderRadius: `${sectionConfig('promo-small')?.itemRadiusPx ?? 10}px`
            }}
            onClick={() => goLink(item.link || 'shop')}
          >
            <span>{item.subtitle || 'پیشنهاد ویژه'}</span>
            <h3>{item.title || 'بنر فروشگاه'}</h3>
            <small>{item.buttonText || 'مشاهده محصولات'}</small>
          </button>
        ))}
      </section>
      )}

      {sectionVisible('featured-products') && (
      <section className="marketplace-section" data-section-key="featured-products" style={sectionStyle('featured-products')}>
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
          <button type="button" className={featuredTab === 'featured' ? 'active' : ''} onClick={() => setFeaturedTab('featured')}>محصولات ویژه</button>
          <button type="button" className={featuredTab === 'popular' ? 'active' : ''} onClick={() => setFeaturedTab('popular')}>پرفروش‌ترین‌ها</button>
          <button type="button" className={featuredTab === 'maintenance' ? 'active' : ''} onClick={() => setFeaturedTab('maintenance')}>سرویس دوره‌ای</button>
          <button type="button" className={featuredTab === 'new' ? 'active' : ''} onClick={() => setFeaturedTab('new')}>جدیدترین‌ها</button>
        </div>
        <div className="marketplace-product-grid">
          {visibleFeaturedProducts.slice(0, sectionConfig('featured-products')?.maxItems || visibleFeaturedProducts.length).map(product => (
            <ReferenceProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
      )}

      {sectionVisible('wide-banner-1') && (
      <section
        className="marketplace-wide-banner"
        data-section-key="wide-banner-1"
        style={{
          ...sectionStyle('wide-banner-1'),
          ...(sectionConfig('wide-banner-1')?.imageUrl || promoImage(1)
            ? { backgroundImage: `url(${sectionConfig('wide-banner-1')?.imageUrl || promoImage(1)})` }
            : {})
        }}
      >
        <div>
          <span>{sectionConfig('wide-banner-1')?.subtitle || 'سیستم ترمز و ایمنی'}</span>
          <h2>{sectionConfig('wide-banner-1')?.title || 'برای توقف مطمئن، قطعه مطمئن انتخاب کنید'}</h2>
          <button type="button" onClick={() => goLink(sectionConfig('wide-banner-1')?.buttonLink || 'shop')}>{sectionConfig('wide-banner-1')?.buttonText || 'مشاهده محصولات'}</button>
        </div>
      </section>
      )}

      {sectionVisible('manufacturers') && (
      <section className="marketplace-section marketplace-brands" data-section-key="manufacturers" style={sectionStyle('manufacturers')}>
        <div className="marketplace-section-heading compact">
          <h2>{sectionConfig('manufacturers')?.title || 'برندهای خودرو'}</h2>
          <button type="button" onClick={() => onNavigate('shop')}>مشاهده همه</button>
        </div>
        <div className="marketplace-brand-row builder-section-grid">
          {brands.slice(0, sectionConfig('manufacturers')?.maxItems || brands.length).map(brand => (
            <button key={brand.id} type="button" onClick={() => onNavigate('car-brand', brand.slug)} style={{ borderRadius: `${sectionConfig('manufacturers')?.itemRadiusPx ?? 10}px` }}>
              <span style={{ width: 'var(--builder-image-size)', height: 'var(--builder-image-size)' }}>
                <img src={brand.logo} alt={brand.nameFa} style={{ maxWidth: '100%', maxHeight: '100%' }} />
              </span>
              <small>{brand.nameFa}</small>
            </button>
          ))}
        </div>
      </section>
      )}

      {sectionVisible('parts-brands') && (
      <section className="marketplace-section marketplace-brand-tiles" data-section-key="parts-brands" style={sectionStyle('parts-brands')}>
        <div className="marketplace-section-heading compact">
          <h2>{sectionConfig('parts-brands')?.title || 'برندهای محبوب قطعات'}</h2>
        </div>
        <div className="marketplace-logo-tiles marketplace-logo-tiles-with-images">
          {(settings.popularPartsBrands || []).filter(item => item.isVisible !== false).slice(0, sectionConfig('parts-brands')?.maxItems || 12).map((item) => (
            <button key={item.id} type="button" onClick={() => goLink(item.link || 'shop')} style={{ borderRadius: `${sectionConfig('parts-brands')?.itemRadiusPx ?? 2}px` }}>
              {item.imageUrl ? (
                <span className="marketplace-parts-brand-logo has-image">
                  <img src={item.imageUrl} alt={item.title} />
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
      <section className="marketplace-section marketplace-promo-grid two builder-section-grid" data-section-key="promo-medium" style={sectionStyle('promo-medium')}>
        {(sortedItems('promo-medium').length ? sortedItems('promo-medium') : [1, 2].map((index) => ({
          id: `medium-${index}`,
          title: index === 1 ? 'جلوبندی، تایر و سیستم تعلیق' : 'قطعات موتور و سرویس تخصصی',
          subtitle: index === 1 ? 'آماده برای جاده' : 'قطعات حیاتی موتور',
          buttonText: 'خرید کنید',
          link: activeSlides[index]?.link || 'shop',
          imageUrl: promoImage(index),
          order: index
        }))).map((item, index) => (
          <button
            key={item.id}
            type="button"
            className="marketplace-promo-card marketplace-promo-medium"
            style={{
              ...(item.imageUrl || promoImage(index + 1) ? { backgroundImage: `url(${item.imageUrl || promoImage(index + 1)})` } : {}),
              borderRadius: `${sectionConfig('promo-medium')?.itemRadiusPx ?? 12}px`
            }}
            onClick={() => goLink(item.link || 'shop')}
          >
            <span>{item.subtitle || 'پیشنهاد ویژه'}</span>
            <h3>{item.title || 'بنر فروشگاه'}</h3>
            <small>{item.buttonText || 'خرید کنید'}</small>
          </button>
        ))}
      </section>
      )}

      {sectionVisible('weekly-deals') && (
      <section className="marketplace-deals" data-section-key="weekly-deals" style={sectionStyle('weekly-deals')}>
        <div className="marketplace-section marketplace-deals-inner">
          <div className="marketplace-section-heading inverse">
            <div className="marketplace-deal-heading">
              <div>
                <h2>{sectionConfig('weekly-deals')?.title || 'بهترین پیشنهادهای این هفته'}</h2>
                <p>{sectionConfig('weekly-deals')?.subtitle || 'فرصت محدود برای خرید قطعات منتخب'}</p>
              </div>
              <div className="marketplace-deal-timer" aria-label="زمان باقی‌مانده پیشنهاد">
                <span>۰۶</span><b>:</b><span>۲۳</span><b>:</b><span>۲۹</span>
              </div>
            </div>
            <button type="button" onClick={() => onNavigate('shop')}>مشاهده همه</button>
          </div>
          <div className="marketplace-product-grid">
            {deals.slice(0, sectionConfig('weekly-deals')?.maxItems || deals.length).map(product => (
              <ReferenceProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>
      )}

      {sectionVisible('promo-large') && (
      <section className="marketplace-section marketplace-feature-banners builder-section-grid" data-section-key="promo-large" style={sectionStyle('promo-large')}>
        {sortedItems('promo-large').map((item, index) => {
          const fallbackImages = [promoImage(0), promoImage(2), products[1]?.images?.[0] || '', products[2]?.images?.[0] || ''];
          const image = item.imageUrl || fallbackImages[index] || '';
          return (
            <button
              key={item.id}
              type="button"
              className={index % 3 === 0 ? 'large' : 'small'}
              style={{
                ...(image ? { backgroundImage: `linear-gradient(90deg, rgba(0,0,0,.24), rgba(0,0,0,.62)), url(${image})` } : {}),
                borderRadius: `${sectionConfig('promo-large')?.itemRadiusPx ?? 12}px`
              }}
              onClick={() => goLink(item.link || 'shop')}
            >
              <div>
                <span>{item.subtitle || 'پیشنهاد فروشگاه'}</span>
                <h3>{item.title || 'بنر فروشگاه'}</h3>
                {item.buttonText && <small>{item.buttonText}</small>}
              </div>
            </button>
          );
        })}
      </section>
      )}

      {sectionVisible('maintenance-products') && (
      <section className="marketplace-section" data-section-key="maintenance-products" style={sectionStyle('maintenance-products')}>
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
        <div className="marketplace-product-grid">
          {serviceParts.slice(0, sectionConfig('maintenance-products')?.maxItems || serviceParts.length).map(product => (
            <ReferenceProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
      )}

      {sectionVisible('testimonials') && (
      <section className="marketplace-testimonials" data-section-key="testimonials" style={sectionStyle('testimonials')}>
        <div className="marketplace-section">
          <div className="marketplace-section-heading compact center">
            <div>
              <h2>{sectionConfig('testimonials')?.title || 'نظر مشتریان ما'}</h2>
              <p>{sectionConfig('testimonials')?.subtitle || 'تجربه خرید از فروشگاه تخصصی قطعات'}</p>
            </div>
          </div>
          <div className="marketplace-testimonial-grid builder-section-grid">
            {sortedItems('testimonials').map(item => (
              <article key={item.id} style={{ borderRadius: `${sectionConfig('testimonials')?.itemRadiusPx ?? 12}px` }}>
                {item.imageUrl && <img src={item.imageUrl} alt={item.title || 'نظر مشتری'} className="w-10 h-10 rounded-full object-cover mb-2" />}
                <strong>★★★★★</strong>
                <p>{item.content || item.subtitle || ''}</p>
                <small>{item.title || 'مشتری فروشگاه'}</small>
              </article>
            ))}
          </div>
        </div>
      </section>
      )}

      {sectionVisible('shipping-banner') && (
      <section className="marketplace-section marketplace-shipping-banner" data-section-key="shipping-banner" style={sectionStyle('shipping-banner')}>
        <div>
          <Truck className="w-10 h-10" />
          <span>{sectionConfig('shipping-banner')?.title || 'ارسال سریع'}</span>
          <strong>{sectionConfig('shipping-banner')?.subtitle || 'برای سفارش‌های واجد شرایط'}</strong>
        </div>
        <PackageCheck className="marketplace-shipping-art" />
      </section>
      )}

      {sectionVisible('articles') && (
      <section className="marketplace-section marketplace-articles" data-section-key="articles" style={sectionStyle('articles')}>
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
            <h3>راهنما و مقالات تخصصی</h3>
            <p>مطالب کاربردی برای انتخاب قطعه، نگهداری خودرو و شناخت بهتر سیستم‌های فنی.</p>
            <button type="button" onClick={() => onNavigate('blog')}>مشاهده همه مقالات</button>
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
      <section className="marketplace-service-strip builder-section-grid" data-section-key="service-strip" style={sectionStyle('service-strip')}>
        {sortedItems('service-strip').map((item, index) => {
          const icons = [ShieldCheck, Sparkles, Truck, Headphones];
          const Comp = icons[index % icons.length];
          return (
            <div key={item.id} style={{ borderRadius: `${sectionConfig('service-strip')?.itemRadiusPx ?? 8}px` }}>
              <Comp className="w-7 h-7" />
              <span>
                <strong>{item.title || 'مزیت فروشگاه'}</strong>
                <small>{item.content || item.subtitle || ''}</small>
              </span>
            </div>
          );
        })}
      </section>
      )}
    </div>
  );
};
