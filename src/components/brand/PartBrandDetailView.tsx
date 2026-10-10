import React, { useEffect, useMemo, useState } from 'react';
import { BadgeCheck, Boxes, Car, ExternalLink, Factory, Globe2, HelpCircle, Layers3, ShieldCheck, Wrench } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import type { PartBrand, Product } from '../../types';
import { apiRequest } from '../../api/client';
import { ProductCard } from '../product/ProductCard';
import { RichTextContent } from '../common/RichTextContent';

interface PartBrandDetailViewProps {
  brandSlug: string;
  onNavigate: (view: string, param?: string) => void;
}

const normalizeName = (value: unknown) => String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');

export const PartBrandDetailView: React.FC<PartBrandDetailViewProps> = ({ brandSlug, onNavigate }) => {
  const { partBrands, products, categories, brands, models, adminAuth } = useStore();
  const brand: PartBrand | undefined = partBrands.find((item: PartBrand) => item.slug === brandSlug || item.id === brandSlug);
  const [remoteProducts, setRemoteProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (!brand) return;
    const cached = products.filter((product: Product) => product.partBrandIds?.includes(brand.id));
    if (cached.length) return;
    let cancelled = false;
    apiRequest<{ products: Product[] }>(`/api/part-brands/${encodeURIComponent(brand.id)}/products?limit=120`)
      .then(payload => { if (!cancelled) setRemoteProducts(payload.products || []); })
      .catch(error => { if (!cancelled) console.warn('Part-brand products could not be loaded:', error); });
    return () => { cancelled = true; };
  }, [brand?.id, products.length]);

  if (!brand) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <Factory className="mx-auto mb-4 h-10 w-10 text-neutral-300" />
        <h2 className="text-xl font-black">برند قطعه یافت نشد</h2>
        <button onClick={() => onNavigate('shop')} className="mt-4 text-xs font-bold text-orange-600 underline">بازگشت به فروشگاه</button>
      </div>
    );
  }

  const legacyName = normalizeName(brand.nameEn || brand.nameFa);
  const cachedProducts = products.filter((product: Product) =>
    product.partBrandIds?.includes(brand.id) ||
    (!product.partBrandIds?.length && [product.brandManufacturer, product.partManufacturerCompany].some(value => normalizeName(value) === legacyName || normalizeName(value) === normalizeName(brand.nameFa)))
  );
  const brandProducts = cachedProducts.length ? cachedProducts : remoteProducts;

  const linkedCategorySlugs = Array.from(new Set(brandProducts.map(product => product.categorySlug).filter(Boolean)));
  const linkedCategories = categories.filter((category: any) => linkedCategorySlugs.includes(category.slug));
  const linkedVehicleBrandIds = Array.from(new Set(brandProducts.flatMap(product => [
    ...(product.vehicleBrandIds || []),
    ...product.fitments.map(fitment => fitment.brandId).filter(Boolean)
  ])));
  const linkedVehicleModelIds = Array.from(new Set(brandProducts.flatMap(product => [
    ...(product.vehicleModelIds || []),
    ...product.fitments.map(fitment => fitment.modelId).filter(id => id && id !== 'all')
  ])));
  const linkedVehicleBrands = brands.filter((item: any) => linkedVehicleBrandIds.includes(item.id));
  const linkedModels = models.filter((item: any) => linkedVehicleModelIds.includes(item.id));

  return (
    <div className="pb-16" data-part-brand-page="1">
      <section className="relative overflow-hidden border-b border-slate-800 bg-slate-950 text-white">
        {brand.heroImage && <img src={brand.heroImage} alt="" className="absolute inset-0 h-full w-full object-cover opacity-20" />}
        <div className="absolute inset-0 bg-gradient-to-l from-slate-950 via-slate-950/90 to-orange-950/60" />
        <div className="relative mx-auto max-w-7xl px-4 py-10 md:py-16">
          <nav className="mb-7 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
            <button onClick={() => onNavigate('home')} className="hover:text-white">خانه</button><span>/</span>
            <button onClick={() => onNavigate('shop')} className="hover:text-white">قطعات</button><span>/</span>
            <span className="font-bold text-orange-300">برند قطعه</span><span>/</span><span className="text-white">{brand.nameFa}</span>
          </nav>

          <div className="flex flex-col justify-between gap-7 lg:flex-row lg:items-center">
            <div className="flex items-start gap-5">
              <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-2xl border border-white/15 bg-white p-3 shadow-2xl md:h-28 md:w-28">
                {brand.logo ? <img src={brand.logo} alt={brand.nameFa} className="h-full w-full object-contain" /> : <Factory className="h-10 w-10 text-slate-400" />}
              </div>
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2"><span className="rounded-full border border-orange-400/30 bg-orange-500/15 px-2.5 py-1 text-[10px] font-black text-orange-300">سازنده / برند قطعه</span>{brand.group && <span className="rounded-full border border-slate-700 bg-slate-800 px-2.5 py-1 text-[10px] text-slate-300">گروه {brand.group}</span>}</div>
                <h1 className="text-3xl font-black md:text-5xl">{brand.nameFa}</h1>
                <p className="mt-1 font-mono text-sm text-slate-400" dir="ltr">{brand.nameEn}</p>
                {brand.description && <div className="mt-4 max-w-3xl text-xs leading-7 text-slate-300"><RichTextContent content={brand.description} /></div>}
              </div>
            </div>

            <aside className="min-w-[270px] rounded-2xl border border-slate-700 bg-slate-900/80 p-4 text-xs backdrop-blur">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2"><span className="text-slate-400">محصولات فعال</span><strong className="text-orange-300">{brandProducts.length.toLocaleString('fa-IR')}</strong></div>
              {brand.country && <div className="mt-2 flex items-center justify-between"><span className="text-slate-400">مبدأ برند</span><strong>{brand.country}</strong></div>}
              {brand.foundedYear ? <div className="mt-2 flex items-center justify-between"><span className="text-slate-400">سال تأسیس</span><strong>{brand.foundedYear.toLocaleString('fa-IR')}</strong></div> : null}
              {brand.websiteUrl && <a href={brand.websiteUrl} target="_blank" rel="noopener noreferrer" className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-white/10 px-3 py-2 font-bold hover:bg-white/15"><Globe2 className="h-4 w-4" /> وب‌سایت رسمی <ExternalLink className="h-3 w-3" /></a>}
              {adminAuth?.isAuthenticated && <button onClick={() => onNavigate('admin', `part-brand:${brand.id}`)} className="mt-2 w-full rounded-xl bg-orange-600 px-3 py-2 font-black text-white">ویرایش همین برند قطعه</button>}
            </aside>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl space-y-12 px-4 py-10">
        {(brand.specialties?.length || brand.certifications?.length) ? (
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {brand.specialties?.length ? <div className="rounded-2xl border border-orange-100 bg-orange-50/50 p-5"><h2 className="flex items-center gap-2 text-sm font-black"><Wrench className="h-4 w-4 text-orange-600" /> حوزه‌های تخصصی {brand.nameFa}</h2><div className="mt-3 flex flex-wrap gap-2">{brand.specialties.map(item => <span key={item} className="rounded-lg bg-white px-2.5 py-1.5 text-[11px] font-bold text-neutral-700 shadow-sm">{item}</span>)}</div></div> : null}
            {brand.certifications?.length ? <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5"><h2 className="flex items-center gap-2 text-sm font-black"><BadgeCheck className="h-4 w-4 text-emerald-600" /> استانداردها و گواهی‌ها</h2><div className="mt-3 flex flex-wrap gap-2">{brand.certifications.map(item => <span key={item} className="rounded-lg bg-white px-2.5 py-1.5 text-[11px] font-bold text-neutral-700 shadow-sm">{item}</span>)}</div></div> : null}
          </section>
        ) : null}

        <section>
          <div className="mb-5 flex items-end justify-between gap-3"><div><h2 className="flex items-center gap-2 text-xl font-black"><Boxes className="h-5 w-5 text-orange-600" /> محصولات {brand.nameFa}</h2><p className="mt-1 text-xs text-neutral-500">تمام قطعاتی که مستقیماً به این برند سازنده متصل شده‌اند.</p></div><span className="text-xs font-bold text-neutral-400">{brandProducts.length.toLocaleString('fa-IR')} قلم</span></div>
          {brandProducts.length ? <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">{brandProducts.map(product => <ProductCard key={product.id} product={product} onViewDetails={id => onNavigate('product', id)} />)}</div> : <div className="rounded-2xl border border-dashed p-10 text-center text-xs text-neutral-400">هنوز محصول فعالی به این برند متصل نشده است.</div>}
        </section>

        {linkedCategories.length > 0 && <section className="rounded-3xl border border-neutral-200 bg-white p-6"><h2 className="flex items-center gap-2 text-lg font-black"><Layers3 className="h-5 w-5 text-orange-600" /> دسته‌بندی‌های مرتبط</h2><div className="mt-4 flex flex-wrap gap-2">{linkedCategories.map((category: any) => <button key={category.id} onClick={() => onNavigate('category', category.slug)} className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-bold hover:border-orange-400 hover:text-orange-700">{category.nameFa}</button>)}</div></section>}

        {(linkedVehicleBrands.length > 0 || linkedModels.length > 0) && <section className="rounded-3xl border border-blue-100 bg-blue-50/40 p-6"><h2 className="flex items-center gap-2 text-lg font-black"><Car className="h-5 w-5 text-blue-600" /> خودروها و مدل‌های مرتبط با محصولات این برند</h2><p className="mt-1 text-xs text-neutral-500">این ارتباط از فیتمنت واقعی محصولات ثبت‌شده استخراج می‌شود.</p><div className="mt-4 flex flex-wrap gap-2">{linkedVehicleBrands.map((item: any) => <button key={item.id} onClick={() => onNavigate('car-brand', item.slug || item.id)} className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-bold shadow-sm">{item.logo && <img src={item.logo} alt="" className="h-5 w-5 object-contain" />}{item.nameFa}</button>)}{linkedModels.slice(0, 20).map((item: any) => <button key={item.id} onClick={() => onNavigate('car-model', item.slug || item.id)} className="rounded-xl border border-blue-100 bg-white px-3 py-2 text-xs font-bold text-blue-800">{item.nameFa}</button>)}</div></section>}

        {brand.bottomDescription && <section className="rounded-3xl border border-neutral-200 bg-white p-6 md:p-8"><h2 className="mb-4 flex items-center gap-2 text-lg font-black"><ShieldCheck className="h-5 w-5 text-orange-600" /> راهنمای تخصصی برند {brand.nameFa}</h2><RichTextContent content={brand.bottomDescription} className="leading-8 text-neutral-700" /></section>}

        {brand.faq?.length > 0 && <section className="rounded-3xl border border-neutral-200 bg-white p-6 md:p-8"><h2 className="flex items-center gap-2 text-lg font-black"><HelpCircle className="h-5 w-5 text-orange-600" /> سؤالات متداول درباره {brand.nameFa}</h2><div className="mt-4 space-y-3">{brand.faq.map((item, index) => <article key={index} className="rounded-xl bg-neutral-50 p-4"><h3 className="text-sm font-black">{item.q}</h3><p className="mt-2 text-xs leading-7 text-neutral-600">{item.a}</p></article>)}</div></section>}
      </main>
    </div>
  );
};
