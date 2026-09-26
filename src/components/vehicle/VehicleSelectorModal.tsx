import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { CarBrand, VehicleModel } from '../../types';
import { X, Check, Car, Plus, Trash2, ArrowLeft, ShieldCheck } from 'lucide-react';

interface VehicleSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVehicleSelected?: () => void;
}

export const VehicleSelectorModal: React.FC<VehicleSelectorModalProps> = ({ isOpen, onClose, onVehicleSelected }) => {
  const { 
    brands, 
    models, 
    selectedVehicle, 
    setSelectedVehicle, 
    garage, 
    addToGarage, 
    removeFromGarage 
  } = useStore();

  const [activeTab, setActiveTab] = useState<'garage' | 'finder'>('garage');
  const [selectedBrand, setSelectedBrand] = useState<CarBrand | null>(null);
  const [selectedModel, setSelectedModel] = useState<VehicleModel | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [customLabel, setCustomLabel] = useState<string>('خودروی من');
  const [saveToGarage, setSaveToGarage] = useState<boolean>(true);

  if (!isOpen) return null;

  const filteredModels = selectedBrand 
    ? models.filter(m => m.brandId === selectedBrand.id)
    : [];

  const yearsAvailable = selectedModel 
    ? Array.from(
        { length: (selectedModel.yearTo || 1404) - selectedModel.yearFrom + 1 },
        (_, i) => selectedModel.yearFrom + i
      ).reverse()
    : [];

  const handleConfirmSelection = () => {
    if (!selectedBrand || !selectedModel) return;

    const year = selectedYear || selectedModel.yearTo || 1403;
    const newCar = {
      brandId: selectedBrand.id,
      brandName: selectedBrand.nameFa,
      modelId: selectedModel.id,
      modelName: selectedModel.nameFa,
      year: year,
      engine: selectedModel.engineSummary,
      transmission: selectedModel.transmissionSummary,
      customLabel: customLabel || selectedModel.nameFa,
      imageUrl: selectedModel.imageUrl
    };

    if (saveToGarage) {
      addToGarage(newCar);
    } else {
      setSelectedVehicle({
        ...newCar,
        id: `temp-${Date.now()}`,
        addedAt: 'اکنون'
      });
    }

    onClose();
    if (onVehicleSelected) onVehicleSelected();
  };

  const handleSelectFromGarage = (car: any) => {
    setSelectedVehicle(car);
    onClose();
    if (onVehicleSelected) onVehicleSelected();
  };

  const resetFinder = () => {
    setSelectedBrand(null);
    setSelectedModel(null);
    setSelectedYear(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">انتخاب و مدیریت «خودروی من»</h2>
              <p className="text-xs text-neutral-400">قطعات به نمایش درآمده با خودروی انتخابی شما تطبیق داده می‌شوند</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-neutral-200 bg-neutral-50 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('garage')}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'garage' 
                ? 'border-red-600 text-red-600 bg-white rounded-t-lg shadow-xs' 
                : 'border-transparent text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <span>گاراژ من</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-200 text-neutral-700">
              {garage.length}
            </span>
          </button>
          <button
            onClick={() => { setActiveTab('finder'); resetFinder(); }}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'finder' 
                ? 'border-red-600 text-red-600 bg-white rounded-t-lg shadow-xs' 
                : 'border-transparent text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>افزودن یا جستجوی خودرو جدید</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'garage' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-neutral-700">خودروهای ثبت شده در گاراژ شما:</span>
                <button 
                  onClick={() => { setActiveTab('finder'); resetFinder(); }}
                  className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  افزودن خودرو جدید
                </button>
              </div>

              {garage.length === 0 ? (
                <div className="text-center py-10 bg-neutral-50 rounded-xl border border-dashed border-neutral-300">
                  <Car className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
                  <p className="text-sm text-neutral-600 mb-4">گاراژ شما خالی است. خودروی خود را انتخاب کنید تا خرید قطعات ساده‌تر شود.</p>
                  <button
                    onClick={() => setActiveTab('finder')}
                    className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl"
                  >
                    انتخاب خودرو
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {garage.map((car) => {
                    const isCurrent = selectedVehicle?.id === car.id;
                    return (
                      <div
                        key={car.id}
                        className={`p-4 rounded-xl border transition-all text-right relative flex flex-col justify-between ${
                          isCurrent 
                            ? 'border-red-600 bg-red-50/50 ring-2 ring-red-600/20' 
                            : 'border-neutral-200 hover:border-neutral-300 bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-neutral-900 text-white">
                                {car.customLabel}
                              </span>
                              {isCurrent && (
                                <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                                  <Check className="w-3 h-3" />
                                  فعال
                                </span>
                              )}
                            </div>
                            <h4 className="font-bold text-neutral-900 text-base">{car.modelName}</h4>
                            <p className="text-xs text-neutral-500 mt-1">مدل سال {car.year} · {car.engine}</p>
                          </div>
                          {car.imageUrl && (
                            <img 
                              src={car.imageUrl} 
                              alt={car.modelName} 
                              className="w-16 h-12 object-cover rounded-lg border border-neutral-200" 
                            />
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
                          <button
                            onClick={() => handleSelectFromGarage(car)}
                            disabled={isCurrent}
                            className={`text-xs font-bold py-1.5 px-3 rounded-lg transition-colors ${
                              isCurrent
                                ? 'bg-neutral-200 text-neutral-500 cursor-default'
                                : 'bg-red-600 hover:bg-red-700 text-white'
                            }`}
                          >
                            {isCurrent ? 'انتخاب شده' : 'انتخاب این خودرو'}
                          </button>
                          
                          <button
                            onClick={() => removeFromGarage(car.id)}
                            className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="حذف از گاراژ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {selectedVehicle && (
                <div className="p-3 bg-neutral-100 rounded-xl text-xs text-neutral-600 flex items-center justify-between">
                  <span>خودروی فعال سایت: <strong>{selectedVehicle.modelName} ({selectedVehicle.year})</strong></span>
                  <button 
                    onClick={() => { setSelectedVehicle(null); onClose(); }}
                    className="text-red-600 hover:underline font-bold"
                  >
                    مشاهده همه قطعات بدون فیلتر
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Stepper Wizard */}
              <div className="flex items-center justify-between text-xs font-semibold text-neutral-500 border-b pb-3">
                <span className={selectedBrand ? 'text-emerald-600' : 'text-red-600 font-bold'}>۱. برند خودرو</span>
                <span>←</span>
                <span className={selectedModel ? 'text-emerald-600' : selectedBrand ? 'text-red-600 font-bold' : ''}>۲. مدل خودرو</span>
                <span>←</span>
                <span className={selectedYear ? 'text-emerald-600' : selectedModel ? 'text-red-600 font-bold' : ''}>۳. سال ساخت و مشخصات</span>
              </div>

              {/* Step 1: Select Brand */}
              {!selectedBrand && (
                <div>
                  <h3 className="font-bold text-neutral-900 mb-3 text-sm">برند خودروی خود را انتخاب کنید:</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {brands.map(brand => (
                      <button
                        key={brand.id}
                        onClick={() => setSelectedBrand(brand)}
                        className="p-3 border border-neutral-200 hover:border-red-500 hover:bg-red-50/30 rounded-xl flex flex-col items-center gap-2 text-center transition-all group"
                      >
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-neutral-100 p-1 flex items-center justify-center border group-hover:scale-105 transition-transform">
                          <img src={brand.logo} alt={brand.nameFa} className="w-full h-full object-cover rounded-full" />
                        </div>
                        <span className="font-bold text-sm text-neutral-800">{brand.nameFa}</span>
                        <span className="text-[10px] text-neutral-400">{brand.modelsCount} مدل فعال</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Select Model */}
              {selectedBrand && !selectedModel && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-neutral-900 text-sm">
                      مدل خودروی <strong className="text-red-600">{selectedBrand.nameFa}</strong>:
                    </h3>
                    <button 
                      onClick={() => setSelectedBrand(null)}
                      className="text-xs text-neutral-500 hover:text-neutral-900 flex items-center gap-1"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      تغییر برند
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {filteredModels.map(model => (
                      <button
                        key={model.id}
                        onClick={() => setSelectedModel(model)}
                        className="p-3 border border-neutral-200 hover:border-red-500 hover:bg-red-50/40 rounded-xl flex items-center gap-3 text-right transition-all group"
                      >
                        <img 
                          src={model.imageUrl} 
                          alt={model.nameFa} 
                          className="w-20 h-14 object-cover rounded-lg border border-neutral-200 group-hover:scale-105 transition-transform" 
                        />
                        <div className="flex-1">
                          <h4 className="font-bold text-neutral-900 text-sm">{model.nameFa}</h4>
                          <p className="text-[11px] text-neutral-500">{model.bodyType} · {model.yearFrom} تا {model.yearTo || 'اکنون'}</p>
                          <p className="text-[10px] text-neutral-400 truncate">{model.engineSummary}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Select Year and Confirm */}
              {selectedBrand && selectedModel && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                    <div>
                      <span className="text-xs text-neutral-500">خودروی انتخاب شده:</span>
                      <h4 className="font-bold text-base text-neutral-900">{selectedBrand.nameFa} {selectedModel.nameFa}</h4>
                    </div>
                    <button 
                      onClick={() => setSelectedModel(null)}
                      className="text-xs text-red-600 hover:underline flex items-center gap-1"
                    >
                      تغییر مدل
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-2">سال ساخت خودرو:</label>
                    <div className="flex flex-wrap gap-2">
                      {yearsAvailable.map(yr => (
                        <button
                          key={yr}
                          onClick={() => setSelectedYear(yr)}
                          className={`px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${
                            selectedYear === yr
                              ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
                              : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:border-neutral-300'
                          }`}
                        >
                          {yr}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Engine Details Card */}
                  <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-500">مشخصات پیشرانه:</span>
                      <span className="font-bold text-neutral-800">{selectedModel.engineSummary}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-500">گیربکس:</span>
                      <span className="font-bold text-neutral-800">{selectedModel.transmissionSummary}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-500">کد موتور کارخانه:</span>
                      <span className="font-mono font-bold text-neutral-800">{selectedModel.specifications.engineCode}</span>
                    </div>
                  </div>

                  {/* Garage Options */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        id="save_garage" 
                        checked={saveToGarage} 
                        onChange={e => setSaveToGarage(e.target.checked)}
                        className="rounded border-neutral-300 text-red-600 focus:ring-red-500 w-4 h-4 cursor-pointer"
                      />
                      <label htmlFor="save_garage" className="text-xs font-semibold text-neutral-700 cursor-pointer">
                        این خودرو در «گاراژ من» ذخیره شود تا دفعه بعد سریع‌تر انتخاب کنم
                      </label>
                    </div>

                    {saveToGarage && (
                      <div>
                        <label className="block text-xs text-neutral-500 mb-1">نام دلخواه در گاراژ:</label>
                        <input
                          type="text"
                          value={customLabel}
                          onChange={e => setCustomLabel(e.target.value)}
                          placeholder="مثلاً: خودروی من، خودروی همسر"
                          className="w-full text-xs px-3 py-2 border border-neutral-300 rounded-lg focus:outline-hidden focus:border-red-500"
                        />
                      </div>
                    )}
                  </div>

                  {/* Confirm CTA */}
                  <div className="pt-4 flex items-center justify-end gap-3">
                    <button
                      onClick={resetFinder}
                      className="px-4 py-2.5 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl"
                    >
                      از ابتدا
                    </button>
                    <button
                      onClick={handleConfirmSelection}
                      className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl shadow-md flex items-center gap-2"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      تأیید و جستجوی قطعات این خودرو
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
