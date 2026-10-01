import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { CarBrand, VehicleModel } from '../../types';
import { ImageUploadInput } from '../common/ImageUploadInput';
import { AdminEntitySeoPanel } from './AdminEntitySeoPanel';
import { 
  Car, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Search, 
  Building2, 
  Layers, 
  ChevronDown,
  ExternalLink,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';

export const AdminCarsTab: React.FC = () => {
  const { 
    brands, 
    addBrand, 
    updateBrand, 
    deleteBrand, 
    models, 
    addModel, 
    updateModel, 
    deleteModel,
    products,
    showToast 
  } = useStore();

  const [activeSubTab, setActiveSubTab] = useState<'brands' | 'models'>('models');
  const [selectedBrandFilter, setSelectedBrandFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<CarBrand | null>(null);
  const [brandForm, setBrandForm] = useState<Partial<CarBrand>>({
    nameFa: '',
    nameEn: '',
    slug: '',
    country: 'چین',
    foundedYear: 1997,
    officialRepresentative: '',
    logo: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=200&auto=format&fit=crop&q=80',
    heroImage: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=1200&auto=format&fit=crop&q=80',
    description: '',
    bottomDescription: '',
    seo: undefined
  });

  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<VehicleModel | null>(null);
  const [modelForm, setModelForm] = useState<Partial<VehicleModel>>({
    brandId: 'kmc',
    nameFa: '',
    nameEn: '',
    slug: '',
    imageUrl: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800&auto=format&fit=crop&q=80',
    yearFrom: 1400,
    yearTo: 1404,
    bodyType: 'سدان',
    engineSummary: '1.5 Turbo GDI',
    transmissionSummary: '6 سرعته DCT دوکلاچه',
    description: '',
    specifications: {
      engineCode: 'HFC4GB2.4E',
      displacement: '1499 cc',
      horsepower: '172 hp',
      torque: '280 Nm',
      transmission: 'DCT اتوماتیک',
      fuelConsumption: '7.0 L/100km'
    },
    commonIssues: ['سرویس به‌موقع روغن گیربکس دوکلاچه', 'تعویض دوره‌ای فیلتر بنزین فابریک'],
    maintenanceTips: ['استفاده از بنزین سوپر یا مکمل استاندارد برای پیشرانه‌های توربو GDI'],
    faq: []
  });

  // Filtered lists
  const filteredBrands = brands.filter(b => 
    b.nameFa.includes(searchQuery) || b.nameEn.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredModels = models.filter(m => {
    const matchesBrand = selectedBrandFilter === 'all' || m.brandId === selectedBrandFilter;
    const matchesSearch = m.nameFa.includes(searchQuery) || m.nameEn.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesBrand && matchesSearch;
  });

  // Handlers
  const handleOpenNewBrand = () => {
    setEditingBrand(null);
    setBrandForm({
      nameFa: '',
      nameEn: '',
      slug: '',
      country: 'چین',
      foundedYear: 2000,
      officialRepresentative: 'کرمان موتور / مدیران خودرو',
      logo: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=200&auto=format&fit=crop&q=80',
      heroImage: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=1200&auto=format&fit=crop&q=80',
      description: 'شرکت خودروسازی معتبر و فعال در بازار ایران',
      bottomDescription: '',
      seo: undefined
    });
    setIsBrandModalOpen(true);
  };

  const handleEditBrand = (brand: CarBrand) => {
    setEditingBrand(brand);
    setBrandForm(brand);
    setIsBrandModalOpen(true);
  };

  const handleSaveBrand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandForm.nameFa || !brandForm.slug) {
      showToast('نام فارسی و اسلاگ برند الزامی است.', 'error');
      return;
    }

    if (editingBrand) {
      updateBrand({
        ...editingBrand,
        ...brandForm as CarBrand
      });
    } else {
      const newBrand: CarBrand = {
        id: (brandForm.slug || `brand-${Date.now()}`).toLowerCase(),
        nameFa: brandForm.nameFa,
        nameEn: brandForm.nameEn || brandForm.nameFa,
        slug: brandForm.slug.toLowerCase().replace(/\s+/g, '-'),
        logo: brandForm.logo || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=200&auto=format&fit=crop&q=80',
        heroImage: brandForm.heroImage || 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=1200&auto=format&fit=crop&q=80',
        description: brandForm.description || '',
        bottomDescription: brandForm.bottomDescription || '',
        seo: brandForm.seo,
        country: brandForm.country || 'چین',
        foundedYear: Number(brandForm.foundedYear) || 2000,
        officialRepresentative: brandForm.officialRepresentative || '',
        faq: []
      };
      addBrand(newBrand);
    }
    setIsBrandModalOpen(false);
  };

  const handleDeleteBrand = (id: string, name: string) => {
    if (confirm(`آیا از حذف برند "${name}" و تمامی خودروهای زیرمجموعه آن اطمینان دارید؟`)) {
      deleteBrand(id);
    }
  };

  const handleOpenNewModel = () => {
    setEditingModel(null);
    setModelForm({
      brandId: brands[0]?.id || 'kmc',
      nameFa: '',
      nameEn: '',
      slug: '',
      imageUrl: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800&auto=format&fit=crop&q=80',
      yearFrom: 1401,
      yearTo: 1404,
      bodyType: 'کراس‌اوور',
      engineSummary: '1.5 Turbo',
      transmissionSummary: 'اتوماتیک',
      description: 'خودروی محبوب بازار با پشتیبانی قطعات کامل',
      specifications: {
        engineCode: 'TURBO-1.5',
        displacement: '1498 cc',
        horsepower: '156 hp',
        torque: '230 Nm',
        transmission: 'CVT 9 سرعته شبیه‌سازی شده',
        fuelConsumption: '7.2 L/100km'
      },
      commonIssues: ['سرویس روغن گیربکس در ۵۰ هزار کیلومتر'],
      maintenanceTips: ['استفاده از شمع‌های سوزنی ایریدیوم فابریک'],
      faq: []
    });
    setIsModelModalOpen(true);
  };

  const handleEditModel = (model: VehicleModel) => {
    setEditingModel(model);
    setModelForm(model);
    setIsModelModalOpen(true);
  };

  const handleSaveModel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modelForm.nameFa || !modelForm.brandId) {
      showToast('نام خودرو و برند انتخابی الزامی است.', 'error');
      return;
    }

    if (editingModel) {
      updateModel({
        ...editingModel,
        ...modelForm as VehicleModel
      });
    } else {
      const generatedSlug = (modelForm.slug || modelForm.nameEn || `model-${Date.now()}`)
        .toLowerCase()
        .replace(/\s+/g, '-');
      const newModel: VehicleModel = {
        id: generatedSlug,
        brandId: modelForm.brandId,
        nameFa: modelForm.nameFa,
        nameEn: modelForm.nameEn || modelForm.nameFa,
        slug: generatedSlug,
        imageUrl: modelForm.imageUrl || 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800&auto=format&fit=crop&q=80',
        yearFrom: Number(modelForm.yearFrom) || 1400,
        yearTo: Number(modelForm.yearTo) || 1404,
        bodyType: (modelForm.bodyType as any) || 'کراس‌اوور',
        engineSummary: modelForm.engineSummary || '1.5 Turbo',
        transmissionSummary: modelForm.transmissionSummary || 'اتوماتیک',
        description: modelForm.description || '',
        specifications: modelForm.specifications || {
          engineCode: '1.5-T',
          displacement: '1500 cc',
          horsepower: '160 hp',
          torque: '240 Nm',
          transmission: 'اتوماتیک',
          fuelConsumption: '7.5 L/100km'
        },
        commonIssues: modelForm.commonIssues || [],
        maintenanceTips: modelForm.maintenanceTips || [],
        faq: []
      };
      addModel(newModel);
    }
    setIsModelModalOpen(false);
  };

  const handleDeleteModel = (id: string, name: string) => {
    if (confirm(`آیا از حذف مدل خودرو "${name}" از سیستم اطمینان دارید؟`)) {
      deleteModel(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner and Actions */}
      <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full">
              سیستم جامع فیتمنت و سازگاری خودروها
            </span>
          </div>
          <h2 className="text-xl font-black text-neutral-900 flex items-center gap-2">
            <Car className="w-6 h-6 text-red-600" />
            <span>مدیریت شرکت‌ها، برندها و مدل‌های خودرو</span>
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            امکان تعریف، ویرایش و حذف نامحدود برندهای چینی (KMC, Chery, MVM, Lamari, ...) و تیپ‌های خودرو با مشخصات فنی
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleOpenNewBrand}
            className="px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
          >
            <Building2 className="w-4 h-4 text-red-500" />
            <span>افزودن برند خودروساز</span>
          </button>

          <button
            onClick={handleOpenNewModel}
            className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-600/20 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>افزودن مدل خودرو جدید</span>
          </button>
        </div>
      </div>

      {/* Sub-tabs and Search */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('models')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'models'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            <Car className="w-4 h-4" />
            <span>مدل‌های خودرو ({models.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('brands')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'brands'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>برندها و شرکت‌ها ({brands.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          {activeSubTab === 'models' && (
            <select
              value={selectedBrandFilter}
              onChange={e => setSelectedBrandFilter(e.target.value)}
              className="p-2 border border-neutral-200 rounded-xl text-xs bg-white text-neutral-700"
            >
              <option value="all">همه برندها ({brands.length})</option>
              {brands.map(b => (
                <option key={b.id} value={b.id}>{b.nameFa}</option>
              ))}
            </select>
          )}

          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute right-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="جستجوی نام یا مدل..."
              className="pr-9 pl-3 py-2 border border-neutral-200 rounded-xl text-xs focus:border-red-600 focus:outline-hidden w-48 sm:w-56"
            />
          </div>
        </div>
      </div>

      {/* SUBTAB 1: MODELS LIST */}
      {activeSubTab === 'models' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredModels.map(model => {
            const brand = brands.find(b => b.id === model.brandId);
            const fitCount = products.filter(p => p.fitments.some(f => f.modelId === model.id || f.modelName.includes(model.nameEn))).length;

            return (
              <div 
                key={model.id}
                className="bg-white rounded-3xl border border-neutral-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-44 bg-neutral-100 overflow-hidden">
                    <img 
                      src={model.imageUrl} 
                      alt={model.nameFa}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" 
                    />
                    <div className="absolute top-3 right-3 bg-neutral-900/80 backdrop-blur-xs text-white px-2.5 py-1 rounded-lg text-[10px] font-bold">
                      {brand?.nameFa || model.brandId.toUpperCase()}
                    </div>
                    <div className="absolute bottom-3 right-3 bg-red-600 text-white px-2 py-0.5 rounded text-[10px] font-bold">
                      {model.bodyType}
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="font-black text-base text-neutral-900">{model.nameFa}</h3>
                        <span className="text-xs font-mono font-bold text-neutral-400">{model.nameEn}</span>
                      </div>
                      <p className="text-xs text-neutral-500 mt-1 line-clamp-2">{model.description}</p>
                    </div>

                    <div className="bg-neutral-50 rounded-2xl p-3 border border-neutral-100 grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-neutral-400 block text-[10px]">پیشرانه:</span>
                        <strong className="text-neutral-800">{model.engineSummary}</strong>
                      </div>
                      <div>
                        <span className="text-neutral-400 block text-[10px]">گیربکس:</span>
                        <strong className="text-neutral-800">{model.transmissionSummary}</strong>
                      </div>
                      <div>
                        <span className="text-neutral-400 block text-[10px]">سال‌های ساخت:</span>
                        <strong className="text-neutral-800">{model.yearFrom} تا {model.yearTo || 'اکنون'}</strong>
                      </div>
                      <div>
                        <span className="text-neutral-400 block text-[10px]">قطعات سازگار:</span>
                        <strong className="text-emerald-700">{fitCount} قطعه موجود</strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-neutral-50 border-t border-neutral-100 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-neutral-400 font-mono">اسلاگ: /{model.slug}</span>
                  <div className="flex items-center gap-1.5">
                    <a
                      href={`/car-model/${encodeURIComponent(model.slug || model.id)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-white hover:bg-emerald-50 border border-neutral-200 text-emerald-700 rounded-xl transition-colors"
                      title="نمایش مستقیم خودرو در صفحه جدید"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={() => handleEditModel(model)}
                      className="p-2 bg-white hover:bg-neutral-200 border border-neutral-200 text-neutral-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                      title="ویرایش خودرو"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                      <span>ویرایش</span>
                    </button>
                    <button
                      onClick={() => handleDeleteModel(model.id, model.nameFa)}
                      className="p-2 bg-white hover:bg-red-50 border border-neutral-200 text-red-600 rounded-xl text-xs font-bold transition-colors"
                      title="حذف خودرو"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SUBTAB 2: BRANDS LIST */}
      {activeSubTab === 'brands' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBrands.map(brand => {
            const brandModels = models.filter(m => m.brandId === brand.id);
            return (
              <div 
                key={brand.id}
                className="bg-white rounded-3xl border border-neutral-200 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-neutral-100 border border-neutral-200 p-2 flex items-center justify-center shrink-0">
                      <img src={brand.logo} alt={brand.nameFa} className="max-w-full max-h-full object-contain" />
                    </div>
                    <div>
                      <h3 className="font-black text-base text-neutral-900">{brand.nameFa}</h3>
                      <p className="text-xs text-neutral-400 font-mono">{brand.nameEn}</p>
                    </div>
                  </div>

                  <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed">
                    {brand.description}
                  </p>

                  <div className="bg-neutral-50 rounded-2xl p-3 border border-neutral-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-neutral-400 block text-[10px]">نماینده رسمی در ایران:</span>
                      <strong className="text-neutral-800">{brand.officialRepresentative || 'واردات مستقیم'}</strong>
                    </div>
                    <div className="text-left">
                      <span className="text-neutral-400 block text-[10px]">تعداد مدل‌ها:</span>
                      <strong className="text-red-600 font-bold">{brandModels.length} مدل</strong>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-neutral-100 flex items-center justify-between">
                  <span className="text-[10px] text-neutral-400 font-mono">شناسه: {brand.id}</span>
                  <div className="flex items-center gap-1.5">
                    <a
                      href={`/brand/${encodeURIComponent(brand.slug || brand.id)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl transition-colors"
                      title="نمایش مستقیم برند در صفحه جدید"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => handleEditBrand(brand)}
                      className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                      <span>ویرایش</span>
                    </button>
                    <button
                      onClick={() => handleDeleteBrand(brand.id, brand.nameFa)}
                      className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors"
                      title="حذف برند"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================= MODAL: ADD / EDIT BRAND ================= */}
      {isBrandModalOpen && (
        <div className="fixed inset-0 z-[220] bg-black/60 backdrop-blur-xs flex items-start justify-center px-3 sm:px-4 pt-4 sm:pt-8 pb-8 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-neutral-200 max-w-4xl w-full p-6 shadow-2xl space-y-5 max-h-[calc(100vh-3rem)] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="font-black text-base text-neutral-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-red-600" />
                <span>{editingBrand ? `ویرایش برند ${editingBrand.nameFa}` : 'تعریف برند خودروساز جدید'}</span>
              </h3>
              <button
                onClick={() => setIsBrandModalOpen(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBrand} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">نام فارسی برند (مثال: فونیکس):</label>
                  <input
                    type="text"
                    value={brandForm.nameFa}
                    onChange={e => setBrandForm({ ...brandForm, nameFa: e.target.value })}
                    placeholder="کی‌ام‌سی (KMC)"
                    className="w-full p-2.5 border border-neutral-300 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">نام انگلیسی برند:</label>
                  <input
                    type="text"
                    value={brandForm.nameEn}
                    onChange={e => setBrandForm({ ...brandForm, nameEn: e.target.value })}
                    placeholder="KMC"
                    className="w-full p-2.5 border border-neutral-300 rounded-xl font-mono text-left"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">اسلاگ URL (یکتا و انگلیسی):</label>
                  <input
                    type="text"
                    value={brandForm.slug}
                    onChange={e => setBrandForm({ ...brandForm, slug: e.target.value })}
                    placeholder="kmc"
                    className="w-full p-2.5 border border-neutral-300 rounded-xl font-mono text-left"
                    required
                  />
                </div>
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">نماینده رسمی / مونتاژکننده:</label>
                  <input
                    type="text"
                    value={brandForm.officialRepresentative}
                    onChange={e => setBrandForm({ ...brandForm, officialRepresentative: e.target.value })}
                    placeholder="کرمان موتور"
                    className="w-full p-2.5 border border-neutral-300 rounded-xl"
                  />
                </div>
              </div>

              <ImageUploadInput
                label="لوگو و نشان تجاری برند (امکان آپلود مستقیم یا انتخاب آماده):"
                value={brandForm.logo || ''}
                onChange={url => setBrandForm({ ...brandForm, logo: url })}
                presetCategory="logos"
                aspectRatio="square"
                placeholder="آپلود فایل لوگوی برند یا آدرس تصویر..."
                helperText="لوگوی بارگذاری‌شده در منوها، صفحه برند و هدر فروشگاه نمایش داده می‌شود."
              />

              <ImageUploadInput
                label="تصویر Hero صفحه برند:"
                value={brandForm.heroImage || ''}
                onChange={url => setBrandForm({ ...brandForm, heroImage: url })}
                presetCategory="banners"
                aspectRatio="banner"
                placeholder="تصویر عریض برند..."
                helperText="در بالای صفحه برند، پشت عنوان و معرفی برند نمایش داده می‌شود."
              />

              <div>
                <label className="block text-neutral-700 font-bold mb-1">توضیح کوتاه بالای صفحه برند:</label>
                <textarea
                  rows={3}
                  value={brandForm.description || ''}
                  onChange={e => setBrandForm({ ...brandForm, description: e.target.value })}
                  placeholder="معرفی کوتاه برند و قطعات آن..."
                  className="w-full p-2.5 border border-neutral-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-neutral-700 font-bold mb-1">محتوای کامل پایین صفحه برند:</label>
                <textarea
                  rows={6}
                  value={brandForm.bottomDescription || ''}
                  onChange={e => setBrandForm({ ...brandForm, bottomDescription: e.target.value })}
                  placeholder="راهنمای خرید، توضیحات تخصصی و محتوای سئویی که بعد از محصولات نمایش داده می‌شود..."
                  className="w-full p-2.5 border border-neutral-300 rounded-xl"
                />
              </div>

              <AdminEntitySeoPanel
                entityType="brand"
                entityId={editingBrand?.id}
                entityTitle={brandForm.nameFa || 'برند خودرو'}
                value={brandForm.seo}
                images={[brandForm.logo || '', brandForm.heroImage || ''].filter(Boolean)}
                onChange={seo => setBrandForm({ ...brandForm, seo })}
              />

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBrandModalOpen(false)}
                  className="flex-1 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-md"
                >
                  ذخیره اطلاعات برند
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD / EDIT MODEL ================= */}
      {isModelModalOpen && (
        <div className="fixed inset-0 z-[220] bg-black/60 backdrop-blur-xs flex items-start justify-center px-3 sm:px-4 pt-4 sm:pt-8 pb-8 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-neutral-200 max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[calc(100vh-3rem)] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="font-black text-base text-neutral-900 flex items-center gap-2">
                <Car className="w-5 h-5 text-red-600" />
                <span>{editingModel ? `ویرایش خودرو ${editingModel.nameFa}` : 'تعریف خودرو و مدل جدید'}</span>
              </h3>
              <button
                onClick={() => setIsModelModalOpen(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModel} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">برند مادر:</label>
                  <select
                    value={modelForm.brandId}
                    onChange={e => setModelForm({ ...modelForm, brandId: e.target.value })}
                    className="w-full p-2.5 border border-neutral-300 rounded-xl bg-white"
                    required
                  >
                    {brands.map(b => (
                      <option key={b.id} value={b.id}>{b.nameFa} ({b.nameEn})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-700 font-bold mb-1">کلاس بدنه:</label>
                  <select
                    value={modelForm.bodyType}
                    onChange={e => setModelForm({ ...modelForm, bodyType: e.target.value as any })}
                    className="w-full p-2.5 border border-neutral-300 rounded-xl bg-white"
                  >
                    <option value="سدان">سدان</option>
                    <option value="کراس‌اوور">کراس‌اوور</option>
                    <option value="شاسی‌بلند">شاسی‌بلند</option>
                    <option value="پیکاپ">پیکاپ</option>
                    <option value="هاچ‌بک">هاچ‌بک</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">نام فارسی خودرو (مثال: کی‌ام‌سی J7):</label>
                  <input
                    type="text"
                    value={modelForm.nameFa}
                    onChange={e => setModelForm({ ...modelForm, nameFa: e.target.value })}
                    placeholder="کی‌ام‌سی J7"
                    className="w-full p-2.5 border border-neutral-300 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">نام انگلیسی خودرو:</label>
                  <input
                    type="text"
                    value={modelForm.nameEn}
                    onChange={e => setModelForm({ ...modelForm, nameEn: e.target.value })}
                    placeholder="KMC J7"
                    className="w-full p-2.5 border border-neutral-300 rounded-xl font-mono text-left"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">پیشرانه و حجم موتور:</label>
                  <input
                    type="text"
                    value={modelForm.engineSummary}
                    onChange={e => setModelForm({ ...modelForm, engineSummary: e.target.value })}
                    placeholder="1.5 Turbo GDI"
                    className="w-full p-2.5 border border-neutral-300 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">نوع گیربکس:</label>
                  <input
                    type="text"
                    value={modelForm.transmissionSummary}
                    onChange={e => setModelForm({ ...modelForm, transmissionSummary: e.target.value })}
                    placeholder="اتوماتیک دوکلاچه تر"
                    className="w-full p-2.5 border border-neutral-300 rounded-xl"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">سال شروع مونتاژ/واردات:</label>
                  <input
                    type="number"
                    value={modelForm.yearFrom}
                    onChange={e => setModelForm({ ...modelForm, yearFrom: Number(e.target.value) })}
                    placeholder="1401"
                    className="w-full p-2.5 border border-neutral-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">سال پایان (یا سال جاری):</label>
                  <input
                    type="number"
                    value={modelForm.yearTo}
                    onChange={e => setModelForm({ ...modelForm, yearTo: Number(e.target.value) })}
                    placeholder="1404"
                    className="w-full p-2.5 border border-neutral-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <ImageUploadInput
                label="تصویر باکیفیت خودرو (آپلود فایل یا انتخاب):"
                value={modelForm.imageUrl || ''}
                onChange={url => setModelForm({ ...modelForm, imageUrl: url })}
                presetCategory="banners"
                aspectRatio="video"
                placeholder="آپلود عکس خودرو یا آدرس اینترنتی..."
              />

              <div>
                <label className="block text-neutral-700 font-bold mb-1">توضیحات و راهنمای خرید قطعات خودرو:</label>
                <textarea
                  rows={2}
                  value={modelForm.description}
                  onChange={e => setModelForm({ ...modelForm, description: e.target.value })}
                  placeholder="مشخصات کلی، تیپ‌های موجود در بازار ایران و نکات فنی..."
                  className="w-full p-2.5 border border-neutral-300 rounded-xl"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModelModalOpen(false)}
                  className="flex-1 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-md"
                >
                  ذخیره خودرو در دیتابیس
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
