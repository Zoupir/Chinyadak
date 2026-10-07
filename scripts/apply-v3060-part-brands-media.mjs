import fs from 'node:fs';

const changed = [];
const edit = (path, transform) => {
  const before = fs.readFileSync(path, 'utf8');
  const after = transform(before);
  if (after !== before) {
    fs.writeFileSync(path, after);
    changed.push(path);
  }
};
const replaceOnce = (source, before, after, label) => {
  if (source.includes(after)) return source;
  const index = source.indexOf(before);
  if (index < 0) throw new Error(`v30.6.0 target missing: ${label}`);
  return source.slice(0, index) + after + source.slice(index + before.length);
};
const replaceRegexOnce = (source, regex, replacement, marker, label) => {
  if (marker && source.includes(marker)) return source;
  let count = 0;
  const result = source.replace(regex, (...args) => {
    count += 1;
    return typeof replacement === 'function' ? replacement(...args) : replacement;
  });
  if (count !== 1) throw new Error(`v30.6.0 expected one ${label}, got ${count}`);
  return result;
};

// ---------------------------------------------------------------------------
// Rich-text: load the real color fix, add safe provider embeds, and allow
// direct audio/video upload from the editor.
// ---------------------------------------------------------------------------
edit('src/components/common/RichTextEditor.css', source => {
  const imports = ["@import './RichTextEditorEnhancements.css';", "@import './RichTextV3060.css';"];
  const missing = imports.filter(item => !source.includes(item));
  return missing.length ? missing.join('\n') + '\n' + source : source;
});

edit('src/utils/richText.ts', source => {
  source = source.replace("'TD', 'TH', 'SPAN', 'HR', 'IMG', 'AUDIO', 'VIDEO'", "'TD', 'TH', 'SPAN', 'HR', 'IMG', 'AUDIO', 'VIDEO', 'IFRAME'");
  if (!source.includes('export const safeRichEmbedSrc')) {
    source = replaceOnce(
      source,
      `export const safeRichSrc = (src: string): boolean =>\n  /^(https?:\\/\\/|\\/)/i.test(src.trim());\n`,
      `export const safeRichSrc = (src: string): boolean =>\n  /^(https?:\\/\\/|\\/)/i.test(src.trim());\n\nexport const safeRichEmbedSrc = (src: string): boolean => {\n  try {\n    const url = new URL(String(src || '').trim());\n    const host = url.hostname.toLowerCase().replace(/^www\\./, '');\n    if (host === 'youtube-nocookie.com' || host === 'youtube.com') return /^\\/embed\\/[A-Za-z0-9_-]{6,}/.test(url.pathname);\n    if (host === 'aparat.com') return /^\\/video\\/video\\/embed\\/videohash\\/[A-Za-z0-9_-]+\\/vt\\/frame/.test(url.pathname);\n    if (host === 'player.vimeo.com') return /^\\/video\\/\\d+/.test(url.pathname);\n    if (host === 'www.dailymotion.com' || host === 'dailymotion.com') return /^\\/embed\\/video\\/[A-Za-z0-9]+/.test(url.pathname);\n    if (host === 'w.soundcloud.com') return url.pathname === '/player/';\n    if (host === 'open.spotify.com') return /^\\/embed\\/(track|episode|show|playlist|album)\\/[A-Za-z0-9]+/.test(url.pathname);\n    return false;\n  } catch { return false; }\n};\n\nexport type ResolvedRichMedia = { kind: 'audio' | 'video' | 'embed'; src: string };\n\nexport const resolveRichMediaSource = (input: string, preferred: 'audio' | 'video'): ResolvedRichMedia | null => {\n  const raw = String(input || '').trim();\n  if (!raw) return null;\n  try {\n    const url = new URL(raw);\n    const host = url.hostname.toLowerCase().replace(/^www\\./, '');\n    const path = url.pathname;\n    if (host === 'youtu.be') {\n      const id = path.split('/').filter(Boolean)[0];\n      return id ? { kind: 'embed', src: 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) } : null;\n    }\n    if (host === 'youtube.com' || host === 'm.youtube.com') {\n      const id = url.searchParams.get('v') || path.match(/^\\/(?:shorts|embed)\\/([A-Za-z0-9_-]+)/)?.[1];\n      return id ? { kind: 'embed', src: 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) } : null;\n    }\n    if (host === 'aparat.com') {\n      const id = path.match(/^\\/v\\/([A-Za-z0-9_-]+)/)?.[1] || path.match(/videohash\\/([A-Za-z0-9_-]+)/)?.[1];\n      return id ? { kind: 'embed', src: 'https://www.aparat.com/video/video/embed/videohash/' + encodeURIComponent(id) + '/vt/frame' } : null;\n    }\n    if (host === 'vimeo.com' || host === 'player.vimeo.com') {\n      const id = path.match(/(?:video\\/)?(\\d+)/)?.[1];\n      return id ? { kind: 'embed', src: 'https://player.vimeo.com/video/' + id } : null;\n    }\n    if (host === 'dailymotion.com' || host === 'dai.ly') {\n      const id = host === 'dai.ly' ? path.split('/').filter(Boolean)[0] : path.match(/(?:video|embed\\/video)\\/([A-Za-z0-9]+)/)?.[1];\n      return id ? { kind: 'embed', src: 'https://www.dailymotion.com/embed/video/' + id } : null;\n    }\n    if (host === 'soundcloud.com' || host.endsWith('.soundcloud.com')) {\n      return { kind: 'embed', src: 'https://w.soundcloud.com/player/?url=' + encodeURIComponent(raw) + '&auto_play=false&hide_related=false&show_comments=false' };\n    }\n    if (host === 'open.spotify.com') {\n      const match = path.match(/^\\/(track|episode|show|playlist|album)\\/([A-Za-z0-9]+)/);\n      if (match) return { kind: 'embed', src: 'https://open.spotify.com/embed/' + match[1] + '/' + match[2] };\n    }\n  } catch {\n    if (raw.startsWith('/') && safeRichSrc(raw)) return { kind: preferred, src: raw };\n    return null;\n  }\n  return safeRichSrc(raw) ? { kind: preferred, src: raw } : null;\n};\n`,
      'rich-media provider helpers'
    );
  }
  source = source.replace(/\|iframe/g, '');
  if (!source.includes("if (name === 'IFRAME')")) {
    source = replaceOnce(
      source,
      `    if (name === 'TD' || name === 'TH') {`,
      `    if (name === 'IFRAME') {\n      const src = safeAttr(rawAttrs, 'src');\n      if (!src || !safeRichEmbedSrc(src)) return '';\n      const title = safeAttr(rawAttrs, 'title') || 'رسانه تعبیه‌شده';\n      return '<iframe src="' + escapeRichText(src) + '" title="' + escapeRichText(title) + '" data-rich-embed="1" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>';\n    }\n\n    if (name === 'TD' || name === 'TH') {`,
      'iframe sanitizer'
    );
  }
  source = source.replace('|img|audio|video)\\b/i.test(source)', '|img|audio|video|iframe)\\b/i.test(source)');
  return source;
});

edit('src/components/common/RichTextComposer.tsx', source => {
  source = source.replace('  Unlink,\n  Video', '  Unlink,\n  UploadCloud,\n  Video');
  source = source.replace(
    "import { markdownToSafeHtml, safeRichHref, safeRichSrc, sanitizeRichHtml } from '../../utils/richText';",
    "import { markdownToSafeHtml, resolveRichMediaSource, safeRichHref, safeRichSrc, sanitizeRichHtml } from '../../utils/richText';\nimport { uploadRichMedia } from '../../api/richMedia';"
  );
  if (!source.includes("name: 'richEmbed'")) {
    source = replaceOnce(
      source,
      `const ToolButton: React.FC<ToolButtonProps>`,
      `const RichEmbed = Node.create({\n  name: 'richEmbed',\n  group: 'block',\n  atom: true,\n  draggable: true,\n  selectable: true,\n  addAttributes() { return { src: { default: '' }, title: { default: 'رسانه تعبیه‌شده' } }; },\n  parseHTML() { return [{ tag: 'iframe[data-rich-embed][src]' }]; },\n  renderHTML({ HTMLAttributes }) {\n    return ['iframe', mergeAttributes(HTMLAttributes, {\n      'data-rich-embed': '1',\n      loading: 'lazy',\n      allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',\n      allowfullscreen: 'true',\n      referrerpolicy: 'strict-origin-when-cross-origin'\n    })];\n  }\n});\n\nconst ToolButton: React.FC<ToolButtonProps>`,
      'TipTap rich embed node'
    );
  }
  source = source.replace('    RichVideo,\n    Placeholder.configure', '    RichVideo,\n    RichEmbed,\n    Placeholder.configure');
  if (!source.includes('const [uploadingMedia, setUploadingMedia]')) {
    source = source.replace(
      "  const [mediaError, setMediaError] = useState('');",
      "  const [mediaError, setMediaError] = useState('');\n  const [uploadingMedia, setUploadingMedia] = useState(false);"
    );
  }
  source = replaceRegexOnce(
    source,
    /  const insertUrlMedia = \(event: React\.FormEvent\) => \{[\s\S]*?\n  \};\n\n  return \(/,
    `  const insertResolvedMedia = (input: string, preferred: UrlMediaType) => {\n    const resolved = resolveRichMediaSource(input, preferred);\n    if (!resolved) return false;\n    const type = resolved.kind === 'embed' ? 'richEmbed' : resolved.kind === 'video' ? 'richVideo' : 'richAudio';\n    editor.chain().focus().insertContent({ type, attrs: { src: resolved.src } }).run();\n    return true;\n  };\n\n  const insertUrlMedia = (event: React.FormEvent) => {\n    event.preventDefault();\n    const src = mediaUrl.trim();\n    if (!urlMediaType || !insertResolvedMedia(src, urlMediaType)) {\n      setMediaError('نشانی معتبر فایل یا لینک YouTube، Aparat، Vimeo، Dailymotion، SoundCloud یا Spotify وارد کنید.');\n      return;\n    }\n    setUrlMediaType(null);\n    setMediaUrl('');\n    setMediaError('');\n  };\n\n  const uploadDirectMedia = async (file: File | undefined) => {\n    if (!file || !urlMediaType) return;\n    setUploadingMedia(true);\n    setMediaError('');\n    try {\n      const uploaded = await uploadRichMedia(file, urlMediaType, 'editor');\n      if (!insertResolvedMedia(uploaded.url, urlMediaType)) throw new Error('MEDIA_INSERT_FAILED');\n      setUrlMediaType(null);\n      setMediaUrl('');\n    } catch (error) {\n      console.error(error);\n      setMediaError('آپلود رسانه انجام نشد. فرمت یا حجم فایل را بررسی کنید.');\n    } finally {\n      setUploadingMedia(false);\n    }\n  };\n\n  return (`,
    'const uploadDirectMedia = async',
    'rich media URL/upload handler'
  );
  source = replaceRegexOnce(
    source,
    /        \{urlMediaType && \(\n          <form className="rich-text-media-form"[\s\S]*?\n          <\/form>\n        \)\}/,
    `        {urlMediaType && (\n          <form className="rich-text-media-form" onSubmit={insertUrlMedia}>\n            <label htmlFor="rich-text-media-url">{urlMediaType === 'video' ? 'ویدئو: فایل، YouTube، Aparat، Vimeo یا Dailymotion' : 'صدا: فایل، SoundCloud یا Spotify'}</label>\n            <input\n              id="rich-text-media-url"\n              ref={mediaInputRef}\n              type="text"\n              inputMode="url"\n              value={mediaUrl}\n              placeholder={urlMediaType === 'video' ? 'https://www.aparat.com/v/... یا https://youtu.be/...' : 'https://soundcloud.com/... یا لینک فایل MP3'}\n              onChange={event => setMediaUrl(event.currentTarget.value)}\n            />\n            <button type="submit">درج از لینک</button>\n            <button type="button" onMouseDown={event => event.preventDefault()} onClick={() => setUrlMediaType(null)}>انصراف</button>\n            <div className="rich-text-media-form__upload">\n              <input\n                type="file"\n                accept={urlMediaType === 'video' ? 'video/mp4,video/webm,video/ogg,video/quicktime' : 'audio/mpeg,audio/wav,audio/ogg,audio/mp4,audio/aac'}\n                disabled={uploadingMedia}\n                onChange={event => { const file = event.currentTarget.files?.[0]; void uploadDirectMedia(file); event.currentTarget.value = ''; }}\n              />\n              <button type="button" disabled={uploadingMedia} onClick={event => { const input = event.currentTarget.parentElement?.querySelector('input[type=file]') as HTMLInputElement | null; input?.click(); }}>\n                <UploadCloud aria-hidden="true" className="inline h-3.5 w-3.5" /> {uploadingMedia ? 'در حال آپلود…' : 'آپلود مستقیم'}\n              </button>\n            </div>\n            <span className="rich-text-media-form__hint">ویدئو: MP4/WebM/OGV/MOV — صدا: MP3/WAV/OGG/M4A/AAC. حداکثر حجم از MAX_RICH_MEDIA_MB سرور کنترل می‌شود.</span>\n            {mediaError && <span className="rich-text-media-form__error" role="alert">{mediaError}</span>}\n          </form>\n        )}`,
    'YouTube، Aparat',
    'rich media editor form'
  );
  return source;
});

// ---------------------------------------------------------------------------
// First-class part-brand domain model and product many-to-many relations.
// ---------------------------------------------------------------------------
edit('src/types/index.ts', source => {
  if (!source.includes('export interface PartBrand {')) {
    source = replaceOnce(
      source,
      '\nexport interface VehicleModel {',
      `\nexport interface PartBrand {\n  id: string;\n  nameFa: string;\n  nameEn: string;\n  slug: string;\n  logo: string;\n  heroImage: string;\n  description: string;\n  bottomDescription?: string;\n  country: string;\n  foundedYear?: number;\n  websiteUrl?: string;\n  group?: string;\n  specialties?: string[];\n  certifications?: string[];\n  popularCategorySlugs?: string[];\n  productsCount?: number;\n  faq: { q: string; a: string }[];\n  seo?: SeoEntityDraft;\n}\n\nexport interface VehicleModel {`,
      'PartBrand interface'
    );
  }
  if (!source.includes('partBrandIds?: string[];')) {
    source = source.replace(
      '  partManufacturerCompany?: string;\n',
      '  partManufacturerCompany?: string;\n  partBrandIds?: string[];\n  primaryPartBrandId?: string;\n'
    );
  }
  return source;
});

edit('src/server/routes/catalog.ts', source => {
  source = source.replace(
    `  product.vehicleBrandIds = Array.isArray(product.vehicleBrandIds) ? product.vehicleBrandIds : [];`,
    `  product.vehicleBrandIds = Array.isArray(product.vehicleBrandIds) ? product.vehicleBrandIds.map(String).filter(Boolean) : [];\n  product.partBrandIds = Array.isArray(product.partBrandIds) ? Array.from(new Set(product.partBrandIds.map(String).filter(Boolean))) : [];\n  product.primaryPartBrandId = String(product.primaryPartBrandId || product.partBrandIds[0] || '').trim() || undefined;`
  );
  if (!source.includes('const syncProductPartBrands = async')) {
    source = replaceOnce(
      source,
      `const validateProduct = (product: any): string | null => {`,
      `const syncProductPartBrands = async (product: any): Promise<void> => {\n  const ids = Array.isArray(product.partBrandIds) ? Array.from(new Set(product.partBrandIds.map(String).filter(Boolean))) : [];\n  await pool.execute('DELETE FROM product_part_brands WHERE product_id = ?', [product.id]);\n  for (let index = 0; index < ids.length; index += 1) {\n    const partBrandId = ids[index];\n    await pool.execute(\n      'INSERT IGNORE INTO product_part_brands (product_id, part_brand_id, is_primary, sort_order) VALUES (?, ?, ?, ?)',\n      [product.id, partBrandId, partBrandId === product.primaryPartBrandId ? 1 : 0, index]\n    );\n  }\n};\n\nconst validateProduct = (product: any): string | null => {`,
      'product part-brand relation synchronizer'
    );
  }
  source = source.replace('    res.status(201).json({ product });', '    await syncProductPartBrands(product);\n    res.status(201).json({ product });');
  source = source.replace('    res.json({ product });\n  } catch (error: any) {\n    if (error?.code === \'ER_DUP_ENTRY\') {', '    await syncProductPartBrands(product);\n    res.json({ product });\n  } catch (error: any) {\n    if (error?.code === \'ER_DUP_ENTRY\') {');
  return source;
});

edit('src/context/StoreContext.tsx', source => {
  source = source.replace('  CarBrand,\n  VehicleModel,', '  CarBrand,\n  PartBrand,\n  VehicleModel,');
  source = source.replace("type: 'product' | 'article' | 'page' | 'category' | 'brand' | 'model'", "type: 'product' | 'article' | 'page' | 'category' | 'brand' | 'model' | 'part_brand'");
  if (!source.includes('partBrands: PartBrand[];')) source = source.replace('  brands: CarBrand[];\n  models: VehicleModel[];', '  brands: CarBrand[];\n  partBrands: PartBrand[];\n  models: VehicleModel[];');
  if (!source.includes('addPartBrand: (brand: PartBrand)')) {
    source = source.replace(
      '  // Brands & Models Management\n',
      `  // Part brands / component manufacturers\n  addPartBrand: (brand: PartBrand) => void;\n  updatePartBrand: (brand: PartBrand) => void;\n  deletePartBrand: (brandId: string) => void;\n\n  // Brands & Models Management\n`
    );
  }
  if (!source.includes('const [partBrands, setPartBrands]')) source = source.replace('  const [brands, setBrands] = useState<CarBrand[]>([]);', '  const [brands, setBrands] = useState<CarBrand[]>([]);\n  const [partBrands, setPartBrands] = useState<PartBrand[]>([]);');
  if (!source.includes("apiRequest<{ partBrands: PartBrand[] }>('/api/part-brands')")) {
    source = source.replace(
      "      apiRequest<{ brands: CarBrand[]; models: VehicleModel[] }>('/api/vehicles'),",
      "      apiRequest<{ brands: CarBrand[]; models: VehicleModel[] }>('/api/vehicles'),\n      apiRequest<{ partBrands: PartBrand[] }>('/api/part-brands'),"
    );
    source = source.replace('.then(([productData, categoryData, vehicleData, cmsData]) => {', '.then(([productData, categoryData, vehicleData, partBrandData, cmsData]) => {');
    source = source.replace('        setBrands(vehicleData.brands);\n        setModels(vehicleData.models);', '        setBrands(vehicleData.brands);\n        setPartBrands(partBrandData.partBrands || []);\n        setModels(vehicleData.models);');
    source = source.replace('          setBrands(INITIAL_BRANDS);\n          setModels(INITIAL_MODELS);', '          setBrands(INITIAL_BRANDS);\n          setPartBrands([]);\n          setModels(INITIAL_MODELS);');
  }
  if (!source.includes('const addPartBrand = (brand: PartBrand)')) {
    source = replaceOnce(
      source,
      '  // Brands & Models\n',
      `  // Part brands / component manufacturers\n  const addPartBrand = (brand: PartBrand) => {\n    void apiRequest<{ partBrand: PartBrand }>('/api/part-brands', { method: 'POST', body: JSON.stringify(brand) })\n      .then(async ({ partBrand: saved }) => {\n        setPartBrands(prev => [...prev.filter(item => item.id !== saved.id), saved].sort((a,b) => a.nameFa.localeCompare(b.nameFa, 'fa')));\n        try { await syncSeoDraft('part_brand', saved.id, saved.seo); } catch (error) { console.error('Part-brand SEO sync failed:', error); }\n        showToast(\`برند قطعه \${saved.nameFa} اضافه شد.\`);\n      }).catch(error => { console.error(error); showToast('ثبت برند قطعه انجام نشد.', 'error'); });\n  };\n  const updatePartBrand = (brand: PartBrand) => {\n    void apiRequest<{ partBrand: PartBrand }>(\`/api/part-brands/\${encodeURIComponent(brand.id)}\`, { method: 'PUT', body: JSON.stringify(brand) })\n      .then(async ({ partBrand: saved }) => {\n        setPartBrands(prev => prev.map(item => item.id === saved.id ? saved : item));\n        try { await syncSeoDraft('part_brand', saved.id, saved.seo); } catch (error) { console.error('Part-brand SEO sync failed:', error); }\n        showToast(\`برند قطعه \${saved.nameFa} به‌روزرسانی شد.\`);\n      }).catch(error => { console.error(error); showToast('ویرایش برند قطعه انجام نشد.', 'error'); });\n  };\n  const deletePartBrand = (brandId: string) => {\n    void apiRequest<{ ok: boolean }>(\`/api/part-brands/\${encodeURIComponent(brandId)}\`, { method: 'DELETE' })\n      .then(() => { setPartBrands(prev => prev.filter(item => item.id !== brandId)); showToast('برند قطعه غیرفعال شد.', 'info'); })\n      .catch(error => { console.error(error); showToast('حذف برند قطعه انجام نشد.', 'error'); });\n  };\n\n  // Brands & Models\n`,
      'part-brand context CRUD'
    );
  }
  source = source.replace('      brands,\n      models,', '      brands,\n      partBrands,\n      models,');
  source = source.replace('      addBrand,\n      updateBrand,\n      deleteBrand,', '      addPartBrand,\n      updatePartBrand,\n      deletePartBrand,\n      addBrand,\n      updateBrand,\n      deleteBrand,');
  return source;
});

edit('src/server/ssr-store-context.tsx', source => {
  if (!source.includes('partBrands?: { partBrands?: any[] }')) source = source.replace('  vehicles?: { brands?: any[]; models?: any[] };', '  vehicles?: { brands?: any[]; models?: any[] };\n  partBrands?: { partBrands?: any[] };');
  if (!source.includes('const partBrands = bootstrap.partBrands')) source = source.replace('  const brands = bootstrap.vehicles?.brands || [];', '  const brands = bootstrap.vehicles?.brands || [];\n  const partBrands = bootstrap.partBrands?.partBrands || [];');
  source = source.replace('    brands,\n    models,', '    brands,\n    partBrands,\n    models,');
  source = source.replace('products, brands, models, categories', 'products, brands, partBrands, models, categories');
  return source;
});

edit('src/components/admin/ProductClassificationFields.tsx', source => {
  source = source.replace('CarBrand, Category, CategoryChild, Product, VehicleFitment, VehicleModel', 'CarBrand, Category, CategoryChild, PartBrand, Product, VehicleFitment, VehicleModel');
  source = source.replace('  brands: CarBrand[];\n  models: VehicleModel[];', '  brands: CarBrand[];\n  partBrands: PartBrand[];\n  models: VehicleModel[];');
  source = source.replace('  brands,\n  models,\n  products', '  brands,\n  partBrands,\n  models,\n  products');
  if (!source.includes('const selectedPartBrandIds')) source = source.replace('  const selectedModelIds = value.vehicleModelIds || (value.fitments || []).map(item => item.modelId);', '  const selectedModelIds = value.vehicleModelIds || (value.fitments || []).map(item => item.modelId);\n  const selectedPartBrandIds = value.partBrandIds || [];');
  source = source.replace('        ...products.map(item => item.partManufacturerCompany || item.brandManufacturer || \'\'),', '        ...partBrands.flatMap(item => [item.nameFa, item.nameEn]),\n        ...products.map(item => item.partManufacturerCompany || item.brandManufacturer || \'\'),');
  source = source.replace('    [products]\n  );', '    [products, partBrands]\n  );');
  if (!source.includes('const togglePartBrand =')) {
    source = replaceOnce(
      source,
      '  const visibleModels = models.filter(model =>',
      `  const togglePartBrand = (partBrand: PartBrand, checked: boolean) => {\n    const ids = new Set(selectedPartBrandIds);\n    if (checked) ids.add(partBrand.id); else ids.delete(partBrand.id);\n    const nextIds = Array.from(ids);\n    let primary = value.primaryPartBrandId || '';\n    if (!nextIds.includes(primary)) primary = nextIds[0] || '';\n    const primaryBrand = partBrands.find(item => item.id === primary);\n    patch({\n      partBrandIds: nextIds,\n      primaryPartBrandId: primary || undefined,\n      ...(primaryBrand ? {\n        partManufacturerCompany: primaryBrand.nameEn || primaryBrand.nameFa,\n        brandManufacturer: primaryBrand.nameEn || primaryBrand.nameFa\n      } : {})\n    });\n  };\n\n  const visibleModels = models.filter(model =>`,
      'part-brand toggle'
    );
  }
  if (!source.includes('برندهای سازنده قطعه')) {
    source = source.replace(
      `      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">\n        <label>\n          <span className="block text-[10px] font-bold text-neutral-700 mb-1 flex items-center gap-1"><Factory className="w-3.5 h-3.5" /> شرکت تولید/مونتاژ خودرو</span>`,
      `      <div className="rounded-2xl border border-orange-200 bg-orange-50/40 p-3">\n        <div className="flex items-center justify-between mb-2">\n          <span className="text-[10px] font-black text-neutral-800 flex items-center gap-1"><Factory className="w-3.5 h-3.5 text-orange-600" /> برندهای سازنده قطعه</span>\n          <span className="text-[9px] text-neutral-400">یک محصول می‌تواند چند برند داشته باشد</span>\n        </div>\n        <div className="flex flex-wrap gap-2">\n          {partBrands.map(partBrand => {\n            const checked = selectedPartBrandIds.includes(partBrand.id);\n            return (\n              <label key={partBrand.id} className={\`px-2.5 py-2 rounded-xl border cursor-pointer flex items-center gap-2 text-[10px] font-bold \${checked ? 'bg-orange-600 border-orange-600 text-white' : 'bg-white border-neutral-200 text-neutral-700'}\`}>\n                <input type="checkbox" checked={checked} onChange={event => togglePartBrand(partBrand, event.target.checked)} className="hidden" />\n                {partBrand.logo && <img src={partBrand.logo} alt="" className="w-5 h-5 object-contain rounded bg-white" />}\n                {partBrand.nameFa}\n              </label>\n            );\n          })}\n        </div>\n        {selectedPartBrandIds.length > 0 && (\n          <label className="block mt-3">\n            <span className="block text-[10px] font-bold text-neutral-700 mb-1">برند اصلی این محصول</span>\n            <select value={value.primaryPartBrandId || selectedPartBrandIds[0] || ''} onChange={event => { const primary = partBrands.find(item => item.id === event.target.value); patch({ primaryPartBrandId: event.target.value, ...(primary ? { partManufacturerCompany: primary.nameEn || primary.nameFa, brandManufacturer: primary.nameEn || primary.nameFa } : {}) }); }} className="w-full p-2.5 border border-neutral-300 rounded-xl bg-white text-xs">\n              {partBrands.filter(item => selectedPartBrandIds.includes(item.id)).map(item => <option key={item.id} value={item.id}>{item.nameFa} — {item.nameEn}</option>)}\n            </select>\n          </label>\n        )}\n      </div>\n\n      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">\n        <label>\n          <span className="block text-[10px] font-bold text-neutral-700 mb-1 flex items-center gap-1"><Factory className="w-3.5 h-3.5" /> شرکت تولید/مونتاژ خودرو</span>`
    );
  }
  return source;
});

// ---------------------------------------------------------------------------
// Admin management surface for part brands.
// ---------------------------------------------------------------------------
edit('src/components/admin/AdminEntitySeoPanel.tsx', source => source.replace("type EntityType = 'product' | 'article' | 'page' | 'category' | 'brand' | 'model';", "type EntityType = 'product' | 'article' | 'page' | 'category' | 'brand' | 'model' | 'part_brand';"));

edit('src/components/admin/AdminView.tsx', source => {
  if (!source.includes("import { AdminPartBrandsTab }")) source = source.replace("import { AdminCarsTab } from './AdminCarsTab';", "import { AdminCarsTab } from './AdminCarsTab';\nimport { AdminPartBrandsTab } from './AdminPartBrandsTab';");
  source = source.replace('    products, \n    categories,', '    products, \n    partBrands,\n    categories,');
  source = source.replace("'overview' | 'cars' | 'products'", "'overview' | 'cars' | 'part_brands' | 'products'");
  source = source.replace("if (resolvedTarget?.startsWith('brand:') || resolvedTarget?.startsWith('model:')) return 'cars';", "if (resolvedTarget?.startsWith('part-brand:')) return 'part_brands';\n    if (resolvedTarget?.startsWith('brand:') || resolvedTarget?.startsWith('model:')) return 'cars';");
  source = source.replace("'overview','cars','products'", "'overview','cars','part_brands','products'");
  if (!source.includes("id: 'part_brands'")) source = source.replace("        { id: 'cars', label: 'خودروها و برندها', icon: Car, count: models.length },", "        { id: 'cars', label: 'خودروها و برندها', icon: Car, count: models.length },\n        { id: 'part_brands', label: 'برندهای قطعات', icon: Factory, count: partBrands.length },");
  source = source.replace("case 'cars':", "case 'part_brands':\n      case 'cars':");
  if (!source.includes("activeTab === 'part_brands'")) source = source.replace("          {activeTab === 'cars' && (\n            <AdminCarsTab initialTarget={resolvedTarget} />\n          )}", "          {activeTab === 'cars' && (\n            <AdminCarsTab initialTarget={resolvedTarget} />\n          )}\n\n          {activeTab === 'part_brands' && (\n            <AdminPartBrandsTab initialBrandId={resolvedTarget?.startsWith('part-brand:') ? resolvedTarget.slice('part-brand:'.length) : undefined} />\n          )}");
  source = source.replace('                brands={brands}\n                models={models}', '                brands={brands}\n                partBrands={partBrands}\n                models={models}');
  return source;
});

// ---------------------------------------------------------------------------
// App routing, SSR routing, admin deep-links and internal linking.
// ---------------------------------------------------------------------------
edit('src/utils/navigation.ts', source => {
  if (!source.includes("if (view === 'part-brand')")) source = source.replace("  if (view === 'car-brand' || view === 'brand') return `/brand/${encodeSegment(param)}`;", "  if (view === 'car-brand' || view === 'brand') return `/brand/${encodeSegment(param)}`;\n  if (view === 'part-brand') return `/part-brand/${encodeSegment(param)}`;");
  return source;
});

edit('src/App.tsx', source => {
  if (!source.includes("PartBrandDetailView")) source = source.replace("import { BrandDetailView } from './components/brand/BrandDetailView';", "import { BrandDetailView } from './components/brand/BrandDetailView';\nimport { PartBrandDetailView } from './components/brand/PartBrandDetailView';");
  source = source.replace('products, categories, models, brands, articles', 'products, categories, models, brands, partBrands, articles');
  if (!source.includes("view === 'part-brand'")) source = source.replace("    } else if ((view === 'car-brand' || view === 'brand') && param) {\n      const brand = brands.find(item => item.id === param || item.slug === param);\n      canonicalParam = brand?.slug || param;\n    }", "    } else if ((view === 'car-brand' || view === 'brand') && param) {\n      const brand = brands.find(item => item.id === param || item.slug === param);\n      canonicalParam = brand?.slug || param;\n    } else if (view === 'part-brand' && param) {\n      const brand = partBrands.find((item: any) => item.id === param || item.slug === param);\n      canonicalParam = brand?.slug || param;\n    }");
  if (!source.includes('<PartBrandDetailView')) source = source.replace("        {route.view === 'car-brand' && route.param && (\n          <BrandDetailView\n            brandSlug={route.param}\n            onNavigate={handleNavigate}\n          />\n        )}", "        {route.view === 'car-brand' && route.param && (\n          <BrandDetailView brandSlug={route.param} onNavigate={handleNavigate} />\n        )}\n\n        {route.view === 'part-brand' && route.param && (\n          <PartBrandDetailView brandSlug={route.param} onNavigate={handleNavigate} />\n        )}");
  return source;
});

edit('src/server/public-storefront-react.tsx', source => {
  if (!source.includes("PartBrandDetailView")) source = source.replace("import { BrandDetailView } from '../components/brand/BrandDetailView';", "import { BrandDetailView } from '../components/brand/BrandDetailView';\nimport { PartBrandDetailView } from '../components/brand/PartBrandDetailView';");
  if (!source.includes("route.view === 'part-brand'")) source = source.replace("  if (route.view === 'car-brand' && route.param) {\n    return <BrandDetailView brandSlug={route.param} onNavigate={onNavigate} />;\n  }", "  if (route.view === 'car-brand' && route.param) {\n    return <BrandDetailView brandSlug={route.param} onNavigate={onNavigate} />;\n  }\n  if (route.view === 'part-brand' && route.param) {\n    return <PartBrandDetailView brandSlug={route.param} onNavigate={onNavigate} />;\n  }");
  source = source.replace("  if (view === 'car-brand') return `brand:${param || ''}`;", "  if (view === 'car-brand') return `brand:${param || ''}`;\n  if (view === 'part-brand') return `part-brand:${param || ''}`;");
  return source;
});

edit('src/components/layout/Header.tsx', source => source.replace("                    : currentView === 'car-brand' ? `brand:${currentParam || ''}`", "                    : currentView === 'car-brand' ? `brand:${currentParam || ''}`\n                    : currentView === 'part-brand' ? `part-brand:${currentParam || ''}`"));

edit('src/components/product/ProductDetailView.tsx', source => {
  source = source.replace('    products, \n    selectedVehicle,', '    products,\n    partBrands,\n    brands,\n    models, \n    selectedVehicle,');
  if (!source.includes('const linkedPartBrands =')) source = source.replace(
    '  const relatedProductsCount = Math.max(1, Math.min(50, Number(settings.relatedProductsCount || 4)));',
    `  const linkedPartBrands = partBrands.filter((brand: any) => product.partBrandIds?.includes(brand.id) || (!product.partBrandIds?.length && [product.brandManufacturer, product.partManufacturerCompany].some(value => String(value || '').trim().toLowerCase() === String(brand.nameEn || brand.nameFa || '').trim().toLowerCase())));\n  const linkedVehicleBrands = brands.filter((brand: any) => (product.vehicleBrandIds || []).includes(brand.id) || product.fitments.some(f => f.brandId === brand.id));\n  const linkedVehicleModels = models.filter((model: any) => (product.vehicleModelIds || []).includes(model.id) || product.fitments.some(f => f.modelId === model.id));\n\n  const relatedProductsCount = Math.max(1, Math.min(50, Number(settings.relatedProductsCount || 4)));`
  );
  source = source.replace(
    '<span className="font-bold text-neutral-800">{product.brandManufacturer}</span>',
    `{linkedPartBrands.length ? (\n                <span className="flex flex-wrap items-center gap-1.5">\n                  {linkedPartBrands.map((brand: any) => <button key={brand.id} onClick={() => onNavigate('part-brand', brand.slug || brand.id)} className="inline-flex items-center gap-1 rounded-lg bg-orange-50 px-2 py-1 font-bold text-orange-800 hover:bg-orange-100">{brand.logo && <img src={brand.logo} alt="" className="h-4 w-4 object-contain" />}{brand.nameFa}</button>)}\n                </span>\n              ) : <span className="font-bold text-neutral-800">{product.brandManufacturer}</span>}`
  );
  if (!source.includes('ارتباطات این قطعه')) source = source.replace(
    `            {/* Rating and Reviews */}`,
    `            {(linkedPartBrands.length > 0 || linkedVehicleBrands.length > 0 || linkedVehicleModels.length > 0) && (\n              <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-3">\n                <span className="block text-[10px] font-black text-neutral-500 mb-2">ارتباطات این قطعه</span>\n                <div className="flex flex-wrap gap-2">\n                  {linkedPartBrands.map((brand: any) => <button key={'pb-'+brand.id} onClick={() => onNavigate('part-brand', brand.slug || brand.id)} className="rounded-lg bg-orange-50 px-2.5 py-1.5 text-[10px] font-bold text-orange-800">برند قطعه: {brand.nameFa}</button>)}\n                  {linkedVehicleBrands.map((brand: any) => <button key={'vb-'+brand.id} onClick={() => onNavigate('car-brand', brand.slug || brand.id)} className="rounded-lg bg-blue-50 px-2.5 py-1.5 text-[10px] font-bold text-blue-800">خودرو: {brand.nameFa}</button>)}\n                  {linkedVehicleModels.slice(0, 8).map((model: any) => <button key={'vm-'+model.id} onClick={() => onNavigate('car-model', model.slug || model.id)} className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-[10px] font-bold text-emerald-800">{model.nameFa}</button>)}\n                </div>\n              </div>\n            )}\n\n            {/* Rating and Reviews */}`
  );
  return source;
});

edit('src/components/brand/BrandDetailView.tsx', source => {
  source = source.replace('const { brands, models, products, categories, setSelectedVehicle } = useStore();', 'const { brands, partBrands, models, products, categories, setSelectedVehicle } = useStore();');
  if (!source.includes('const relatedPartBrands =')) source = source.replace('  const brandProducts = products.filter(p => p.fitments.some(f => f.brandId === brand.id || f.modelId === \'all\'));', "  const brandProducts = products.filter(p => p.fitments.some(f => f.brandId === brand.id || f.modelId === 'all'));\n  const relatedPartBrandIds = Array.from(new Set(brandProducts.flatMap((product: any) => product.partBrandIds || [])));\n  const relatedPartBrands = partBrands.filter((item: any) => relatedPartBrandIds.includes(item.id));");
  if (!source.includes('برندهای قطعات موجود برای')) source = source.replace(
    `        {/* Popular Parts for this Brand */}`,
    `        {relatedPartBrands.length > 0 && (\n          <section className="rounded-3xl border border-orange-100 bg-orange-50/40 p-6">\n            <h2 className="text-lg font-black text-neutral-900 flex items-center gap-2"><Wrench className="w-5 h-5 text-orange-600" /> برندهای قطعات موجود برای {brand.nameFa}</h2>\n            <p className="text-xs text-neutral-500 mt-1">این فهرست از ارتباط واقعی محصولات با خودرو استخراج می‌شود.</p>\n            <div className="mt-4 flex flex-wrap gap-2">{relatedPartBrands.map((item: any) => <button key={item.id} onClick={() => onNavigate('part-brand', item.slug || item.id)} className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-bold shadow-sm hover:text-orange-700">{item.logo && <img src={item.logo} alt="" className="w-6 h-6 object-contain" />}{item.nameFa}</button>)}</div>\n          </section>\n        )}\n\n        {/* Popular Parts for this Brand */}`
  );
  return source;
});

// ---------------------------------------------------------------------------
// SSR bootstrap and TakRank SEO for /part-brand/*.
// ---------------------------------------------------------------------------
edit('src/server/storefront-html.ts', source => {
  if (!source.includes('partBrands: { partBrands: any[] };')) source = source.replace('  vehicles: { brands: any[]; models: any[] };', '  vehicles: { brands: any[]; models: any[] };\n  partBrands: { partBrands: any[] };');
  source = source.replace('/(product|article|category|page|brand|car-model)', '/(product|article|category|page|brand|part-brand|car-model)');
  source = source.replace("brand: 'brand', 'car-model': 'model'", "brand: 'brand', 'part-brand': 'part_brand', 'car-model': 'model'");
  source = replaceRegexOnce(
    source,
    /const queryEntityProducts = async \(entity: SeoEntity, limit = 48\): Promise<any\[]> => \{[\s\S]*?\n\};/,
    `const queryEntityProducts = async (entity: SeoEntity, limit = 48): Promise<any[]> => {\n  if (entity.type === 'part_brand') {\n    const rows = await queryRows<ProductRow[]>(\n      \`SELECT p.id, p.stock, p.reserved_stock, p.data_json FROM product_part_brands ppb JOIN products p ON p.id = ppb.product_id WHERE ppb.part_brand_id = ? AND p.status = 'active' ORDER BY ppb.is_primary DESC, p.updated_at DESC LIMIT ?\`,\n      [entity.id, limit]\n    );\n    return rows.map(productDto);\n  }\n  const jsonPath = entity.type === 'brand' ? '$.vehicleBrandIds' : '$.vehicleModelIds';\n  const rows = await queryRows<ProductRow[]>(\n    \`SELECT id, stock, reserved_stock, data_json FROM products\n     WHERE status = 'active'\n       AND JSON_CONTAINS(COALESCE(JSON_EXTRACT(data_json, '\${jsonPath}'), JSON_ARRAY()), JSON_QUOTE(?)) = 1\n     ORDER BY updated_at DESC LIMIT ?\`,\n    [entity.id, limit]\n  );\n  return rows.map(productDto);\n};`,
    "entity.type === 'part_brand'",
    'SSR part-brand product query'
  );
  if (!source.includes("SELECT id, data_json FROM part_brands WHERE is_active = 1")) source = source.replace(
    "    queryRows<JsonRow[]>('SELECT id, data_json FROM vehicle_models WHERE is_active = 1 ORDER BY name_fa ASC'),",
    "    queryRows<JsonRow[]>('SELECT id, data_json FROM vehicle_models WHERE is_active = 1 ORDER BY name_fa ASC'),\n    queryRows<JsonRow[]>('SELECT id, data_json FROM part_brands WHERE is_active = 1 ORDER BY name_fa ASC'),"
  );
  source = source.replace("entity?.type === 'brand' || entity?.type === 'model'", "entity?.type === 'brand' || entity?.type === 'model' || entity?.type === 'part_brand'");
  source = source.replace('const [categoryRows, brandRows, modelRows, articleCategoryRows, pageRows, settingRows] = common;', 'const [categoryRows, brandRows, modelRows, partBrandRows, articleCategoryRows, pageRows, settingRows] = common;');
  if (!source.includes('const partBrands = partBrandRows.map')) source = source.replace('  const models = modelRows.map(row => ({ ...parseJson<any>(row.data_json, {}), id: row.id }));', '  const models = modelRows.map(row => ({ ...parseJson<any>(row.data_json, {}), id: row.id }));\n  const partBrands = partBrandRows.map(row => ({ ...parseJson<any>(row.data_json, {}), id: row.id }));');
  source = source.replace('    vehicles: { brands, models },', '    vehicles: { brands, models },\n    partBrands: { partBrands },');
  return source;
});

edit('src/server/storefront-normal.ts', source => {
  if (!source.includes('partBrands?: AnyRecord;')) source = source.replace('    vehicles?: AnyRecord;', '    vehicles?: AnyRecord;\n    partBrands?: AnyRecord;');
  return source;
});

edit('src/server/seo/platform.ts', source => {
  source = source.replace("export type SeoEntityType = 'product' | 'article' | 'category' | 'page' | 'brand' | 'model';", "export type SeoEntityType = 'product' | 'article' | 'category' | 'page' | 'brand' | 'model' | 'part_brand';");
  source = source.replace("['product', 'article', 'category', 'page', 'brand', 'model']", "['product', 'article', 'category', 'page', 'brand', 'model', 'part_brand']");
  source = source.replace("  if (type === 'brand') return '/brand/' + encodeURIComponent(slug);", "  if (type === 'brand') return '/brand/' + encodeURIComponent(slug);\n  if (type === 'part_brand') return '/part-brand/' + encodeURIComponent(slug);");
  source = source.replace("  } else if (type === 'brand') {", "  } else if (type === 'brand' || type === 'part_brand') {");
  source = source.replace("  else if (type === 'brand') sql = 'SELECT id, slug, name_fa, data_json, updated_at FROM vehicle_brands WHERE is_active = 1 AND (id = ? OR slug = ?) LIMIT 1';", "  else if (type === 'brand') sql = 'SELECT id, slug, name_fa, data_json, updated_at FROM vehicle_brands WHERE is_active = 1 AND (id = ? OR slug = ?) LIMIT 1';\n  else if (type === 'part_brand') sql = 'SELECT id, slug, name_fa, data_json, updated_at FROM part_brands WHERE is_active = 1 AND (id = ? OR slug = ?) LIMIT 1';");
  source = source.replace("if (type === 'category' || type === 'brand' || type === 'model')", "if (type === 'category' || type === 'brand' || type === 'model' || type === 'part_brand')");
  return source;
});

edit('src/server/seo.ts', source => {
  source = source.replace('/(product|article|category|page|brand|car-model)', '/(product|article|category|page|brand|part-brand|car-model)');
  source = source.replace("      brand: 'brand',\n      'car-model': 'model'", "      brand: 'brand',\n      'part-brand': 'part_brand',\n      'car-model': 'model'");
  source = source.replace(/\['category','brand','model'\]/g, "['category','brand','model','part_brand']");
  source = source.replace("type SitemapType = 'products' | 'articles' | 'categories' | 'pages' | 'brands' | 'models';", "type SitemapType = 'products' | 'articles' | 'categories' | 'pages' | 'brands' | 'part-brands' | 'models';");
  if (!source.includes("'part-brands': { entityType: 'part_brand'")) source = source.replace("  brands: { entityType: 'brand', table: 'vehicle_brands', where: 'p.is_active = 1', prefix: '/brand/' },", "  brands: { entityType: 'brand', table: 'vehicle_brands', where: 'p.is_active = 1', prefix: '/brand/' },\n  'part-brands': { entityType: 'part_brand', table: 'part_brands', where: 'p.is_active = 1', prefix: '/part-brand/' },");
  source = source.replace("['category','brand','model'].includes(entity.type)", "['category','brand','model','part_brand'].includes(entity.type)");
  return source;
});

// ---------------------------------------------------------------------------
// HTTP routes: part brands, rich-media upload and part-brand sitemap chunks.
// ---------------------------------------------------------------------------
edit('server.ts', source => {
  if (!source.includes("import { partBrandsRouter }")) source = source.replace("import { vehiclesRouter } from './src/server/routes/vehicles';", "import { vehiclesRouter } from './src/server/routes/vehicles';\nimport { partBrandsRouter } from './src/server/routes/part-brands';\nimport { richMediaRouter } from './src/server/routes/rich-media';");
  source = source.replace('(products|articles|categories|pages|brands|models)', '(products|articles|categories|pages|brands|part-brands|models)');
  if (!source.includes("app.use('/api/part-brands'")) source = source.replace("app.use('/api/vehicles', vehiclesRouter);", "app.use('/api/vehicles', vehiclesRouter);\napp.use('/api/part-brands', partBrandsRouter);\napp.use('/api/rich-media', richMediaRouter);");
  return source;
});

const requiredMarkers = [
  ['src/types/index.ts', 'export interface PartBrand {'],
  ['src/context/StoreContext.tsx', 'const [partBrands, setPartBrands]'],
  ['src/components/admin/ProductClassificationFields.tsx', 'برندهای سازنده قطعه'],
  ['src/components/admin/AdminView.tsx', "id: 'part_brands'"],
  ['src/App.tsx', '<PartBrandDetailView'],
  ['src/server/public-storefront-react.tsx', '<PartBrandDetailView'],
  ['src/server/storefront-html.ts', "entity.type === 'part_brand'"],
  ['src/server/seo/platform.ts', "type === 'part_brand'"],
  ['src/server/seo.ts', "'part-brands': { entityType: 'part_brand'"],
  ['src/components/common/RichTextComposer.tsx', "name: 'richEmbed'"],
  ['src/utils/richText.ts', 'export const safeRichEmbedSrc'],
  ['server.ts', "app.use('/api/rich-media', richMediaRouter)"]
];
for (const [path, marker] of requiredMarkers) {
  if (!fs.readFileSync(path, 'utf8').includes(marker)) throw new Error(`v30.6.0 marker missing after patch: ${path} :: ${marker}`);
}

console.log('v30.6.0 source patch complete:', changed.length ? changed.join(', ') : 'already applied');
