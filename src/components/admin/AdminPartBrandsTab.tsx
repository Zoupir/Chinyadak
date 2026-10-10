import React, { useEffect, useMemo, useState } from 'react';
import { BadgeCheck, Building2, ExternalLink, Factory, Globe2, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import type { PartBrand } from '../../types';
import { ImageUploadInput } from '../common/ImageUploadInput';
import { RichTextEditor } from '../common/RichTextEditor';
import { AdminEntitySeoPanel } from './AdminEntitySeoPanel';

interface AdminPartBrandsTabProps {
  initialBrandId?: string;
}

const emptyBrand = (): Partial<PartBrand> => ({
  nameFa: '',
  nameEn: '',
  slug: '',
  logo: '',
  heroImage: '',
  description: '',
  bottomDescription: '',
  country: '',
  foundedYear: 0,
  websiteUrl: '',
  group: '',
  specialties: [],
  certifications: [],
  popularCategorySlugs: [],
  faq: []
});

const splitLines = (value: string): string[] => value
  .split(/[\n،,]+/)
  .map(item => item.trim())
  .filter(Boolean);

export const AdminPartBrandsTab: React.FC<AdminPartBrandsTabProps> = ({ initialBrandId }) => {
  const { partBrands, products, addPartBrand, updatePartBrand, deletePartBrand, showToast } = useStore();
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<PartBrand | null>(null);
  const [form, setForm] = useState<Partial<PartBrand>>(emptyBrand());
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return partBrands;
    return partBrands.filter((brand: PartBrand) =>
      brand.nameFa.toLowerCase().includes(needle) ||
      brand.nameEn.toLowerCase().includes(needle) ||
      brand.slug.toLowerCase().includes(needle) ||
      String(brand.country || '').toLowerCase().includes(needle)
    );
  }, [partBrands, query]);

  const productCount = (brandId: string) => products.filter((product: any) => product.partBrandIds?.includes(brandId)).length;

  const openNew = () => {
    setEditing(null);
    setForm(emptyBrand());
    setOpen(true);
  };

  const openEdit = (brand: PartBrand) => {
    setEditing(brand);
    setForm({ ...brand });
    setOpen(true);
  };

  useEffect(() => {
    if (!initialBrandId || !partBrands.length) return;
    const target = partBrands.find((item: PartBrand) => item.id === initialBrandId || item.slug === initialBrandId);
    if (target) openEdit(target);
  }, [initialBrandId, partBrands.length]);

  const patch = (next: Partial<PartBrand>) => setForm(current => ({ ...current, ...next }));

  const save = (event: React.FormEvent) => {
    event.preventDefault();
    const nameFa = String(form.nameFa || '').trim();
    const slug = String(form.slug || '').trim().toLowerCase().replace(/\s+/g, '-');
    if (!nameFa || !slug) {
      showToast('نام فارسی و اسلاگ برند قطعه الزامی است.', 'error');
      return;
    }
    const payload: PartBrand = {
      id: editing?.id || slug,
      nameFa,
      nameEn: String(form.nameEn || '').trim() || nameFa,
      slug,
      logo: String(form.logo || ''),
      heroImage: String(form.heroImage || ''),
      description: String(form.description || ''),
      bottomDescription: String(form.bottomDescription || ''),
      country: String(form.country || ''),
      foundedYear: Number(form.foundedYear || 0),
      websiteUrl: String(form.websiteUrl || ''),
      group: String(form.group || ''),
      specialties: form.specialties || [],
      certifications: form.certifications || [],
      popularCategorySlugs: form.popularCategorySlugs || [],
      faq: form.faq || [],
      seo: form.seo
    };
    if (editing) updatePartBrand(payload);
    else addPartBrand(payload);
    setOpen(false);
  };

  const remove = (brand: PartBrand) => {
    const count = productCount(brand.id);
    if (!confirm(`برند قطعه «${brand.nameFa}» حذف شود؟${count ? ` این برند به ${count.toLocaleString('fa-IR')} محصول متصل است و محصولات حذف نمی‌شوند.` : ''}`)) return;
    deletePartBrand(brand.id);
  };

  return (
    <div className="space-y-6" data-admin-part-brands="1">
      <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-black text-orange-700">
              <Factory className="h-3.5 w-3.5" /> تاکسونومی مستقل سازندگان قطعه
            </span>
            <h2 className="mt-2 text-xl font-black text-neutral-900">مدیریت برندهای قطعات و سازندگان</h2>
            <p className="mt-1 max-w-3xl text-xs leading-6 text-neutral-500">هر محصول می‌تواند به یک یا چند برند قطعه متصل باشد. صفحه اختصاصی، لوگو، هدر، محتوای معرفی، FAQ و TakRank SEO برای هر برند مستقل مدیریت می‌شود.</p>
          </div>
          <button type="button" onClick={openNew} className="inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-900 px-4 py-3 text-xs font-black text-white">
            <Plus className="h-4 w-4" /> افزودن برند قطعه
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-4">
        <div className="relative max-w-md">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input value={query} onChange={event => setQuery(event.currentTarget.value)} placeholder="جستجوی برند قطعه..." className="w-full rounded-xl border border-neutral-200 py-2.5 pr-9 pl-3 text-xs outline-none focus:border-orange-500" />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((brand: PartBrand) => {
          const count = productCount(brand.id);
          return (
            <article key={brand.id} className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
              <div className="relative h-28 bg-gradient-to-l from-neutral-950 to-neutral-800">
                {brand.heroImage && <img src={brand.heroImage} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" />}
                <div className="absolute inset-x-4 bottom-3 flex items-end gap-3">
                  <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-xl border border-white/20 bg-white p-2 shadow-lg">
                    {brand.logo ? <img src={brand.logo} alt={brand.nameFa} className="h-full w-full object-contain" /> : <Factory className="h-7 w-7 text-neutral-400" />}
                  </div>
                  <div className="min-w-0 pb-1 text-white"><h3 className="truncate text-sm font-black">{brand.nameFa}</h3><p className="truncate text-[10px] text-neutral-300">{brand.nameEn}</p></div>
                </div>
              </div>
              <div className="space-y-3 p-4">
                <div className="flex flex-wrap gap-2 text-[10px]">
                  <span className="rounded-lg bg-neutral-100 px-2 py-1 font-bold text-neutral-700">{count.toLocaleString('fa-IR')} محصول</span>
                  {brand.country && <span className="rounded-lg bg-blue-50 px-2 py-1 text-blue-700">{brand.country}</span>}
                  {brand.group && <span className="rounded-lg bg-orange-50 px-2 py-1 text-orange-700">گروه {brand.group}</span>}
                </div>
                <p className="line-clamp-2 min-h-10 text-[11px] leading-5 text-neutral-500">{String(brand.description || '').replace(/<[^>]+>/g, ' ')}</p>
                <div className="flex flex-wrap gap-2 border-t border-neutral-100 pt-3">
                  <button type="button" onClick={() => openEdit(brand)} className="inline-flex items-center gap-1 rounded-lg bg-neutral-900 px-3 py-2 text-[10px] font-bold text-white"><Pencil className="h-3 w-3" /> ویرایش</button>
                  <button type="button" onClick={() => window.open(`/part-brand/${encodeURIComponent(brand.slug)}`, '_blank')} className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-[10px] font-bold text-neutral-700"><ExternalLink className="h-3 w-3" /> صفحه برند</button>
                  <button type="button" onClick={() => remove(brand)} className="mr-auto inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-2 text-[10px] font-bold text-red-700"><Trash2 className="h-3 w-3" /> حذف</button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {open && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/60 p-3" onClick={() => setOpen(false)}>
          <form onSubmit={save} className="max-h-[94dvh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl" onClick={event => event.stopPropagation()}>
            <header className="mb-5 flex items-center justify-between gap-3 border-b pb-4">
              <div><h3 className="text-lg font-black">{editing ? `ویرایش ${editing.nameFa}` : 'برند قطعه جدید'}</h3><p className="mt-1 text-[10px] text-neutral-500">اطلاعات عمومی، محتوای صفحه، رسانه و سئوی برند قطعه</p></div>
              <button type="button" onClick={() => setOpen(false)} className="grid h-9 w-9 place-items-center rounded-full bg-neutral-100"><X className="h-4 w-4" /></button>
            </header>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="text-xs font-bold">نام فارسی<input required value={form.nameFa || ''} onChange={e => patch({ nameFa: e.target.value })} className="mt-1 w-full rounded-xl border p-2.5 font-normal" /></label>
              <label className="text-xs font-bold">نام انگلیسی<input value={form.nameEn || ''} onChange={e => patch({ nameEn: e.target.value })} className="mt-1 w-full rounded-xl border p-2.5 font-normal" dir="ltr" /></label>
              <label className="text-xs font-bold">اسلاگ<input required value={form.slug || ''} onChange={e => patch({ slug: e.target.value })} className="mt-1 w-full rounded-xl border p-2.5 font-mono font-normal" dir="ltr" /></label>
              <label className="text-xs font-bold">کشور / مبدأ برند<input value={form.country || ''} onChange={e => patch({ country: e.target.value })} className="mt-1 w-full rounded-xl border p-2.5 font-normal" /></label>
              <label className="text-xs font-bold">سال تأسیس<input type="number" value={form.foundedYear || ''} onChange={e => patch({ foundedYear: Number(e.target.value) })} className="mt-1 w-full rounded-xl border p-2.5 font-normal" /></label>
              <label className="text-xs font-bold">گروه / شرکت مادر<input value={form.group || ''} onChange={e => patch({ group: e.target.value })} className="mt-1 w-full rounded-xl border p-2.5 font-normal" /></label>
              <label className="md:col-span-2 text-xs font-bold">وب‌سایت رسمی<input value={form.websiteUrl || ''} onChange={e => patch({ websiteUrl: e.target.value })} className="mt-1 w-full rounded-xl border p-2.5 font-normal" dir="ltr" /></label>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
              <ImageUploadInput label="لوگوی برند قطعه" value={form.logo || ''} onChange={url => patch({ logo: url })} presetCategory="logos" aspectRatio="square" />
              <ImageUploadInput label="تصویر هدر صفحه برند" value={form.heroImage || ''} onChange={url => patch({ heroImage: url })} presetCategory="banners" aspectRatio="banner" />
            </div>

            <div className="mt-5 space-y-5">
              <RichTextEditor label="معرفی برند" value={form.description || ''} onChange={description => patch({ description })} rows={7} />
              <RichTextEditor label="راهنمای تخصصی و محتوای پایین صفحه" value={form.bottomDescription || ''} onChange={bottomDescription => patch({ bottomDescription })} rows={10} />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="text-xs font-bold">تخصص‌ها<textarea value={(form.specialties || []).join('\n')} onChange={e => patch({ specialties: splitLines(e.target.value) })} rows={5} className="mt-1 w-full rounded-xl border p-2.5 font-normal" placeholder="فیلتر، ترمز، سنسور..." /></label>
                <label className="text-xs font-bold">استانداردها و گواهی‌ها<textarea value={(form.certifications || []).join('\n')} onChange={e => patch({ certifications: splitLines(e.target.value) })} rows={5} className="mt-1 w-full rounded-xl border p-2.5 font-normal" placeholder="IATF 16949، ISO..." /></label>
              </div>
            </div>

            <section className="mt-6 rounded-2xl border border-neutral-200 p-4">
              <div className="mb-3 flex items-center justify-between"><div><h4 className="text-sm font-black">سؤالات متداول برند قطعه</h4><p className="text-[10px] text-neutral-500">FAQ در صفحه عمومی و Schema سئو استفاده می‌شود.</p></div><button type="button" onClick={() => patch({ faq: [...(form.faq || []), { q: '', a: '' }] })} className="rounded-lg bg-orange-50 px-3 py-2 text-[10px] font-bold text-orange-700"><Plus className="inline h-3 w-3" /> سؤال</button></div>
              <div className="space-y-3">
                {(form.faq || []).map((item, index) => (
                  <div key={index} className="rounded-xl bg-neutral-50 p-3">
                    <div className="flex gap-2"><input value={item.q} onChange={e => patch({ faq: (form.faq || []).map((faq, i) => i === index ? { ...faq, q: e.target.value } : faq) })} className="flex-1 rounded-lg border p-2 text-xs" placeholder="سؤال" /><button type="button" onClick={() => patch({ faq: (form.faq || []).filter((_, i) => i !== index) })} className="text-red-600"><Trash2 className="h-4 w-4" /></button></div>
                    <textarea value={item.a} onChange={e => patch({ faq: (form.faq || []).map((faq, i) => i === index ? { ...faq, a: e.target.value } : faq) })} rows={3} className="mt-2 w-full rounded-lg border p-2 text-xs" placeholder="پاسخ" />
                  </div>
                ))}
              </div>
            </section>

            <div className="mt-6">
              <AdminEntitySeoPanel
                entityType="part_brand"
                entityId={editing?.id}
                entityTitle={form.nameFa || 'برند قطعه'}
                value={form.seo}
                images={[form.logo || '', form.heroImage || ''].filter(Boolean)}
                onChange={seo => patch({ seo })}
                contentDraft={{ description: form.description, content: form.bottomDescription, data: form as Record<string, any> }}
              />
            </div>

            <footer className="mt-6 flex flex-wrap items-center justify-end gap-2 border-t pt-4">
              <button type="button" onClick={() => setOpen(false)} className="rounded-xl border px-5 py-2.5 text-xs font-bold">انصراف</button>
              <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-6 py-2.5 text-xs font-black text-white"><BadgeCheck className="h-4 w-4" /> ذخیره برند قطعه</button>
            </footer>
          </form>
        </div>
      )}
    </div>
  );
};
