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
const appendOnce = (source, marker, block) => source.includes(marker) ? source : source + block;

// ---------------------------------------------------------------------------
// Part request contract: real attachment metadata + explicit async submit.
// ---------------------------------------------------------------------------
edit('src/types/index.ts', source => {
  if (!source.includes('imageUrl?: string;')) {
    source = source.replace(
      '  imageAttached?: boolean;\n  createdAt: string;',
      '  imageAttached?: boolean;\n  imageUrl?: string;\n  imageName?: string;\n  createdAt: string;'
    );
  }
  return source;
});

edit('src/server/routes/engagement.ts', source => {
  if (!source.includes("engagementRouter.post('/part-request-image'")) {
    source = source.replace(
      "import { createHash, randomUUID } from 'crypto';\n",
      "import { createHash, randomUUID } from 'crypto';\nimport fs from 'node:fs/promises';\nimport path from 'node:path';\nimport multer from 'multer';\n"
    );
    source = source.replace(
      "import { pool, type ResultSetHeader, type RowDataPacket } from '../db';\n",
      "import { pool, type ResultSetHeader, type RowDataPacket } from '../db';\nimport { maxUploadBytes, uploadDirectory } from '../media';\nimport { decodeMultipartFilename, normalizeUploadedImageFilename, publicUploadUrl } from '../media-filenames';\n"
    );

    const imageSupport = `\ntype SupportedRequestImage = { extension: 'jpg' | 'png' | 'webp' | 'gif'; mime: string };\nconst detectRequestImageType = (buffer: Buffer): SupportedRequestImage | null => {\n  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return { extension: 'jpg', mime: 'image/jpeg' };\n  if (buffer.length >= 8 && buffer.subarray(0,8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]))) return { extension: 'png', mime: 'image/png' };\n  if (buffer.length >= 12 && buffer.subarray(0,4).toString('ascii') === 'RIFF' && buffer.subarray(8,12).toString('ascii') === 'WEBP') return { extension: 'webp', mime: 'image/webp' };\n  if (buffer.length >= 6 && ['GIF87a','GIF89a'].includes(buffer.subarray(0,6).toString('ascii'))) return { extension: 'gif', mime: 'image/gif' };\n  return null;\n};\n\nconst requestImageUpload = multer({\n  storage: multer.memoryStorage(),\n  limits: { fileSize: Math.min(maxUploadBytes(), 5 * 1024 * 1024), files: 1, fields: 4 }\n});\n\nconst requestImageLimiter = rateLimit({\n  windowMs: 60 * 60 * 1000,\n  limit: 12,\n  standardHeaders: 'draft-8',\n  legacyHeaders: false,\n  message: { error: 'REQUEST_IMAGE_RATE_LIMIT' }\n});\n`;
    const limiterMarker = "const publicSubmitLimiter = rateLimit({";
    if (!source.includes(limiterMarker)) throw new Error('v30.8.2 engagement limiter marker missing');
    source = source.replace(limiterMarker, imageSupport + '\n' + limiterMarker);

    const route = `\nengagementRouter.post('/part-request-image', requestImageLimiter, requestImageUpload.single('image'), async (req, res) => {\n  if (!req.file?.buffer?.length) { res.status(400).json({ error: 'IMAGE_FILE_REQUIRED' }); return; }\n  const detected = detectRequestImageType(req.file.buffer);\n  if (!detected) { res.status(415).json({ error: 'IMAGE_FORMAT_NOT_ALLOWED' }); return; }\n  const safeOriginal = normalizeUploadedImageFilename(req.file.originalname, detected.extension);\n  if (!safeOriginal) { res.status(400).json({ error: 'IMAGE_FILENAME_INVALID' }); return; }\n\n  const now = new Date();\n  const year = String(now.getUTCFullYear());\n  const month = String(now.getUTCMonth() + 1).padStart(2, '0');\n  const ext = path.extname(safeOriginal);\n  const stem = path.basename(safeOriginal, ext).slice(0, 160);\n  const storedName = \`${'${Date.now()}'}-${'${randomUUID().slice(0, 8)}'}-${'${stem}'}${'${ext}'}\`;\n  const relativeDir = path.posix.join('part-requests', year, month);\n  const relativePath = path.posix.join(relativeDir, storedName);\n  const targetDir = path.join(uploadDirectory(), 'part-requests', year, month);\n  await fs.mkdir(targetDir, { recursive: true });\n  await fs.writeFile(path.join(targetDir, storedName), req.file.buffer);\n\n  res.status(201).json({\n    url: publicUploadUrl(relativePath),\n    originalName: decodeMultipartFilename(req.file.originalname),\n    mime: detected.mime,\n    size: req.file.buffer.length\n  });\n});\n`;
    const postMarker = "engagementRouter.post('/part-requests', publicSubmitLimiter, async (req, res) => {";
    if (!source.includes(postMarker)) throw new Error('v30.8.2 part request route marker missing');
    source = source.replace(postMarker, route + '\n' + postMarker);

    source = source.replace(
      "  const imageAttached = Boolean(req.body?.imageAttached);\n",
      "  const imageUrlRaw = String(req.body?.imageUrl || '').trim();\n  const imageUrl = /^\\/uploads\\/part-requests\\//.test(imageUrlRaw) ? imageUrlRaw.slice(0, 1200) : '';\n  const imageName = String(req.body?.imageName || '').trim().slice(0, 300);\n  const imageAttached = Boolean(imageUrl);\n"
    );
    source = source.replace(
      "    imageAttached,\n    status: 'در حال بررسی'",
      "    imageAttached,\n    imageUrl: imageUrl || undefined,\n    imageName: imageName || undefined,\n    status: 'در حال بررسی'"
    );
  }
  return source;
});

// ---------------------------------------------------------------------------
// Store state: explicit refresh and no false-positive success state.
// ---------------------------------------------------------------------------
edit('src/context/StoreContext.tsx', source => {
  source = source.replace(
    "  submitPartRequest: (req: Omit<PartRequest, 'id' | 'createdAt' | 'status'>) => void;\n  updatePartRequestStatus:",
    "  submitPartRequest: (req: Omit<PartRequest, 'id' | 'createdAt' | 'status'>) => Promise<boolean>;\n  refreshAdminEngagement: () => Promise<boolean>;\n  updatePartRequestStatus:"
  );

  if (!source.includes('const refreshAdminEngagement = async (): Promise<boolean> =>')) {
    const marker = "  const [searchLogs, setSearchLogs] = useState<SearchQueryLog[]>([]);\n";
    const block = `${marker}\n  const refreshAdminEngagement = async (): Promise<boolean> => {\n    try {\n      const result = await apiRequest<{\n        partRequests: PartRequest[];\n        stockAlerts: { productId: string; phone: string; date: string }[];\n        searchLogs: SearchQueryLog[];\n      }>('/api/engagement/admin');\n      setPartRequests(result.partRequests);\n      setStockAlerts(result.stockAlerts);\n      setSearchLogs(result.searchLogs);\n      return true;\n    } catch (error) {\n      console.error('Engagement admin refresh failed:', error);\n      return false;\n    }\n  };\n`;
    if (!source.includes(marker)) throw new Error('v30.8.2 engagement state marker missing');
    source = source.replace(marker, block);
  }

  if (!source.includes('const submitPartRequest = async')) {
    const pattern = /  const submitPartRequest = \(req: Omit<PartRequest, 'id' \| 'createdAt' \| 'status'>\) => \{[\s\S]*?\n  \};\n\n  const updatePartRequestStatus/;
    const replacement = `  const submitPartRequest = async (req: Omit<PartRequest, 'id' | 'createdAt' | 'status'>): Promise<boolean> => {\n    try {\n      const { request } = await apiRequest<{ request: PartRequest }>('/api/engagement/part-requests', {\n        method: 'POST',\n        body: JSON.stringify(req)\n      });\n      setPartRequests(prev => [request, ...prev.filter(item => item.id !== request.id)]);\n      showToast('درخواست استعلام قطعه با موفقیت ثبت شد.');\n      return true;\n    } catch (error) {\n      console.error(error);\n      showToast('ثبت درخواست استعلام انجام نشد. اطلاعات فرم و اتصال را بررسی کنید.', 'error');\n      return false;\n    }\n  };\n\n  const updatePartRequestStatus`;
    const next = source.replace(pattern, replacement);
    if (next === source) throw new Error('v30.8.2 async part request submit target missing');
    source = next;
  }

  if (!source.includes('      refreshAdminEngagement,\n      updatePartRequestStatus,')) {
    source = source.replace(
      '      partRequests,\n      submitPartRequest,\n      updatePartRequestStatus,',
      '      partRequests,\n      submitPartRequest,\n      refreshAdminEngagement,\n      updatePartRequestStatus,'
    );
  }
  return source;
});

// ---------------------------------------------------------------------------
// Public form: real image upload and success only after confirmed DB insert.
// ---------------------------------------------------------------------------
edit('src/components/parts/PartRequestView.tsx', source => {
  source = source.replace(
    '  const { brands, models, submitPartRequest, selectedVehicle, pages, settings } = useStore();',
    '  const { brands, models, submitPartRequest, selectedVehicle, pages, settings, showToast } = useStore();'
  );

  if (!source.includes('const [imageUrl, setImageUrl]')) {
    source = source.replace(
      "  const [imageAttached, setImageAttached] = useState(false);\n  const [submitted, setSubmitted] = useState(false);",
      "  const [imageUrl, setImageUrl] = useState('');\n  const [imageName, setImageName] = useState('');\n  const [imageUploading, setImageUploading] = useState(false);\n  const [isSubmitting, setIsSubmitting] = useState(false);\n  const [submitted, setSubmitted] = useState(false);"
    );
  }

  const oldHandler = `  const handleSubmit = (e: React.FormEvent) => {\n    e.preventDefault();\n    submitPartRequest({\n      carBrand,\n      carModel,\n      year,\n      partName,\n      oemNumber,\n      vin,\n      phoneNumber,\n      fullName,\n      notes,\n      imageAttached\n    });\n    setSubmitted(true);\n  };`;
  if (source.includes(oldHandler)) {
    const newHandler = `  const handleImageChange = async (file?: File) => {\n    if (!file) return;\n    setImageUploading(true);\n    try {\n      const form = new FormData();\n      form.append('image', file);\n      const response = await fetch('/api/engagement/part-request-image', { method: 'POST', credentials: 'include', body: form });\n      const data = await response.json().catch(() => ({}));\n      if (!response.ok) throw new Error(data.error || 'REQUEST_IMAGE_UPLOAD_FAILED');\n      setImageUrl(String(data.url || ''));\n      setImageName(String(data.originalName || file.name));\n      showToast('تصویر واقعی قطعه با موفقیت بارگذاری شد.');\n    } catch (error) {\n      console.error(error);\n      setImageUrl('');\n      setImageName('');\n      showToast('آپلود تصویر انجام نشد. فرمت JPG/PNG/WEBP/GIF و حجم حداکثر ۵ مگابایت مجاز است.', 'error');\n    } finally {\n      setImageUploading(false);\n    }\n  };\n\n  const handleSubmit = async (e: React.FormEvent) => {\n    e.preventDefault();\n    if (imageUploading || isSubmitting) return;\n    setIsSubmitting(true);\n    const ok = await submitPartRequest({\n      carBrand,\n      carModel,\n      year,\n      partName,\n      oemNumber,\n      vin,\n      phoneNumber,\n      fullName,\n      notes,\n      imageAttached: Boolean(imageUrl),\n      imageUrl: imageUrl || undefined,\n      imageName: imageName || undefined\n    });\n    setIsSubmitting(false);\n    if (ok) setSubmitted(true);\n  };`;
    source = source.replace(oldHandler, newHandler);
  }

  const photoPattern = /\s*\{\/\* Photo Simulation \*\/\}[\s\S]*?<\/div>\n\s*<\/div>\n\n\s*<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">/;
  if (photoPattern.test(source)) {
    source = source.replace(photoPattern, `\n              <div data-real-part-request-upload="1">\n                <label className="block text-xs font-bold text-neutral-700 mb-1">تصویر قطعه، قطعه معیوب یا کارت خودرو (اختیاری):</label>\n                <label className={\`block border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-colors \${imageUrl ? 'border-emerald-500 bg-emerald-50/50' : 'border-neutral-300 hover:border-neutral-400 bg-neutral-50'}\`}>\n                  <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" disabled={imageUploading} onChange={event => void handleImageChange(event.target.files?.[0])} />\n                  <Upload className={\`w-6 h-6 mx-auto mb-1 \${imageUrl ? 'text-emerald-600' : 'text-neutral-400'}\`} />\n                  <span className="text-xs text-neutral-600 block">{imageUploading ? 'در حال آپلود تصویر...' : imageUrl ? \`✓ \${imageName || 'تصویر قطعه'} بارگذاری شد — برای تغییر، فایل دیگری انتخاب کنید\` : 'برای انتخاب و آپلود واقعی تصویر کلیک کنید'}</span>\n                </label>\n                {imageUrl && <button type="button" onClick={() => { setImageUrl(''); setImageName(''); }} className="mt-2 text-[10px] font-bold text-red-600">حذف تصویر از این درخواست</button>}\n              </div>\n\n              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">`);
  }

  if (!source.includes('disabled={imageUploading || isSubmitting}')) {
    source = source.replace(
      `              <button\n                type="submit"\n                className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 transition-all mt-4"\n              >`,
      `              <button\n                type="submit"\n                disabled={imageUploading || isSubmitting}\n                className="w-full py-3.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 transition-all mt-4"\n              >`
    );
    source = source.replace(
      '<span>ارسال درخواست استعلام به واحد تامین</span>',
      '<span>{isSubmitting ? \'در حال ثبت قطعی در سرور...\' : \'ارسال درخواست استعلام به واحد تامین\'}</span>'
    );
  }
  return source;
});

// ---------------------------------------------------------------------------
// Admin workspace + canonical URL synchronization for every admin tab.
// ---------------------------------------------------------------------------
edit('src/components/admin/AdminView.tsx', source => {
  if (!source.includes("AdminPartRequestsTab")) {
    source = source.replace(
      "import { AdminDashboardPro } from './AdminDashboardPro';",
      "import { AdminDashboardPro } from './AdminDashboardPro';\nimport { AdminPartRequestsTab } from './AdminPartRequestsTab';"
    );
  }

  source = source.replace("'home_layout' | 'orders' | 'customers'", "'home_layout' | 'orders' | 'requests' | 'customers'");
  source = source.replace(/'orders','customers'/g, "'orders','requests','customers'");
  source = source.replace(/'orders', 'customers'/g, "'orders', 'requests', 'customers'");
  source = source.replace(
    "      case 'orders':\n      case 'customers':",
    "      case 'orders':\n      case 'requests':\n      case 'customers':"
  );

  if (!source.includes("{ id: 'requests', label: 'استعلام قطعه'")) {
    source = source.replace(
      "        { id: 'orders', label: 'سفارش‌ها و صدور فاکتور', icon: FileCheck2, count: orders.length },",
      "        { id: 'orders', label: 'سفارش‌ها و صدور فاکتور', icon: FileCheck2, count: orders.length },\n        { id: 'requests', label: 'استعلام قطعه', icon: Wrench, count: partRequests.filter(request => request.status === 'در حال بررسی').length },"
    );
  }

  source = source.replace(
    "          {!['overview','analytics','sandbox'].includes(activeTab) && <AdminBulkActions section={activeTab} />}",
    "          {!['overview','analytics','sandbox','requests'].includes(activeTab) && <AdminBulkActions section={activeTab} />}"
  );

  const clickPattern = /onClick=\{\(\) => \{\n\s*setActiveTab\(item\.id as any\);[\s\S]*?setIsMobileSidebarOpen\(false\);\n\s*\}\}/;
  if (!source.includes("onNavigate?.('admin', item.id);")) {
    const next = source.replace(clickPattern, `onClick={() => {\n                        // legacy v30.8.1 marker retained for repeated source preparation: onNavigate?.('admin', 'products');\n                        if (item.id === 'products') setEditingProduct(null);\n                        setActiveTab(item.id as any);\n                        onNavigate?.('admin', item.id);\n                        setIsMobileSidebarOpen(false);\n                      }}`);
    if (next === source) throw new Error('v30.8.2 admin sidebar navigation target missing');
    source = next;
  }

  source = source.replace(
    '<AdminDashboardPro onNavigateTab={(tab) => setActiveTab(tab)} />',
    `<AdminDashboardPro onNavigateTab={(tab) => {\n              setActiveTab(tab);\n              onNavigate?.('admin', String(tab));\n            }} />`
  );

  if (!source.includes("activeTab === 'requests'")) {
    const marker = "          {activeTab === 'orders' && (";
    if (!source.includes(marker)) throw new Error('v30.8.2 orders tab marker missing');
    source = source.replace(marker, "          {activeTab === 'requests' && <AdminPartRequestsTab />}\n\n" + marker);
  }
  return source;
});

edit('src/components/admin/AdminDashboardPro.tsx', source => {
  source = source.replace("icon:Wrench, tab:'overview', tone:'red'", "icon:Wrench, tab:'requests', tone:'red'");
  source = source.replace("icon:Wrench,tab:'overview',danger:stats.unanswered>0", "icon:Wrench,tab:'requests',danger:stats.unanswered>0");
  if (!source.includes("onClick={()=>onNavigateTab('requests')} className=\"text-[9px] font-bold text-blue-600\">همه استعلام‌ها")) {
    source = source.replace(
      '<h3 className="font-black text-sm flex items-center gap-2"><Wrench className="w-4 h-4 text-amber-600"/>استعلام‌های اخیر</h3>',
      '<div className="flex items-center justify-between"><h3 className="font-black text-sm flex items-center gap-2"><Wrench className="w-4 h-4 text-amber-600"/>استعلام‌های اخیر</h3><button onClick={()=>onNavigateTab(\'requests\')} className="text-[9px] font-bold text-blue-600">همه استعلام‌ها</button></div>'
    );
  }
  return source;
});

// ---------------------------------------------------------------------------
// Rich text fidelity: authored alignment/color must win everywhere, not only footer.
// ---------------------------------------------------------------------------
edit('src/utils/richText.ts', source => {
  source = source.replace(
    "if (align) safe.push('text-align:' + align[1].toLowerCase());",
    "if (align) safe.push('text-align:' + align[1].toLowerCase() + '!important');"
  );
  return source;
});

edit('src/index.css', source => appendOnce(source, 'v30.8.2 — authored rich-text fidelity', `\n\n/* v30.8.2 — authored rich-text fidelity */\n.rich-text-content [style*="text-align:right"] { text-align: right !important; }\n.rich-text-content [style*="text-align:center"] { text-align: center !important; }\n.rich-text-content [style*="text-align:left"] { text-align: left !important; }\n.rich-text-content [style*="text-align:justify"] { text-align: justify !important; }\n.footer-copyright-rich { display: block !important; width: 100% !important; max-width: 100% !important; }\n.footer-copyright-rich > p { display: block !important; width: 100% !important; margin: 0 0 4px !important; }\n.footer-copyright-rich > p:last-child { margin-bottom: 0 !important; }\n.marketplace-ref-footer-copyright-text { display: block !important; width: 100% !important; min-width: 0 !important; }\n.marketplace-ref-footer-copyright-inner { align-items: flex-start !important; }\n`));

// Footer must use block rich text; inline mode intentionally destroys paragraph boundaries.
edit('src/components/layout/Footer.tsx', source => {
  if (source.includes('const renderCopyright = (text: string) => <RichTextContent content={text} inline')) {
    source = source.replace(
      /const renderCopyright = \(text: string\) => <RichTextContent content=\{text\} inline className="[^"]*" \/>;/,
      'const renderCopyright = (text: string) => <RichTextContent content={text} className="footer-copyright-rich" />;'
    );
  }
  return source;
});

console.log('v30.8.2 admin/request/rich-text fixes:', changed.length ? changed.join(', ') : 'already satisfied');
