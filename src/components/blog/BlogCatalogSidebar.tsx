import React from 'react';
import type { Category } from '../../types';

interface BlogCatalogSidebarProps {
  articleCategories: Array<{ id: string; name: string; slug?: string }>;
  categories: Category[];
  onNavigate: (view: string, param?: string) => void;
}

export const BlogCatalogSidebar: React.FC<BlogCatalogSidebarProps> = ({ articleCategories, categories, onNavigate }) => (
  <aside className="space-y-4 text-right">
    <details open className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <summary className="cursor-pointer font-black text-sm text-neutral-900">دسته‌بندی وبلاگ</summary>
      <nav className="mt-3 space-y-1">
        {articleCategories.map(category => <button key={category.id} type="button" onClick={() => onNavigate('blog', category.slug || category.id)}
          className="block w-full rounded-lg px-3 py-2 text-right text-xs text-neutral-600 hover:bg-neutral-50 hover:text-orange-600">{category.name}</button>)}
      </nav>
    </details>
    <details open className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <summary className="cursor-pointer font-black text-sm text-neutral-900">دسته‌بندی قطعات</summary>
      <nav className="mt-3 space-y-1">
        {categories.map(category => <button key={category.id} type="button" onClick={() => onNavigate('category', category.slug)}
          className="block w-full rounded-lg px-3 py-2 text-right text-xs text-neutral-600 hover:bg-neutral-50 hover:text-orange-600">{category.nameFa}</button>)}
      </nav>
    </details>
  </aside>
);
