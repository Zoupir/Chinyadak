import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { SliderItem } from '../../types';
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
  Check
} from 'lucide-react';

export const AdminSlidersTab: React.FC = () => {
  const { sliders, addSlider, updateSlider, deleteSlider, reorderSliders } = useStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<SliderItem | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [tag, setTag] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [link, setLink] = useState('shop');
  const [buttonText, setButtonText] = useState('مشاهده و خرید قطعات');
  const [isActive, setIsActive] = useState(true);
  const [order, setOrder] = useState(1);

  const openNewSlideModal = () => {
    setEditingSlide(null);
    setTitle('');
    setSubtitle('');
    setTag('پیشنهاد ویژه');
    setImageUrl('https://images.unsplash.com/photo-1617788138017-80ad40651399?w=1600&auto=format&fit=crop&q=80');
    setLink('shop');
    setButtonText('مشاهده قطعات');
    setIsActive(true);
    setOrder(sliders.length + 1);
    setIsModalOpen(true);
  };

  const openEditModal = (slide: SliderItem) => {
    setEditingSlide(slide);
    setTitle(slide.title);
    setSubtitle(slide.subtitle);
    setTag(slide.tag || '');
    setImageUrl(slide.imageUrl);
    setLink(slide.link);
    setButtonText(slide.buttonText);
    setIsActive(slide.isActive);
    setOrder(slide.order);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !imageUrl.trim()) return;

    if (editingSlide) {
      updateSlider({
        ...editingSlide,
        title,
        subtitle,
        tag,
        imageUrl,
        link,
        buttonText,
        isActive,
        order
      });
    } else {
      const newSlide: SliderItem = {
        id: `slide-${Date.now()}`,
        title,
        subtitle,
        tag,
        imageUrl,
        link,
        buttonText,
        isActive,
        order
      };
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

  const PRESET_BANNER_IMAGES = [
    { label: 'خودروی KMC و جک', url: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=1600&auto=format&fit=crop&q=80' },
    { label: 'شاسی‌بلند چری تیگو', url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1600&auto=format&fit=crop&q=80' },
    { label: 'انبار قطعات و روغن موتور', url: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=1600&auto=format&fit=crop&q=80' },
    { label: 'سیستم ترمز و موتور توربو', url: 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=1600&auto=format&fit=crop&q=80' }
  ];

  return (
    <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-100 gap-4">
        <div>
          <h2 className="text-lg font-black text-neutral-900 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-red-600" />
            <span>مدیریت اسلایدر و بنرهای تبلیغاتی صفحه اول ({sliders.length} اسلاید)</span>
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            امکان تعریف اسلایدهای تعاملی با تصویر باکیفیت، دکمه فراخوان به عمل (CTA) و اولویت‌بندی نمایش
          </p>
        </div>

        <button
          onClick={openNewSlideModal}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 self-start shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>ساخت اسلاید جدید</span>
        </button>
      </div>

      {/* Sliders Grid / List */}
      <div className="space-y-4">
        {sliders.length === 0 ? (
          <div className="p-8 text-center bg-neutral-50 rounded-2xl border border-neutral-200 text-neutral-500 text-xs">
            هیچ اسلایدی تعریف نشده است. با کلیک بر روی دکمه بالا اولین اسلاید را بسازید.
          </div>
        ) : (
          sliders
            .sort((a, b) => a.order - b.order)
            .map((slide, idx) => (
              <div
                key={slide.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row items-center justify-between gap-4 ${
                  slide.isActive ? 'bg-white border-neutral-200 shadow-xs' : 'bg-neutral-50/70 border-neutral-200 opacity-60'
                }`}
              >
                {/* Left/Middle: Thumbnail and info */}
                <div className="flex items-center gap-4 w-full md:w-auto">
                  {/* Thumbnail */}
                  <div className="relative w-32 h-20 rounded-xl overflow-hidden shrink-0 border border-neutral-200 bg-neutral-900">
                    <img
                      src={slide.imageUrl}
                      alt={slide.title}
                      className="w-full h-full object-cover"
                    />
                    {slide.tag && (
                      <span className="absolute top-1 right-1 text-[9px] font-black bg-red-600 text-white px-1.5 py-0.2 rounded">
                        {slide.tag}
                      </span>
                    )}
                  </div>

                  {/* Text details */}
                  <div className="space-y-1 text-right flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-100 text-neutral-600 font-bold">
                        ترتیب: {slide.order}
                      </span>
                      <h3 className="font-bold text-sm text-neutral-900 line-clamp-1">{slide.title}</h3>
                    </div>
                    <p className="text-xs text-neutral-500 line-clamp-1 max-w-lg">{slide.subtitle}</p>
                    <div className="flex items-center gap-3 text-[11px] text-neutral-400 font-mono">
                      <span>دکمه: <strong className="text-neutral-700 font-sans">{slide.buttonText}</strong></span>
                      <span>لینک: <strong className="text-red-600">{slide.link}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center">
                  {/* Reorder Buttons */}
                  <button
                    type="button"
                    onClick={() => moveSlide(idx, 'up')}
                    disabled={idx === 0}
                    className="p-2 text-neutral-400 hover:text-neutral-900 disabled:opacity-30 rounded-lg hover:bg-neutral-100"
                    title="انتقال به بالا"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveSlide(idx, 'down')}
                    disabled={idx === sliders.length - 1}
                    className="p-2 text-neutral-400 hover:text-neutral-900 disabled:opacity-30 rounded-lg hover:bg-neutral-100"
                    title="انتقال به پایین"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>

                  <div className="h-5 w-px bg-neutral-200 mx-1"></div>

                  {/* Active Toggle */}
                  <button
                    type="button"
                    onClick={() => toggleSlideStatus(slide)}
                    className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors ${
                      slide.isActive
                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        : 'bg-neutral-200 text-neutral-600 hover:bg-neutral-300'
                    }`}
                    title={slide.isActive ? 'اسلاید فعال است' : 'اسلاید غیرفعال است'}
                  >
                    {slide.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    <span>{slide.isActive ? 'فعال' : 'غیرفعال'}</span>
                  </button>

                  {/* Edit */}
                  <button
                    type="button"
                    onClick={() => openEditModal(slide)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl"
                    title="ویرایش اسلاید"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => deleteSlider(slide.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-xl"
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
          MODAL: ADD / EDIT SLIDE
      ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full max-h-[90vh] overflow-y-auto space-y-5 text-right shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="font-bold text-base text-neutral-900">
                {editingSlide ? 'ویرایش اسلاید صفحه نخست' : 'ساخت اسلاید تبلیغاتی جدید'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-neutral-400 hover:text-neutral-700">✕</button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
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
                <label className="block text-neutral-700 font-bold mb-1">زیرعنوان / توضیحات تشویقی:</label>
                <textarea
                  rows={2}
                  value={subtitle}
                  onChange={e => setSubtitle(e.target.value)}
                  placeholder="تامین انواع قطعات موتوری، گیربکس، دیسک و صفحه با هولوگرام اصالت..."
                  className="w-full p-2.5 border border-neutral-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
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
              </div>

              <div>
                <label className="block text-neutral-700 font-bold mb-1">آدرس اینترنتی تصویر بنر (Image URL) *:</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full p-2.5 border border-neutral-300 rounded-xl font-mono text-left"
                  required
                />

                {/* Preset image suggestions */}
                <div className="mt-2 space-y-1">
                  <span className="text-[10px] text-neutral-400 font-semibold block">پیشنهادات تصاویر آماده:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_BANNER_IMAGES.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setImageUrl(preset.url)}
                        className="text-[10px] px-2 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Image Live Preview */}
                {imageUrl && (
                  <div className="mt-2.5 relative h-28 rounded-xl overflow-hidden border border-neutral-200 bg-neutral-900">
                    <img src={imageUrl} alt="پیش‌نمایش بنر" className="w-full h-full object-cover" />
                    <span className="absolute bottom-1 right-2 text-[10px] bg-black/60 text-white px-2 py-0.5 rounded">
                      پیش‌نمایش تصویر
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                    className="w-full p-2.5 border border-neutral-300 rounded-xl font-mono text-left"
                  >
                    <option value="shop">فروشگاه کلی (shop)</option>
                    <option value="shop:maintenance">قطعات مصرفی و سرویس (shop:maintenance)</option>
                    <option value="part-request">استعلام قطعه کمیاب (part-request)</option>
                    <option value="blog">وبلاگ و آموزش (blog)</option>
                    <option value="account:garage">گاراژ خودروها (account:garage)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
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

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-neutral-100 text-neutral-700 rounded-xl font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-bold shadow-md hover:bg-red-700"
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
