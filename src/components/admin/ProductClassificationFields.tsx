import React, { useMemo } from 'react';
import { Car, Factory, FolderTree, PackageSearch } from 'lucide-react';
import type { CarBrand, Category, CategoryChild, Product, VehicleFitment, VehicleModel } from '../../types';

interface Props {
  value: Partial<Product>;
  onChange: (next: Partial<Product>) => void;
  categories: Category[];
  brands: CarBrand[];
  models: VehicleModel[];
  products: Product[];
}

interface CategoryOption {
  id: string;
  slug: string;
  nameFa: string;
  rootSlug: string;
  depth: number;
  path: string;
}

export const ProductClassificationFields: React.FC<Props> = ({
  value,
  onChange,
  categories,
  brands,
  models,
  products
}) => {
  const categoryOptions = useMemo<CategoryOption[]>(() => {
    const rows: CategoryOption[] = [];
    const walk = (nodes: CategoryChild[] = [], rootSlug: string, depth: number, trail: string[]) => {
      nodes.forEach(node => {
        rows.push({
          id: node.id,
          slug: node.slug,
          nameFa: node.nameFa,
          rootSlug,
          depth,
          path: [...trail, node.nameFa].join(' ← ')
        });
        walk(node.subcategories || [], rootSlug, depth + 1, [...trail, node.nameFa]);
      });
    };
    categories.forEach(root => {
      rows.push({
        id: root.id,
        slug: root.slug,
        nameFa: root.nameFa,
        rootSlug: root.slug,
        depth: 0,
        path: root.nameFa
      });
      walk(root.subcategories || [], root.slug, 1, [root.nameFa]);
    });
    return rows;
  }, [categories]);

  const selectedLeafSlug = value.subcategorySlug || value.categorySlug || '';
  const selectedEntry = categoryOptions.find(item => item.slug === selectedLeafSlug);
  const selectedRootSlug = selectedEntry?.rootSlug || value.categorySlug || categories[0]?.slug || '';
  const selectedRoot = categories.find(item => item.slug === selectedRootSlug);
  const descendants = categoryOptions.filter(item => item.rootSlug === selectedRootSlug && item.depth > 0);

  const selectedBrandIds = value.vehicleBrandIds || Array.from(new Set((value.fitments || []).map(item => item.brandId)));
  const selectedModelIds = value.vehicleModelIds || (value.fitments || []).map(item => item.modelId);

  const vehicleCompanies = useMemo(
    () => Array.from(new Set(
      brands.map(item => item.officialRepresentative || '').filter(Boolean)
    )).sort(),
    [brands]
  );

  const partCompanies = useMemo(
    () => Array.from(new Set(
      [
        ...products.map(item => item.partManufacturerCompany || item.brandManufacturer || ''),
        'Bosch',
        'Valeo',
        'Gates',
        'SKF',
        'MANN-FILTER',
        'Mahle',
        'Continental',
        'ZF',
        'Schaeffler',
        'INA',
        'NTN',
        'Denso',
        'NGK',
        'Brembo'
      ].filter(Boolean)
    )).sort(),
    [products]
  );

  const patch = (partial: Partial<Product>) => onChange({ ...value, ...partial });

  const selectRoot = (rootSlug: string) => {
    patch({ categorySlug: rootSlug, subcategorySlug: undefined });
  };

  const selectLeaf = (slug: string) => {
    const entry = categoryOptions.find(item => item.slug === slug);
    if (!entry) {
      patch({ subcategorySlug: undefined });
      return;
    }
    patch({
      categorySlug: entry.rootSlug,
      subcategorySlug: entry.depth > 0 ? entry.slug : undefined
    });
  };

  const toggleBrand = (brand: CarBrand, checked: boolean) => {
    const current = new Set(selectedBrandIds);
    if (checked) current.add(brand.id);
    else current.delete(brand.id);

    const allowedBrands = Array.from(current);
    const nextModelIds = selectedModelIds.filter(modelId => {
      const model = models.find(item => item.id === modelId);
      return model ? allowedBrands.includes(model.brandId) : false;
    });
    const nextFitments = (value.fitments || []).filter(item => allowedBrands.includes(item.brandId));

    patch({
      vehicleBrandIds: allowedBrands,
      vehicleModelIds: nextModelIds,
      fitments: nextFitments
    });
  };

  const toggleModel = (model: VehicleModel, checked: boolean) => {
    const brand = brands.find(item => item.id === model.brandId);
    const ids = new Set(selectedModelIds);
    const fitments = [...(value.fitments || [])];

    if (checked) {
      ids.add(model.id);
      if (!fitments.some(item => item.modelId === model.id)) {
        const fitment: VehicleFitment = {
          id: `fit-${model.id}-${Date.now()}`,
          brandId: model.brandId,
          brandName: brand?.nameFa || model.brandId,
          modelId: model.id,
          modelName: model.nameFa,
          yearFrom: model.yearFrom,
          yearTo: model.yearTo,
          engine: model.engineSummary,
          transmission: model.transmissionSummary
        };
        fitments.push(fitment);
      }
    } else {
      ids.delete(model.id);
    }

    const nextFitments = checked ? fitments : fitments.filter(item => item.modelId !== model.id);
    const nextBrandIds = Array.from(new Set([
      ...selectedBrandIds,
      ...(checked ? [model.brandId] : [])
    ])).filter(brandId =>
      checked || nextFitments.some(item => item.brandId === brandId) || selectedBrandIds.includes(brandId)
    );

    patch({
      vehicleBrandIds: nextBrandIds,
      vehicleModelIds: Array.from(ids),
      fitments: nextFitments
    });
  };

  const visibleModels = models.filter(model =>
    !selectedBrandIds.length || selectedBrandIds.includes(model.brandId)
  );

  return (
    <section className="rounded-2xl border border-blue-200 bg-blue-50/20 p-4 space-y-5">
      <div>
        <h4 className="font-black text-sm text-neutral-900 flex items-center gap-2">
          <FolderTree className="w-4 h-4 text-blue-600" />
          طبقه‌بندی، خودرو و سازنده
        </h4>
        <p className="text-[10px] text-neutral-500 mt-1">
          دسته مادر و زیرشاخه، برند و مدل خودرو، شرکت سازنده خودرو و تولیدکننده قطعه را از همین بخش تعیین کنید.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label>
          <span className="block text-[10px] font-bold text-neutral-700 mb-1">دسته مادر *</span>
          <select
            value={selectedRootSlug}
            onChange={event => selectRoot(event.target.value)}
            className="w-full p-2.5 border border-neutral-300 rounded-xl bg-white text-xs"
          >
            {categories.map(category => (
              <option key={category.id} value={category.slug}>{category.nameFa}</option>
            ))}
          </select>
        </label>

        <label>
          <span className="block text-[10px] font-bold text-neutral-700 mb-1">زیر‌دسته / پایین‌ترین سطح</span>
          <select
            value={value.subcategorySlug || ''}
            onChange={event => selectLeaf(event.target.value)}
            className="w-full p-2.5 border border-neutral-300 rounded-xl bg-white text-xs"
          >
            <option value="">خود دسته مادر: {selectedRoot?.nameFa || '—'}</option>
            {descendants.map(item => (
              <option key={item.id} value={item.slug}>
                {'— '.repeat(Math.max(0,item.depth - 1))}{item.nameFa}
              </option>
            ))}
          </select>
          {selectedEntry && selectedEntry.depth > 0 && (
            <small className="block mt-1 text-[9px] text-blue-700">{selectedEntry.path}</small>
          )}
        </label>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-neutral-700 flex items-center gap-1"><Car className="w-3.5 h-3.5" /> برندهای خودرو</span>
          <span className="text-[9px] text-neutral-400">{selectedBrandIds.length.toLocaleString('fa-IR')} انتخاب</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {brands.map(brand => {
            const checked = selectedBrandIds.includes(brand.id);
            return (
              <label key={brand.id} className={`px-2.5 py-2 rounded-xl border cursor-pointer flex items-center gap-2 text-[10px] font-bold ${checked ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-neutral-200 text-neutral-700'}`}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={event => toggleBrand(brand,event.target.checked)}
                  className="hidden"
                />
                {brand.logo && <img src={brand.logo} alt="" className="w-5 h-5 object-contain rounded" />}
                {brand.nameFa}
              </label>
            );
          })}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-neutral-700 flex items-center gap-1"><PackageSearch className="w-3.5 h-3.5" /> مدل‌های سازگار</span>
          <span className="text-[9px] text-neutral-400">{selectedModelIds.length.toLocaleString('fa-IR')} مدل</span>
        </div>
        <div className="max-h-56 overflow-y-auto rounded-xl border border-neutral-200 bg-white p-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
          {visibleModels.map(model => {
            const checked = selectedModelIds.includes(model.id);
            const brand = brands.find(item => item.id === model.brandId);
            return (
              <label key={model.id} className={`p-2 rounded-lg border cursor-pointer flex items-center gap-2 ${checked ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'border-neutral-100 hover:bg-neutral-50'}`}>
                <input type="checkbox" checked={checked} onChange={event => toggleModel(model,event.target.checked)} />
                <span className="min-w-0">
                  <strong className="block text-[9px] truncate">{model.nameFa}</strong>
                  <small className="block text-[8px] text-neutral-400 truncate">{brand?.nameFa} • {model.engineSummary}</small>
                </span>
              </label>
            );
          })}
          {!visibleModels.length && <div className="col-span-full p-6 text-center text-[10px] text-neutral-400">ابتدا یک برند خودرو انتخاب کنید.</div>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label>
          <span className="block text-[10px] font-bold text-neutral-700 mb-1 flex items-center gap-1"><Factory className="w-3.5 h-3.5" /> شرکت تولید/مونتاژ خودرو</span>
          <input
            list="vehicle-manufacturer-companies"
            value={value.vehicleManufacturerCompany || ''}
            onChange={event => patch({vehicleManufacturerCompany:event.target.value})}
            className="w-full p-2.5 border border-neutral-300 rounded-xl bg-white text-xs"
            placeholder="مثلاً کرمان موتور"
          />
          <datalist id="vehicle-manufacturer-companies">
            {vehicleCompanies.map(company => <option key={company} value={company} />)}
          </datalist>
        </label>

        <label>
          <span className="block text-[10px] font-bold text-neutral-700 mb-1 flex items-center gap-1"><Factory className="w-3.5 h-3.5" /> شرکت تولیدکننده قطعه *</span>
          <input
            list="part-manufacturer-companies"
            value={value.partManufacturerCompany || value.brandManufacturer || ''}
            onChange={event => patch({
              partManufacturerCompany:event.target.value,
              brandManufacturer:event.target.value
            })}
            className="w-full p-2.5 border border-neutral-300 rounded-xl bg-white text-xs"
            placeholder="Bosch / Valeo / OEM Supplier"
          />
          <datalist id="part-manufacturer-companies">
            {partCompanies.map(company => <option key={company} value={company} />)}
          </datalist>
        </label>
      </div>
    </section>
  );
};
