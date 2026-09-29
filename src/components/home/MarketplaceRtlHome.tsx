import React, { useMemo } from 'react';
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
import { ProductCard } from '../product/ProductCard';

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
    selectedVehicle
  } = useStore();

  const activeSlides = useMemo(
    () => sliders.filter(slide => slide.isActive).sort((a, b) => a.order - b.order),
    [sliders]
  );

  const hero = activeSlides[0];
  const featured = products.filter(p => p.isFeatured).slice(0, 8);
  const bestSellers = products.filter(p => p.isBestSeller).slice(0, 8);
  const maintenance = products.filter(p => p.isMaintenancePart).slice(0, 8);
  const fallbackProducts = products.slice(0, 8);
  const productStrip = featured.length ? featured : fallbackProducts;
  const deals = bestSellers.length ? bestSellers : fallbackProducts;
  const serviceParts = maintenance.length ? maintenance : fallbackProducts;

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

  return (
    <div className="marketplace-rtl-home" dir="rtl">
      <section className="marketplace-hero-shell">
        <div
          className="marketplace-hero-banner"
          style={hero?.imageUrl ? { backgroundImage: `url(${hero.imageUrl})` } : undefined}
        >
          <div className="marketplace-hero-overlay" />
          <div className="marketplace-hero-content">
            <span className="marketplace-kicker">{hero?.tag || 'پیشنهاد ویژه قطعات خودرو'}</span>
            <h1>{hero?.title || 'قطعات مطمئن برای خودروی شما'}</h1>
            <p>{hero?.subtitle || 'خرید تخصصی قطعات خودروهای چینی با تضمین اصالت، فیتمنت دقیق و ارسال سریع.'}</p>
            <button type="button" onClick={() => goLink(hero?.link || 'shop')}>
              {hero?.buttonText || 'مشاهده محصولات'}
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

      <section className="marketplace-section marketplace-category-row" data-section-key="featured-categories">
        <div className="marketplace-section-heading compact">
          <h2>دسته‌بندی‌های ویژه</h2>
        </div>
        <div className="marketplace-round-list">
          {categories.slice(0, 9).map(cat => (
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

      <section className="marketplace-section marketplace-promo-grid three" data-section-key="promo-small">
        {[0, 1, 2].map((index) => {
          const slide = activeSlides[index];
          return (
            <button
              key={index}
              type="button"
              className="marketplace-promo-card"
              style={promoImage(index) ? { backgroundImage: `url(${promoImage(index)})` } : undefined}
              onClick={() => goLink(slide?.link || 'shop')}
            >
              <span>{slide?.tag || (index === 0 ? 'پیشنهاد روز' : index === 1 ? 'محصولات منتخب' : 'فروش ویژه')}</span>
              <h3>{slide?.title || ['باتری و برق خودرو', 'رینگ، جلوبندی و تعلیق', 'پیشنهادهای محدود فروشگاه'][index]}</h3>
              <small>مشاهده محصولات</small>
            </button>
          );
        })}
      </section>

      <section className="marketplace-section" data-section-key="featured-products">
        <div className="marketplace-section-heading">
          <div>
            <h2>محصولات ویژه</h2>
            <p>محصولات منتخب، جدید و پرفروش فروشگاه</p>
          </div>
          <button type="button" onClick={() => onNavigate('shop')}>
            مشاهده همه
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
        <div className="marketplace-product-grid">
          {productStrip.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onViewDetails={(id) => onNavigate('product', id)}
            />
          ))}
        </div>
      </section>

      <section
        className="marketplace-wide-banner"
        data-section-key="wide-banner-1"
        style={promoImage(1) ? { backgroundImage: `url(${promoImage(1)})` } : undefined}
      >
        <div>
          <span>سیستم ترمز و ایمنی</span>
          <h2>برای توقف مطمئن، قطعه مطمئن انتخاب کنید</h2>
          <button type="button" onClick={() => onNavigate('shop')}>مشاهده محصولات</button>
        </div>
      </section>

      <section className="marketplace-section marketplace-brands" data-section-key="manufacturers">
        <div className="marketplace-section-heading compact">
          <h2>برندهای خودرو</h2>
          <button type="button" onClick={() => onNavigate('shop')}>مشاهده همه</button>
        </div>
        <div className="marketplace-brand-row">
          {brands.slice(0, 14).map(brand => (
            <button key={brand.id} type="button" onClick={() => onNavigate('car-brand', brand.slug)}>
              <span><img src={brand.logo} alt={brand.nameFa} /></span>
              <small>{brand.nameFa}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="marketplace-section marketplace-brand-tiles" data-section-key="parts-brands">
        <div className="marketplace-section-heading compact">
          <h2>برندهای محبوب قطعات</h2>
        </div>
        <div className="marketplace-logo-tiles">
          {Array.from(new Set(products.map(p => p.brandManufacturer).filter(Boolean))).slice(0, 12).map((name, index) => (
            <button key={name} type="button" onClick={() => onNavigate('shop')}>
              <span>{name}</span>
              <small>{index % 3 === 0 ? 'پرفروش' : index % 3 === 1 ? 'اصلی' : 'منتخب'}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="marketplace-section marketplace-promo-grid two" data-section-key="promo-medium">
        {[1, 2].map((index) => (
          <button
            key={index}
            type="button"
            className="marketplace-promo-card marketplace-promo-medium"
            style={promoImage(index) ? { backgroundImage: `url(${promoImage(index)})` } : undefined}
            onClick={() => goLink(activeSlides[index]?.link || 'shop')}
          >
            <span>{index === 1 ? 'آماده برای جاده' : 'قطعات حیاتی موتور'}</span>
            <h3>{index === 1 ? 'جلوبندی، تایر و سیستم تعلیق' : 'قطعات موتور و سرویس تخصصی'}</h3>
            <small>خرید کنید</small>
          </button>
        ))}
      </section>

      <section className="marketplace-deals" data-section-key="weekly-deals">
        <div className="marketplace-section marketplace-deals-inner">
          <div className="marketplace-section-heading inverse">
            <div>
              <h2>بهترین پیشنهادهای این هفته</h2>
              <p>فرصت محدود برای خرید قطعات منتخب</p>
            </div>
            <button type="button" onClick={() => onNavigate('shop')}>مشاهده همه</button>
          </div>
          <div className="marketplace-product-grid">
            {deals.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onViewDetails={(id) => onNavigate('product', id)}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="marketplace-section marketplace-feature-banners" data-section-key="promo-large">
        <button type="button" className="large first" onClick={() => onNavigate('shop')}>
          <div>
            <span>روشنایی و بدنه</span>
            <h3>چراغ‌ها و قطعات بدنه با تنوع کامل</h3>
            <small>مشاهده محصولات</small>
          </div>
        </button>
        <button type="button" className="small" onClick={() => onNavigate('shop', 'maintenance')}>
          <div>
            <span>فیلترها</span>
            <h3>سرویس دوره‌ای مطمئن</h3>
          </div>
        </button>
        <button type="button" className="small second" onClick={() => onNavigate('shop')}>
          <div>
            <span>گیربکس و روغن</span>
            <h3>قطعات تخصصی انتقال قدرت</h3>
          </div>
        </button>
        <button type="button" className="large second" onClick={() => onNavigate('shop')}>
          <div>
            <span>مراقبت خودرو</span>
            <h3>محصولات نگهداری و لوازم جانبی</h3>
            <small>مشاهده محصولات</small>
          </div>
        </button>
      </section>

      <section className="marketplace-section" data-section-key="maintenance-products">
        <div className="marketplace-section-heading">
          <div>
            <h2>قطعات مصرفی و سرویس دوره‌ای</h2>
            <p>انتخاب‌های سریع برای نگهداری اصولی خودرو</p>
          </div>
          <button type="button" onClick={() => onNavigate('shop', 'maintenance')}>
            مشاهده همه
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
        <div className="marketplace-product-grid">
          {serviceParts.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onViewDetails={(id) => onNavigate('product', id)}
            />
          ))}
        </div>
      </section>

      <section className="marketplace-testimonials" data-section-key="testimonials">
        <div className="marketplace-section">
          <div className="marketplace-section-heading compact center">
            <div>
              <h2>نظر مشتریان ما</h2>
              <p>تجربه خرید از فروشگاه تخصصی قطعات</p>
            </div>
          </div>
          <div className="marketplace-testimonial-grid">
            {[
              ['اصالت قطعه دقیق بود و خیلی سریع به دستم رسید.', 'خریدار قطعات موتور'],
              ['قبل از خرید شماره فنی را بررسی کردند و قطعه کاملاً مناسب بود.', 'مشتری فروشگاه'],
              ['بسته‌بندی و پیگیری سفارش حرفه‌ای بود.', 'خریدار عمده'],
              ['برای قطعه کمیاب خیلی سریع استعلام انجام شد.', 'تعمیرکار']
            ].map(([quote, role]) => (
              <article key={quote}>
                <strong>★★★★★</strong>
                <p>{quote}</p>
                <small>{role}</small>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="marketplace-section marketplace-shipping-banner" data-section-key="shipping-banner">
        <div>
          <Truck className="w-10 h-10" />
          <span>ارسال سریع</span>
          <strong>برای سفارش‌های واجد شرایط</strong>
        </div>
        <PackageCheck className="marketplace-shipping-art" />
      </section>

      <section className="marketplace-section marketplace-articles" data-section-key="articles">
        <div className="marketplace-section-heading">
          <div>
            <h2>راهنما و مقالات</h2>
            <p>آموزش، نگهداری و انتخاب صحیح قطعات خودرو</p>
          </div>
          <button type="button" onClick={() => onNavigate('blog')}>
            مشاهده همه
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
        <div className="marketplace-article-grid">
          {articles.slice(0, 3).map(article => (
            <button key={article.id} type="button" onClick={() => onNavigate('article', article.slug || article.id)}>
              <img src={article.imageUrl} alt={article.title} />
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

      <section className="marketplace-service-strip" data-section-key="service-strip">
        {[
          [ShieldCheck, 'تضمین اصالت', 'کنترل اصالت و کیفیت قطعه'],
          [Sparkles, 'ارزش خرید', 'قیمت‌گذاری شفاف و رقابتی'],
          [Truck, 'ارسال سریع', 'بسته‌بندی ایمن و رهگیری سفارش'],
          [Headphones, 'پشتیبانی تخصصی', 'مشاوره قبل و بعد از خرید']
        ].map(([Icon, title, desc]) => {
          const Comp = Icon as React.ComponentType<{ className?: string }>;
          return (
            <div key={String(title)}>
              <Comp className="w-7 h-7" />
              <span>
                <strong>{String(title)}</strong>
                <small>{String(desc)}</small>
              </span>
            </div>
          );
        })}
      </section>
    </div>
  );
};
