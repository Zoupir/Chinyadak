import fs from 'node:fs';

const changed = [];
const read = file => fs.readFileSync(file, 'utf8');
const write = (file, content) => { fs.writeFileSync(file, content); changed.push(file); };
const edit = (file, transform) => {
  const before = read(file);
  const after = transform(before);
  if (after !== before) write(file, after);
};
const copy = (template, target) => {
  const next = read(template);
  const before = fs.existsSync(target) ? read(target) : '';
  if (before !== next) write(target, next);
};

copy('scripts/templates/v30109-quill-composer.tsx.txt', 'src/components/common/RichTextComposer.tsx');

edit('src/components/common/RichTextEditor.tsx', source =>
  source.replace(/data-rich-editor-version="[^"]+"/, 'data-rich-editor-version="30.10.9"')
);

edit('src/utils/richText.ts', source => {
  source = source.replace(
    '/^(?:Vazirmatn|Tahoma|Arial|sans-serif|serif|monospace)$/i.test(family)',
    '/^(?:Vazirmatn|vazirmatn|Tahoma|tahoma|Arial|arial|sans-serif|serif|monospace)$/i.test(family)'
  );
  if (!source.includes('const direction = style.match(')) {
    source = source.replace(
      "    const lineHeight = style.match(/(?:^|;)\\s*line-height\\s*:\\s*([^;]+)/i);",
      "    const lineHeight = style.match(/(?:^|;)\\s*line-height\\s*:\\s*([^;]+)/i);\n    const direction = style.match(/(?:^|;)\\s*direction\\s*:\\s*(rtl|ltr)\\s*(?:;|$)/i);"
    );
    source = source.replace(
      "      safe.push('line-height:' + lineHeight[1].trim() + '!important');\n    }",
      "      safe.push('line-height:' + lineHeight[1].trim() + '!important');\n    }\n    if (direction) safe.push('direction:' + direction[1].toLowerCase() + '!important');"
    );
  }
  return source;
});

edit('src/components/common/RichTextEditor.css', source => {
  if (source.includes('/* v30.10.9 Quill editor */')) return source;
  return source + `

/* v30.10.9 Quill editor */
.quill-rich-editor {
  border: 1px solid #d4d4d8;
  border-radius: 14px;
  background: #fff;
  overflow: clip;
  direction: rtl;
}
.quill-rich-editor .ql-toolbar.ql-snow,
.quill-rich-toolbar {
  border: 0 !important;
  border-bottom: 1px solid #e5e7eb !important;
  background: #fafafa;
  direction: rtl;
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  align-items: center;
  padding: 8px !important;
  position: sticky;
  top: 0;
  z-index: 6;
}
.quill-rich-editor .ql-container.ql-snow { border: 0 !important; font-family: var(--site-font, Vazirmatn, Tahoma, sans-serif); font-size: 14px; }
.quill-rich-editor .ql-editor {
  direction: rtl;
  text-align: right;
  unicode-bidi: plaintext;
  line-height: 1.9;
  color: #111827;
  padding: 14px 16px;
  overflow-wrap: anywhere;
}
.quill-rich-editor .ql-editor.ql-blank::before { right: 16px; left: auto; text-align: right; font-style: normal; color: #a3a3a3; }
.quill-rich-editor .ql-editor p { margin: .25em 0; }
.quill-rich-editor .ql-editor img { max-width: 100%; height: auto; }
.quill-rich-editor .ql-editor audio,
.quill-rich-editor .ql-editor video { max-width: 100%; }
.quill-rich-editor .ql-editor table { width: 100%; border-collapse: collapse; }
.quill-rich-editor .ql-editor td,
.quill-rich-editor .ql-editor th { border: 1px solid #d4d4d8; padding: 8px; }
.quill-rich-editor .ql-picker { direction: rtl; }
.quill-rich-editor .ql-picker-label { min-width: 34px; }
.quill-rich-editor .ql-font-vazirmatn { font-family: Vazirmatn, Tahoma, sans-serif; }
.quill-rich-editor .ql-font-tahoma { font-family: Tahoma, sans-serif; }
.quill-rich-editor .ql-font-arial { font-family: Arial, sans-serif; }
.quill-rich-editor .ql-font-serif { font-family: serif; }
.quill-rich-editor .ql-font-monospace { font-family: monospace; }
.quill-rich-editor .ql-toolbar button:focus-visible,
.quill-rich-editor .ql-toolbar .ql-picker-label:focus-visible { outline: 2px solid #2563eb; outline-offset: 2px; }
@media (max-width: 640px) {
  .quill-rich-editor .ql-toolbar.ql-snow,
  .quill-rich-toolbar { max-height: 190px; overflow-y: auto; position: static; }
}
`;
});

edit('src/components/admin/AdminView.tsx', source => {
  source = source.replace(
    "isStandaloneProductEditor ? 'w-full py-4 sm:py-6'",
    "isStandaloneProductEditor ? 'fixed inset-x-0 top-16 bottom-0 z-[45] overflow-y-auto bg-neutral-100 px-3 sm:px-6 py-3 sm:py-5'"
  );

  const closeButton = `<button onClick={() => isStandaloneProductEditor ? window.close() : setEditingProduct(null)} className="text-neutral-400 hover:text-neutral-700" title={isStandaloneProductEditor ? 'بستن تب' : 'بستن'}>✕</button>`;
  if (source.includes(closeButton) && !source.includes('data-view-product-button="1"')) {
    source = source.replace(closeButton, `<div className="flex items-center gap-2">
                {isStandaloneProductEditor && editingProduct.slug && (
                  <button
                    type="button"
                    data-view-product-button="1"
                    onClick={() => {
                      const opened = window.open('/product/' + encodeURIComponent(editingProduct.slug), '_blank', 'noopener,noreferrer');
                      if (opened) opened.opener = null;
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-neutral-200 bg-white text-neutral-700 hover:text-red-600 hover:border-red-200 text-xs font-bold"
                  >
                    <Eye className="w-4 h-4" /> مشاهده محصول <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
                <button onClick={() => isStandaloneProductEditor ? window.close() : setEditingProduct(null)} className="w-9 h-9 grid place-items-center rounded-xl bg-neutral-100 text-neutral-500 hover:text-neutral-900" title={isStandaloneProductEditor ? 'بستن تب' : 'بستن'}>✕</button>
              </div>`);
  }
  return source;
});

edit('src/components/common/LiveSectionModal.tsx', source => {
  // Existing visual homepage sections are allowed to have no visible title.
  source = source.replace(/\s*if \(!form\.title\?\.trim\(\)\) \{\s*showToast\('عنوان سکشن الزامی است\.', 'error'\);\s*return;\s*\}/g, '');
  source = source.replace(/\s*if \(!form\.title\?\.trim\(\)\) \{ showToast\('عنوان سکشن الزامی است\.', 'error'\); return; \}/g, '');
  source = source.replace(
    '<button type="button" onClick={save} disabled={isSaving}',
    '<button type="button" data-live-section-save="1" onPointerDown={event => event.stopPropagation()} onClick={save} disabled={isSaving}'
  );
  return source;
});

// Public SSR hydration previously exposed no-op CMS mutations. That made the
// homepage live editor look interactive while Save could never persist.
edit('src/server/ssr-store-context.tsx', source => {
  source = source.replace(
    "  const pages = bootstrap.cms?.pages || [];\n  const settings = { ...INITIAL_SETTINGS, ...(bootstrap.cms?.settings || {}) } as SiteSettings;",
    "  const initialPages = bootstrap.cms?.pages || [];\n  const initialSettings = { ...INITIAL_SETTINGS, ...(bootstrap.cms?.settings || {}) } as SiteSettings;"
  );
  if (!source.includes('const [pages, setPages] = useState<any[]>(initialPages);')) {
    source = source.replace(
      "  const [isLiveEditActive, setIsLiveEditActive] = useState(false);\n  const [toast, setToast] = useState<any>(null);",
      "  const [pages, setPages] = useState<any[]>(initialPages);\n  const [settings, setSettings] = useState<SiteSettings>(initialSettings);\n  const [adminAuth, setAdminAuth] = useState<any>({ isAuthenticated: false, username: '', isMustChangePassword: false, currentUser: null });\n  const [isLiveEditActive, setIsLiveEditActive] = useState(false);\n  const [toast, setToast] = useState<any>(null);"
    );
  }
  if (!source.includes('data-v30109-public-admin-session')) {
    source = source.replace(
      "  useEffect(() => {\n    setSelectedVehicle(safeRead<GarageCar | null>('chinpart_selected_car', null));",
      "  // data-v30109-public-admin-session: live editor on the public storefront\n  // uses authenticated CMS actions instead of the old no-op SSR provider.\n  useEffect(() => {\n    let cancelled = false;\n    void fetch('/api/auth/me', { credentials: 'include' })\n      .then(async response => response.ok ? response.json() : null)\n      .then(data => {\n        if (cancelled || data?.role !== 'admin' || !data.admin) return;\n        setAdminAuth({ isAuthenticated: true, username: data.admin.username || '', isMustChangePassword: false, currentUser: data.admin });\n      })\n      .catch(() => undefined);\n    return () => { cancelled = true; };\n  }, []);\n\n  useEffect(() => {\n    setSelectedVehicle(safeRead<GarageCar | null>('chinpart_selected_car', null));"
    );
  }

  const insertion = `
  const persistPublicPage = async (page: any): Promise<boolean> => {
    try {
      const response = await fetch('/api/cms/pages/' + encodeURIComponent(page.id), {
        method: 'PUT', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify(page)
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.page) throw new Error(data?.error || 'PAGE_SAVE_FAILED');
      setPages(current => current.map(item => item.id === data.page.id ? data.page : item));
      setToast({ message: 'تغییرات سکشن ذخیره شد.', type: 'success' });
      return true;
    } catch (error) {
      console.error('Public live page save failed:', error);
      setToast({ message: 'ذخیره تغییرات انجام نشد.', type: 'error' });
      return false;
    }
  };
  const previewSection = (pageSlug: string, section: any) => {
    setPages(current => current.map(page => page.slug === pageSlug ? {
      ...page,
      sections: (page.sections || []).some((item: any) => item.id === section.id)
        ? (page.sections || []).map((item: any) => item.id === section.id ? { ...section } : item)
        : [...(page.sections || []), { ...section }]
    } : page));
  };
  const updateSection = async (pageSlug: string, section: any): Promise<boolean> => {
    const page = pages.find(item => item.slug === pageSlug);
    if (!page) return false;
    return persistPublicPage({ ...page, sections: (page.sections || []).map((item: any) => item.id === section.id ? section : item) });
  };
  const addSection = async (pageSlug: string, section: any): Promise<boolean> => {
    const page = pages.find(item => item.slug === pageSlug);
    if (!page) return false;
    const exists = (page.sections || []).some((item: any) => item.id === section.id);
    return persistPublicPage({ ...page, sections: exists ? page.sections.map((item: any) => item.id === section.id ? section : item) : [...(page.sections || []), section] });
  };
  const deleteSection = async (pageSlug: string, sectionId: string): Promise<boolean> => {
    const page = pages.find(item => item.slug === pageSlug);
    if (!page) return false;
    return persistPublicPage({ ...page, sections: (page.sections || []).filter((item: any) => item.id !== sectionId) });
  };
  const updateSettings = async (patch: any): Promise<boolean> => {
    try {
      const response = await fetch('/api/cms/settings', { method: 'PATCH', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify(patch) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.settings) throw new Error(data?.error || 'SETTINGS_SAVE_FAILED');
      setSettings(data.settings);
      return true;
    } catch (error) {
      console.error('Public live settings save failed:', error);
      setToast({ message: 'ذخیره تنظیمات انجام نشد.', type: 'error' });
      return false;
    }
  };
`;
  if (!source.includes('const persistPublicPage = async')) {
    const marker = '  const cartCount = cart.reduce';
    const index = source.indexOf(marker);
    if (index < 0) throw new Error('v30.10.9 SSR mutation insertion marker missing');
    source = source.slice(0, index) + insertion + '\n' + source.slice(index);
  }

  source = source.replace("    adminAuth: { isAuthenticated: false, username: '', isMustChangePassword: false },", '    adminAuth,');
  source = source.replace('    updateSettings: noop,\n    updatePage: noop,\n    updateSection: noop,', '    updateSettings,\n    updatePage: persistPublicPage,\n    updateSection,\n    previewSection,\n    addSection,\n    deleteSection,');
  source = source.replace('compareList, isLiveEditActive, toast]);', 'compareList, pages, settings, adminAuth, isLiveEditActive, toast]);');
  return source;
});

const checks = [
  ['src/components/common/RichTextComposer.tsx', 'data-quill-rich-editor="30.10.9"'],
  ['src/components/admin/AdminView.tsx', 'data-view-product-button="1"'],
  ['src/components/admin/AdminView.tsx', "fixed inset-x-0 top-16 bottom-0"],
  ['src/components/common/LiveSectionModal.tsx', 'data-live-section-save="1"'],
  ['src/server/ssr-store-context.tsx', 'data-v30109-public-admin-session'],
  ['src/server/ssr-store-context.tsx', 'const persistPublicPage = async'],
  ['src/components/common/RichTextEditor.css', 'v30.10.9 Quill editor']
];
for (const [file, marker] of checks) if (!read(file).includes(marker)) throw new Error(`v30.10.9 incomplete: ${file} :: ${marker}`);
console.log(changed.length ? `v30.10.9 hotfix applied: ${changed.join(', ')}` : 'v30.10.9 hotfix already applied.');
