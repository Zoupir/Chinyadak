import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { PageSection } from '../../types';
import { RichTextEditor } from './RichTextEditor';
import { ImageUploadInput } from './ImageUploadInput';
import { Edit3, X, Save, Check } from 'lucide-react';

interface LiveSectionModalProps {
  pageSlug: string;
  sectionId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const LiveSectionModal: React.FC<LiveSectionModalProps> = ({
  pageSlug,
  sectionId,
  isOpen,
  onClose
}) => {
  const { pages, updateSection, showToast } = useStore();
  const currentPage = pages.find(p => p.slug === pageSlug);
  const currentSection = currentPage?.sections.find(s => s.id === sectionId);

  const [form, setForm] = useState<PageSection | null>(null);

  useEffect(() => {
    if (currentSection) {
      setForm({ ...currentSection });
    }
  }, [currentSection, isOpen]);

  if (!isOpen || !form) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) {
      showToast('عنوان سکشن الزامی است.', 'error');
      return;
    }

    updateSection(pageSlug, form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full max-h-[90vh] overflow-y-auto space-y-4 text-right shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-neutral-900">ویرایش زنده بخش: {form.title || sectionId}</h3>
              <span className="text-[10px] text-neutral-400">برگه: {currentPage?.title || pageSlug}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-neutral-700 font-bold mb-1">عنوان اصلی بخش *:</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              className="w-full p-2.5 border border-neutral-300 rounded-xl"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-neutral-700 font-bold mb-1">برچسب بالای تیتر (Badge):</label>
              <input
                type="text"
                value={form.badge || ''}
                onChange={e => setForm({ ...form, badge: e.target.value })}
                className="w-full p-2.5 border border-neutral-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-neutral-700 font-bold mb-1">زیرعنوان / خلاصه:</label>
              <input
                type="text"
                value={form.subtitle || ''}
                onChange={e => setForm({ ...form, subtitle: e.target.value })}
                className="w-full p-2.5 border border-neutral-300 rounded-xl"
              />
            </div>
          </div>

          <ImageUploadInput
            label="تصویر این بخش:"
            value={form.imageUrl || ''}
            onChange={(url) => setForm({ ...form, imageUrl: url })}
            aspectRatio="banner"
            presetCategory="banners"
          />

          <RichTextEditor
            label="متن و توضیحات کامل این بخش:"
            value={form.content || ''}
            onChange={(val) => setForm({ ...form, content: val })}
            rows={4}
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-neutral-700 font-bold mb-1">متن دکمه:</label>
              <input
                type="text"
                value={form.buttonText || ''}
                onChange={e => setForm({ ...form, buttonText: e.target.value })}
                className="w-full p-2.5 border border-neutral-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-neutral-700 font-bold mb-1">لینک دکمه:</label>
              <input
                type="text"
                value={form.buttonLink || ''}
                onChange={e => setForm({ ...form, buttonLink: e.target.value })}
                className="w-full p-2.5 border border-neutral-300 rounded-xl font-mono text-left"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-neutral-100 text-neutral-700 rounded-xl font-bold"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-bold shadow-md hover:bg-red-700 flex items-center justify-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>ذخیره تغییرات بخش</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
