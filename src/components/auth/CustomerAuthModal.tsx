import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { CustomerType } from '../../types';
import { 
  X, 
  User, 
  Phone, 
  Lock, 
  Car, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft,
  Wrench,
  Building2
} from 'lucide-react';

interface CustomerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export const CustomerAuthModal: React.FC<CustomerAuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login'
}) => {
  const { customerLogin, customerRegister, models, addToGarage } = useStore();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  // Login form
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Register form
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regType, setRegType] = useState<CustomerType>('retail');
  const [regVehicleModelId, setRegVehicleModelId] = useState('');
  const [regError, setRegError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!loginPhone.trim() || !loginPassword) {
      setLoginError('شماره همراه و رمز عبور را وارد نمایید.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await customerLogin(loginPhone, loginPassword);
      if (res.success) {
        onClose();
      } else {
        setLoginError(res.error || 'خطا در ورود');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    if (!regFirstName.trim() || !regLastName.trim() || !regPhone.trim()) {
      setRegError('نام، نام خانوادگی و شماره همراه الزامی است.');
      return;
    }
    if (regPhone.length < 10) {
      setRegError('شماره موبایل وارد شده معتبر نمی‌باشد.');
      return;
    }
    if (regPassword.length < 8) {
      setRegError('رمز عبور باید حداقل ۸ کاراکتر باشد.');
      return;
    }

    const selectedModel = models.find(m => m.id === regVehicleModelId);
    const vehicleName = selectedModel ? `${selectedModel.nameFa} (${selectedModel.nameEn})` : '';

    setIsSubmitting(true);
    try {
      const res = await customerRegister({
        firstName: regFirstName,
        lastName: regLastName,
        phone: regPhone,
        password: regPassword,
        type: regType,
        vehicle: vehicleName
      });

      if (res.success) {
        if (selectedModel) {
          addToGarage({
            brandId: selectedModel.brandId,
            brandName: selectedModel.brandId.toUpperCase(),
            modelId: selectedModel.id,
            modelName: selectedModel.nameFa,
            year: selectedModel.yearTo || 1402,
            engine: selectedModel.engineSummary,
            transmission: selectedModel.transmissionSummary,
            customLabel: 'خودروی من'
          });
        }
        onClose();
      } else {
        setRegError(res.error || 'خطا در ثبت‌نام');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div 
        className="bg-white rounded-3xl border border-neutral-200 max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header Tabs */}
        <div className="flex items-center justify-between border-b border-neutral-100 p-4 bg-neutral-50/70">
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setMode('login'); setLoginError(''); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                mode === 'login'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              ورود به حساب
            </button>
            <button
              onClick={() => { setMode('register'); setRegError(''); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                mode === 'register'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              ثبت‌نام مشتری جدید
            </button>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-200/80 hover:bg-neutral-300 flex items-center justify-center text-neutral-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          {mode === 'login' ? (
            /* ================= LOGIN FORM ================= */
            <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
              <div className="text-center space-y-1 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-2">
                  <User className="w-6 h-6" />
                </div>
                <h3 className="text-base font-black text-neutral-900">ورود به حساب کاربری چین‌پارت</h3>
                <p className="text-neutral-500 text-[11px]">
                  دسترسی به تاریخچه سفارشات، گاراژ شخصی و استعلام قطعات
                </p>
              </div>

              {loginError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2 font-bold">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{loginError}</span>
                </div>
              )}

              <div>
                <label className="block text-neutral-700 font-bold mb-1">شماره تلفن همراه:</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-neutral-400 absolute right-3 top-3" />
                  <input
                    type="tel"
                    value={loginPhone}
                    onChange={e => setLoginPhone(e.target.value)}
                    placeholder="مثال: 09121234567"
                    className="w-full pr-9 pl-3 py-2.5 border border-neutral-300 rounded-xl focus:border-red-600 focus:outline-hidden font-mono text-left"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-700 font-bold mb-1">رمز عبور:</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-400 absolute right-3 top-3" />
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    placeholder="••••••"
                    className="w-full pr-9 pl-3 py-2.5 border border-neutral-300 rounded-xl focus:border-red-600 focus:outline-hidden font-mono text-left"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>{isSubmitting ? 'در حال بررسی...' : 'ورود به حساب کاربری'}</span>
                <ArrowLeft className="w-4 h-4" />
              </button>

              <div className="text-center pt-2 text-[11px] text-neutral-500">
                حساب کاربری ندارید؟{' '}
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="text-red-600 font-bold hover:underline"
                >
                  ثبت‌نام سریع در ۲ دقیقه
                </button>
              </div>
            </form>
          ) : (
            /* ================= REGISTER FORM ================= */
            <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
              <div className="text-center space-y-1 mb-3">
                <h3 className="text-base font-black text-neutral-900">ثبت‌نام در فروشگاه تخصصی چین‌پارت</h3>
                <p className="text-neutral-500 text-[11px]">
                  ثبت‌نام برای خریداران عادی، تعمیرکاران و همکاران گرامی
                </p>
              </div>

              {regError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2 font-bold">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{regError}</span>
                </div>
              )}

              {/* Account Type Selector */}
              <div>
                <label className="block text-neutral-700 font-bold mb-1.5">نوع حساب کاربری:</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'retail', label: 'مشتری عادی', icon: User },
                    { id: 'mechanic', label: 'تعمیرکار / مکانیک', icon: Wrench },
                    { id: 'wholesale', label: 'همکار / فروشگاه', icon: Building2 }
                  ].map(t => {
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setRegType(t.id as CustomerType)}
                        className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                          regType === t.id
                            ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs font-bold'
                            : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:border-neutral-300'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-[10px] leading-tight text-center">{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">نام:</label>
                  <input
                    type="text"
                    value={regFirstName}
                    onChange={e => setRegFirstName(e.target.value)}
                    placeholder="مثال: رضا"
                    className="w-full p-2.5 border border-neutral-300 rounded-xl focus:border-red-600 focus:outline-hidden"
                    required
                  />
                </div>
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">نام خانوادگی:</label>
                  <input
                    type="text"
                    value={regLastName}
                    onChange={e => setRegLastName(e.target.value)}
                    placeholder="مثال: محمدی"
                    className="w-full p-2.5 border border-neutral-300 rounded-xl focus:border-red-600 focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-700 font-bold mb-1">شماره همراه:</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-neutral-400 absolute right-3 top-3" />
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={e => setRegPhone(e.target.value)}
                    placeholder="0912..."
                    className="w-full pr-9 pl-3 py-2.5 border border-neutral-300 rounded-xl focus:border-red-600 focus:outline-hidden font-mono text-left"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-700 font-bold mb-1">خودروی چینی شما (جهت افزودن خودکار به گاراژ):</label>
                <div className="relative">
                  <Car className="w-4 h-4 text-neutral-400 absolute right-3 top-3" />
                  <select
                    value={regVehicleModelId}
                    onChange={e => setRegVehicleModelId(e.target.value)}
                    className="w-full pr-9 pl-3 py-2.5 border border-neutral-300 rounded-xl focus:border-red-600 focus:outline-hidden bg-white"
                  >
                    <option value="">انتخاب خودرو (اختیاری)</option>
                    {models.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.nameFa} - {m.nameEn}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-neutral-700 font-bold mb-1">تعیین رمز عبور:</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-400 absolute right-3 top-3" />
                  <input
                    type="password"
                    value={regPassword}
                    onChange={e => setRegPassword(e.target.value)}
                    placeholder="حداقل ۸ کاراکتر"
                    className="w-full pr-9 pl-3 py-2.5 border border-neutral-300 rounded-xl focus:border-red-600 focus:outline-hidden font-mono text-left"
                    minLength={8}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? 'در حال ثبت‌نام...' : 'تکمیل ثبت‌نام و ورود به گاراژ'}</span>
              </button>

              <div className="text-center pt-1 text-[11px] text-neutral-500">
                قبلاً ثبت‌نام کرده‌اید؟{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-red-600 font-bold hover:underline"
                >
                  ورود به حساب
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
