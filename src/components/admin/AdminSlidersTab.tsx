import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { SliderItem } from '../../types';
import { ImageUploadInput } from '../common/ImageUploadInput';
import { 
  Sliders, 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  EyeOff, 
  ArrowUp, 
  ArrowDown, 
  ExternalLink,
  Sparkles,
  Image as ImageIcon,
  Check,
  Palette,
  AlignRight,
  AlignCenter,
  AlignLeft,
  SlidersHorizontal
} from 'lucide-react';

export const AdminSlidersTab: React.FC = () => {
  const { sliders, addSlider, updateSlider, deleteSlider, reorderSliders, settings, updateSettings } = useStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<SliderItem | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [tag, setTag] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageMode, setImageMode] = useState<NonNullable<SliderItem['imageMode']>>('cover');
  const [link, setLink] = useState('shop');
  const [buttonText, setButtonText] = useState('مشاهده و خرید قطعات');
  const [isActive, setIsActive] = useState(true);
  const [order, setOrder] = useState(1);

  // Extended Advanced Customization Settings
  const [gradientOverlay, setGradientOverlay] = useState<boolean>(true);
  const [overlayOpacity, setOverlayOpacity] = useState<number>(70);
  const [textAlignment, setTextAlignment] = useState<'right' | 'center' | 'left'>('right');
  const [titleColor, setTitleColor] = useState<string>('#ffffff');
  const [subtitleColor, setSubtitleColor] = useState<string>('#d4d4d8');
  const [bgColor, setBgColor] = useState<string>('#09090b');
  const [buttonBgColor, setButtonBgColor] = useState<string>('#DC2626');
  const [buttonTextColor, setButtonTextColor] = useState<string>('#ffffff');
  const [badgeBgColor, setBadgeBgColor] = useState<string>('rgba(220, 38, 38, 0.25)');
  const [badgeTextColor, setBadgeTextColor] = useState<string>('#fca5a5');

  const openNewSlideModal = () => {
    setEditingSlide(null);
    setTitle('');
    setSubtitle('');
    setTag('پیشنهاد ویژه');
    setImageUrl('https://images.unsplash.com/photo-1617788138017-80ad40651399?w=1600&auto=format&fit=crop&q=80');
    setImageMode('cover');
    setLink('shop');
    setButtonText('مشاهده قطعات');
    setIsActive(true);
    setOrder(sliders.length + 1);

    setGradientOverlay(true);
    setOverlayOpacity(75);
    setTextAlignment('right');
    setTitleColor('#ffffff');
    setSubtitleColor('#d4d4d8');
    setBgColor('#09090b');
    setButtonBgColor('#DC2626');
    setButtonTextColor('#ffffff');
    setBadgeBgColor('rgba(220, 38, 38, 0.25)');
    setBadgeTextColor('#fca5a5');

    setIsModalOpen(true);
  };

  const openEditModal = (slide: SliderItem) => {
    setEditingSlide(slide);
    setTitle(slide.title);
    setSubtitle(slide.subtitle);
    setTag(slide.tag || '');
    setImageUrl(slide.imageUrl);
    setImageMode(slide.imageMode || 'cover');
    setLink(slide.link);
    setButtonText(slide.buttonText);
    setIsActive(slide.isActive);
    setOrder(slide.order);

    setGradientOverlay(slide.gradientOverlay !== false);
    setOverlayOpacity(slide.overlayOpacity ?? 75);
    setTextAlignment(slide.textAlignment || 'right');
    setTitleColor(slide.titleColor || '#ffffff');
    setSubtitleColor(slide.subtitleColor || '#d4d4d8');
    setBgColor(slide.bgColor || '#09090b');
    setButtonBgColor(slide.buttonBgColor || '#DC2626');
    setButtonTextColor(slide.buttonTextColor || '#ffffff');
    setBadgeBgColor(slide.badgeBgColor || 'rgba(220, 38, 38, 0.25)');
    setBadgeTextColor(slide.badgeTextColor || '#fca5a5');

    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !imageUrl.trim()) return;

    const payload: Partial<SliderItem> = {
      title,
      subtitle,
      tag,
      imageUrl,
      imageMode,
      link,
      buttonText,
      isActive,
      order,
      gradientOverlay,
      overlayOpacity,
      textAlignment,
      titleColor,
      subtitleColor,
      bgColor,
      buttonBgColor,
      buttonTextColor,
      badgeBgColor,
      badgeTextColor
    };

    if (editingSlide) {
      updateSlider({
        ...editingSlide,
        ...payload
      } as SliderItem);
    } else {
      const newSlide: SliderItem = {
        id: `slide-${Date.now()}`,
        ...payload
      } as SliderItem;
      addSlider(newSlide);
    }

    setIsModalOpen(false);
  };

  const moveSlide = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sliders.length) return;

    const newSliders = [...sliders];
    const temp = newSliders[index];
    newSliders[index] = newSliders[targetIndex];
    newSliders[targetIndex] = temp;

    // re-assign orders
    const updated = newSliders.map((s, idx) => ({ ...s, order: idx + 1 }));
    reorderSliders(updated);
  };

  const toggleSlideStatus = (slide: SliderItem) => {
    updateSlider({ ...slide, isActive: !slide.isActive });
  };

  return (
    <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-xs space-y-6 text-right">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-100 gap-4">
        <div>
          <h2 className="text-lg font-black text-neutral-900 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-red-600" />
            <span>مدیریت اسلایدر و بنرهای تبلیغاتی صفحه اول ({sliders.length} اسلاید)</span>
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            کنترل کامل رنگ‌ها، متون، گرادیان پس‌زمینه، دکمه CTA و چیدمان هر اسلاید به صورت مستقل
          </p>
        </div>

        <button
          onClick={openNewSlideModal}
          className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 self-start shadow-md shadow-red-600/30 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>ساخت اسلاید جدید</span>
        </button>
      </div>

      {/* Global carousel behavior */}
      <div className="rounded-2xl border border-blue-200 bg-blue-50/30 p-4 sm:p-5 space-y-4">
        <div>
          <h3 className="font-black text-sm text-neutral-900 flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-blue-600" />
            کنترل حرکت و ناوبری اسلایدر
          </h3>
          <p className="text-[10px] text-neutral-500 mt-1">این تنظیمات روی اسلایدر Hero صفحه اصلی اعمال می‌شود و مستقل از محتوای هر اسلاید است.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <label className="space-y-1">
            <span className="font-bold text-neutral-700">کنترل تعویض اسلاید</span>
            <select
              value={settings.heroSliderNavigation || 'dots'}
              onChange={e => updateSettings({ heroSliderNavigation: e.target.value as 'dots' | 'arrows' | 'both' | 'none' })}
              className="w-full p-2.5 border border-neutral-300 rounded-xl bg-white"
            >
              <option value="dots">نقطه‌ها</option>
              <option value="arrows">فلش‌ها</option>
              <option value="both">فلش + نقطه</option>
              <option value="none">بدون کنترل</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="font-bold text-neutral-700">انیمیشن</span>
            <select
              value={settings.heroSliderAnimation || 'fade'}
              onChange={e => updateSettings({ heroSliderAnimation: e.target.value as 'fade' | 'slide' | 'zoom' })}
              className="w-full p-2.5 border border-neutral-300 rounded-xl bg-white"
            >
              <option value="fade">Fade نرم</option>
              <option value="slide">Slide</option>
              <option value="zoom">Zoom نرم</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="font-bold text-neutral-700">زمان تعویض (میلی‌ثانیه)</span>
            <input
              type="number"
              min={1500}
              max={30000}
              step={500}
              value={settings.heroSliderAutoplayMs || 6500}
              onChange={e => updateSettings({ heroSliderAutoplayMs: Math.max(1500, Number(e.target.value) || 6500) })}
              className="w-full p-2.5 border border-neutral-300 rounded-xl bg-white font-mono"
            />
          </label>
          <div className="grid grid-cols-1 gap-2">
            <label className="flex items-center justify-between gap-2 p-2.5 border border-neutral-200 rounded-xl bg-white">
              <span className="font-bold text-neutral-700">توقف با Hover</span>
              <input
                type="checkbox"
                checked={settings.heroSliderPauseOnHover !== false}
                onChange={e => updateSettings({ heroSliderPauseOnHover: e.target.checked })}
              />
            </label>
            <label className="flex items-center justify-between gap-2 p-2.5 border border-neutral-200 rounded-xl bg-white">
              <span className="font-bold text-neutral-700">تکرار پیوسته</span>
              <input
                type="checkbox"
                checked={settings.heroSliderLoop !== false}
                onChange={e => updateSettings({ heroSliderLoop: e.target.checked })}
              />
            </label>
          </div>
        </div>
      </div>

      {/* Sliders List */}
      <div className="space-y-4">
        {sliders.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-neutral-200 rounded-3xl p-6">
            <Sliders className="w-12 h-12 text-neutral-300 mx-auto mb-2" />
            <p className="text-neutral-500 text-xs font-semibold">هیچ اسلایدی یافت نشد.</p>
          </div>
        ) : (
          sliders
            .sort((a, b) => a.order - b.order)
            .map((slide, idx) => (
              <div 
                key={slide.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                  slide.isActive 
                    ? 'border-neutral-200 bg-neutral-50/50 hover:bg-white hover:border-neutral-300' 
                    : 'border-neutral-200 bg-neutral-100/60 opacity-60'
                }`}
              >
                {/* Thumbnail & Info */}
                <div className="flex items-center gap-4 flex-1">
                  <div className="relative w-24 h-16 sm:w-32 sm:h-20 rounded-xl overflow-hidden border border-neutral-300 bg-neutral-900 shrink-0 shadow-xs">
                    <img 
                      src={slide.imageUrl} 
                      alt={slide.title} 
                      className="w-full h-full object-cover" 
                    />
                    {slide.gradientOverlay !== false && (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                    )}
                    <span className="absolute bottom-1 right-1 text-[9px] bg-black/70 text-white px-1.5 py-0.5 rounded font-mono">
                      #{slide.order}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {slide.tag && (
                        <span 
                          style={{ backgroundColor: slide.badgeBgColor || '#fef2f2', color: slide.badgeTextColor || '#b91c1c' }}
                          className="px-2 py-0.5 rounded-full text-[10px] font-black"
                        >
                          {slide.tag}
                        </span>
                      )}
                      <h4 className="font-bold text-sm text-neutral-900">{slide.title}</h4>
                    </div>
                    <p className="text-xs text-neutral-500 line-clamp-1">{slide.subtitle}</p>
                    <div className="flex flex-wrap items-center gap-2 text-[10px] text-neutral-400 font-mono pt-1">
                      <span>لینک: {slide.link}</span>
                      <span>•</span>
                      <span>گرادیان: {slide.gradientOverlay !== false ? 'فعال' : 'خاموش'}</span>
                      <span>•</span>
                      <span>چیدمان: {slide.textAlignment === 'center' ? 'وسط‌چین' : slide.textAlignment === 'left' ? 'چپ‌چین' : 'راست‌چین'}</span>
                    </div>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-1.5 self-end md:self-center shrink-0">
                  <button
                    type="button"
                    onClick={() => moveSlide(idx, 'up')}
                    disabled={idx === 0}
                    className="p-2 text-neutral-500 hover:text-neutral-900 disabled:opacity-30 rounded-lg hover:bg-neutral-200 transition-colors cursor-pointer"
                    title="انتقال به بالا"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveSlide(idx, 'down')}
                    disabled={idx === sliders.length - 1}
                    className="p-2 text-neutral-500 hover:text-neutral-900 disabled:opacity-30 rounded-lg hover:bg-neutral-200 transition-colors cursor-pointer"
                    title="انتقال به پایین"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>

                  <div className="h-5 w-px bg-neutral-200 mx-1"></div>

                  <button
                    type="button"
                    onClick={() => toggleSlideStatus(slide)}
                    className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                      slide.isActive
                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        : 'bg-neutral-200 text-neutral-600 hover:bg-neutral-300'
                    }`}
                    title={slide.isActive ? 'اسلاید فعال است' : 'اسلاید غیرفعال است'}
                  >
                    {slide.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    <span>{slide.isActive ? 'فعال' : 'غیرفعال'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openEditModal(slide)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
                    title="ویرایش اسلاید"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteSlider(slide.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                    title="حذف اسلاید"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
        )}
      </div>

      {/* =========================================================================
          MODAL: ADVANCED ADD / EDIT SLIDE
      ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[92vh] overflow-y-auto space-y-5 text-right shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="font-black text-base text-neutral-900 flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-red-600" />
                <span>{editingSlide ? 'ویرایش حرفه‌ای اسلاید صفحه نخست' : 'ساخت اسلاید تبلیغاتی جدید'}</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-neutral-400 hover:text-neutral-700">✕</button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              
              {/* Slide Content */}
              <div>
                <label className="block text-neutral-700 font-bold mb-1">عنوان اصلی اسلاید *:</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="مثال: بزرگترین انبار قطعات یدکی فابریک KMC در ایران"
                  className="w-full p-2.5 border border-neutral-300 rounded-xl font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-neutral-700 font-bold mb-1">زیرعنوان و متن توضیحات:</label>
                <textarea
                  rows={2}
                  value={subtitle}
                  onChange={e => setSubtitle(e.target.value)}
                  placeholder="تامین انواع قطعات موتوری، گیربکس، دیسک و صفحه با هولوگرام اصالت..."
                  className="w-full p-2.5 border border-neutral-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">برچسب / نشان (Tag):</label>
                  <input
                    type="text"
                    value={tag}
                    onChange={e => setTag(e.target.value)}
                    placeholder="اصلی شرکتی / تخفیف ویژه"
                    className="w-full p-2.5 border border-neutral-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">ترتیب نمایش (Order):</label>
                  <input
                    type="number"
                    value={order}
                    onChange={e => setOrder(Number(e.target.value))}
                    min={1}
                    className="w-full p-2.5 border border-neutral-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">چیدمان متون اسلاید:</label>
                  <div className="grid grid-cols-3 gap-1 bg-neutral-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setTextAlignment('right')}
                      className={`p-1.5 rounded-lg flex justify-center ${textAlignment === 'right' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500'}`}
                      title="راست‌چین"
                    >
                      <AlignRight className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setTextAlignment('center')}
                      className={`p-1.5 rounded-lg flex justify-center ${textAlignment === 'center' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500'}`}
                      title="وسط‌چین"
                    >
                      <AlignCenter className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setTextAlignment('left')}
                      className={`p-1.5 rounded-lg flex justify-center ${textAlignment === 'left' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500'}`}
                      title="چپ‌چین"
                    >
                      <AlignLeft className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Image Input */}
              <ImageUploadInput
                label="تصویر پس‌زمینه اسلاید (آپلود مستقیم یا لینک عکس باکیفیت) *:"
                value={imageUrl}
                onChange={url => setImageUrl(url)}
                aspectRatio="banner"
                presetCategory="banners"
                placeholder="https://..."
                helperText="تصویر افقی با نسبت عریض جهت نمایش چشم‌نواز در اسلایدر هدر"
              />

              <label className="block mt-3">
                <span className="block text-xs font-bold mb-1.5">نحوه نمایش تصویر اسلاید</span>
                <select value={imageMode} onChange={event => setImageMode(event.target.value as NonNullable<SliderItem['imageMode']>)} className="w-full p-2.5 border border-neutral-300 rounded-xl bg-white text-xs">
                  <option value="cover">پوشش کامل کادر (با برش متناسب)</option>
                  <option value="contain">نمایش کامل بدون برش</option>
                  <option value="stretch">کشیده‌شدن اجباری تا کادر</option>
                  <option value="original">اندازه اصلی تصویر</option>
                  <option value="repeat">تکرار تصویر</option>
                  <option value="repeat-x">تکرار افقی</option>
                  <option value="repeat-y">تکرار عمودی</option>
                </select>
              </label>

              {/* Color & Gradient Settings */}
              <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-neutral-900 flex items-center gap-1.5">
                    <Palette className="w-4 h-4 text-amber-600" />
                    <span>تنظیمات رنگ، لایه پوششی و گرادیان (Gradient & Overlay)</span>
                  </h4>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-neutral-800">
                    <input
                      type="checkbox"
                      checked={gradientOverlay}
                      onChange={e => setGradientOverlay(e.target.checked)}
                      className="rounded text-red-600 w-4 h-4"
                    />
                    <span>اعمال گرادیان تیره روی عکس</span>
                  </label>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] text-neutral-600 mb-1">شدت تیرگی لایه ({overlayOpacity}%):</label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={overlayOpacity}
                      onChange={e => setOverlayOpacity(Number(e.target.value))}
                      className="w-full accent-red-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-neutral-600 mb-1">رنگ عنوان:</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={titleColor}
                        onChange={e => setTitleColor(e.target.value)}
                        className="w-7 h-7 rounded border cursor-pointer p-0.5 bg-white shrink-0"
                      />
                      <input
                        type="text"
                        value={titleColor}
                        onChange={e => setTitleColor(e.target.value)}
                        className="w-full p-1.5 border border-neutral-300 rounded font-mono text-[10px]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-neutral-600 mb-1">رنگ دکمه CTA:</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={buttonBgColor}
                        onChange={e => setButtonBgColor(e.target.value)}
                        className="w-7 h-7 rounded border cursor-pointer p-0.5 bg-white shrink-0"
                      />
                      <input
                        type="text"
                        value={buttonBgColor}
                        onChange={e => setButtonBgColor(e.target.value)}
                        className="w-full p-1.5 border border-neutral-300 rounded font-mono text-[10px]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-neutral-600 mb-1">رنگ پس‌زمینه اسلاید:</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={bgColor}
                        onChange={e => setBgColor(e.target.value)}
                        className="w-7 h-7 rounded border cursor-pointer p-0.5 bg-white shrink-0"
                      />
                      <input
                        type="text"
                        value={bgColor}
                        onChange={e => setBgColor(e.target.value)}
                        className="w-full p-1.5 border border-neutral-300 rounded font-mono text-[10px]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Call to action & Destination Link */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">متن روی دکمه (CTA):</label>
                  <input
                    type="text"
                    value={buttonText}
                    onChange={e => setButtonText(e.target.value)}
                    placeholder="مشاهده قطعات"
                    className="w-full p-2.5 border border-neutral-300 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">صفحه مقصد کلیک:</label>
                  <select
                    value={link}
                    onChange={e => setLink(e.target.value)}
                    className="w-full p-2.5 border border-neutral-300 rounded-xl font-mono text-left bg-white"
                  >
                    <option value="shop">فروشگاه کلی (shop)</option>
                    <option value="shop:maintenance">قطعات مصرفی و سرویس (shop:maintenance)</option>
                    <option value="part-request">استعلام قطعه با شماره شاسی (part-request)</option>
                    <option value="blog">وبلاگ و آموزش (blog)</option>
                    <option value="account:garage">گاراژ خودروها (account:garage)</option>
                  </select>
                </div>
              </div>

              {/* Active Toggle */}
              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-neutral-800">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={e => setIsActive(e.target.checked)}
                    className="rounded text-red-600 w-4 h-4"
                  />
                  <span>این اسلاید هم‌اکنون در صفحه نخست نمایش داده شود (فعال)</span>
                </label>
              </div>

              {/* Live Preview Box */}
              <div className="pt-2 border-t border-neutral-100">
                <span className="text-[11px] font-bold text-neutral-600 block mb-1.5">پیش‌نمایش زنده ظاهر اسلاید:</span>
                <div 
                  style={{ backgroundColor: bgColor }}
                  className={`relative rounded-2xl overflow-hidden h-36 p-4 flex flex-col justify-end text-${textAlignment}`}
                >
                  {imageUrl && (
                    <img 
                      src={imageUrl} 
                      alt="" 
                      className="absolute inset-0 w-full h-full object-cover" 
                    />
                  )}
                  {gradientOverlay && (
                    <div 
                      style={{ opacity: overlayOpacity / 100 }}
                      className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-transparent"
                    />
                  )}
                  <div className="relative z-10 space-y-1">
                    {tag && (
                      <span 
                        style={{ backgroundColor: badgeBgColor, color: badgeTextColor }}
                        className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold"
                      >
                        {tag}
                      </span>
                    )}
                    <h5 style={{ color: titleColor }} className="font-black text-xs line-clamp-1">{title || 'عنوان نمونه اسلاید'}</h5>
                    <p style={{ color: subtitleColor }} className="text-[10px] line-clamp-1">{subtitle || 'توضیحات کوتاه اسلاید...'}</p>
                    <button
                      type="button"
                      style={{ backgroundColor: buttonBgColor, color: buttonTextColor }}
                      className="px-3 py-1 rounded-lg text-[10px] font-bold mt-1 inline-block"
                    >
                      {buttonText || 'مشاهده'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-neutral-100 text-neutral-700 rounded-xl font-bold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-md cursor-pointer"
                >
                  ذخیره اسلاید
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
