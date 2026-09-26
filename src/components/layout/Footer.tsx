import React from 'react';
import { 
  Wrench, 
  ShieldCheck, 
  Truck, 
  Clock, 
  Headphones, 
  MapPin, 
  Phone, 
  Mail, 
  ExternalLink,
  ChevronLeft
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';

interface FooterProps {
  onNavigate: (view: string, param?: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { brands, categories, settings } = useStore();

  return (
    <footer className="bg-neutral-900 text-neutral-300 mt-20 pt-16 pb-24 md:pb-12 border-t-4 border-red-600">
      <div className="max-w-7xl mx-auto px-4">
        {/* Core Value Props Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pb-12 border-b border-neutral-800">
          <div className="flex items-center gap-4 p-4 rounded-xl bg-neutral-800/50 border border-neutral-800">
            <div className="w-12 h-12 rounded-xl bg-red-600/20 text-red-500 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">ضمانت ۱۰۰٪ اصالت قطعه</h4>
              <p className="text-xs text-neutral-400 mt-1">تضمین قطعات اصلی شرکتی با هولوگرام</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-xl bg-neutral-800/50 border border-neutral-800">
            <div className="w-12 h-12 rounded-xl bg-red-600/20 text-red-500 flex items-center justify-center shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">ارسال اکسپرس و بیمه‌شده</h4>
              <p className="text-xs text-neutral-400 mt-1">تهران ۲ ساعته، شهرستان‌ها با تیپاکس و پست</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-xl bg-neutral-800/50 border border-neutral-800">
            <div className="w-12 h-12 rounded-xl bg-red-600/20 text-red-500 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">۷ روز مهلت تست و مرجوعی</h4>
              <p className="text-xs text-neutral-400 mt-1">بازگشت بدون قید و شرط در صورت عدم تطبیق</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-xl bg-neutral-800/50 border border-neutral-800">
            <div className="w-12 h-12 rounded-xl bg-red-600/20 text-red-500 flex items-center justify-center shrink-0">
              <Headphones className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">مشاوره تخصصی قبل از خرید</h4>
              <p className="text-xs text-neutral-400 mt-1">بررسی شماره شاسی VIN توسط مهندسین فنی</p>
            </div>
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 py-12 border-b border-neutral-800 text-xs">
          {/* Col 1: About */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white">
                <Wrench className="w-4 h-4" />
              </div>
              <span className="font-black text-lg text-white">چین‌پارت</span>
            </div>
            <p className="text-neutral-400 leading-relaxed text-xs">
              فروشگاه اینترنتی چین‌پارت، به عنوان مرجع تخصصی تامین، واردات و توزیع قطعات یدکی خودروهای چینی در ایران، با بیش از یک دهه سابقه در بازار چراغ برق تهران فعالیت می‌کند. تمرکز ما حذف واسطه‌ها، تضمین اصالت و تامین قطعات خودروهای مدرن کی‌ام‌سی (KMC)، چری، ام‌وی‌ام، فونیکس، لاماری، جک و چانگان است.
            </p>
            <div className="space-y-2 text-neutral-400 pt-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-red-500 shrink-0" />
                <span>{settings.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-red-500 shrink-0" />
                <span>تلفن تماس و پشتیبانی: {settings.contactPhone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-red-500 shrink-0" />
                <span>ایمیل واحد فنی و بازرگانی: {settings.supportEmail}</span>
              </div>
            </div>
          </div>

          {/* Col 2: Brands */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-sm">برندهای خودرو</h4>
            <ul className="space-y-2 text-neutral-400">
              {brands.slice(0, 7).map(b => (
                <li key={b.id}>
                  <button 
                    onClick={() => onNavigate('car-brand', b.slug)}
                    className="hover:text-red-500 transition-colors flex items-center gap-1"
                  >
                    <ChevronLeft className="w-3 h-3 text-neutral-600" />
                    <span>لوازم یدکی {b.nameFa}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Categories */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-sm">دسته‌بندی‌های اصلی</h4>
            <ul className="space-y-2 text-neutral-400">
              {categories.slice(0, 7).map(c => (
                <li key={c.id}>
                  <button 
                    onClick={() => onNavigate('category', c.slug)}
                    className="hover:text-red-500 transition-colors flex items-center gap-1"
                  >
                    <ChevronLeft className="w-3 h-3 text-neutral-600" />
                    <span>{c.nameFa}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Quick Links */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-sm">راهنمای مشتریان</h4>
            <ul className="space-y-2 text-neutral-400">
              <li>
                <button onClick={() => onNavigate('tracking')} className="hover:text-red-500 transition-colors">
                  پیگیری وضعیت مرسوله
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('part-request')} className="hover:text-red-500 transition-colors">
                  استعلام قطعات کم‌یاب و وارداتی
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('blog')} className="hover:text-red-500 transition-colors">
                  آموزش و عیب‌یابی خودرو
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('account', 'garage')} className="hover:text-red-500 transition-colors">
                  مدیریت گاراژ من
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('admin')} className="hover:text-red-500 transition-colors">
                  ورود به پنل مدیریت انبار
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-neutral-500 gap-4">
          <p>© {new Date().toLocaleDateString('fa-IR')} چین‌پارت. تمامی حقوق مادی و معنوی برای این وب‌سایت محفوظ است.</p>
          <div className="flex items-center gap-6">
            <span>طراحی تخصصی مخصوص صنعت خودروهای چینی</span>
            <span>·</span>
            <span>سازگار با استانداردهای OEM</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
