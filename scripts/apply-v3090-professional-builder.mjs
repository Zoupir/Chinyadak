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

const replaceSection = (source, startMarker, endMarker, replacement, label) => {
  const start = source.indexOf(startMarker);
  if (start < 0) throw new Error(`v30.9.0 missing start marker: ${label}`);
  const end = source.indexOf(endMarker, start + startMarker.length);
  if (end < 0) throw new Error(`v30.9.0 missing end marker: ${label}`);
  return source.slice(0, start) + replacement + source.slice(end);
};

// ---------------------------------------------------------------------------
// Typed form-builder contract and richer part-request lifecycle.
// ---------------------------------------------------------------------------
edit('src/types/index.ts', source => {
  const requestStart = source.indexOf('export interface PartRequest {');
  const requestEndMarker = '\n}\n\nexport interface ActiveVehicleFilter';
  const requestEnd = source.indexOf(requestEndMarker, requestStart);
  if (requestStart < 0 || requestEnd < 0) throw new Error('v30.9.0 PartRequest interface markers missing');

  const requestInterface = `export interface PartRequest {\n  id: string;\n  carBrand: string;\n  carModel: string;\n  year: string;\n  partName: string;\n  oemNumber?: string;\n  vin?: string;\n  phoneNumber: string;\n  fullName: string;\n  notes: string;\n  imageAttached?: boolean;\n  imageUrl?: string;\n  imageName?: string;\n  createdAt: string;\n  updatedAt?: string;\n  status:\n    | 'جدید'\n    | 'در حال بررسی'\n    | 'قیمت اعلام شد'\n    | 'منتظر پاسخ مشتری'\n    | 'پاسخ داده شد'\n    | 'تبدیل به سفارش'\n    | 'بسته شد'\n    | 'ناموجود'\n    | 'ناموجود در گمرک';\n  quotedPrice?: number;\n  currency?: string;\n  estimatedDelivery?: string;\n  responseText?: string;\n  adminNote?: string;\n}`;

  source = source.slice(0, requestStart) + requestInterface + source.slice(requestEnd + 2);

  if (!source.includes('export type PartRequestFieldKey =')) {
    const pageSectionMarker = 'export interface PageSection {';
    const at = source.indexOf(pageSectionMarker);
    if (at < 0) throw new Error('v30.9.0 PageSection marker missing');
    const formTypes = `export type PartRequestFieldKey =\n  | 'carBrand'\n  | 'carModel'\n  | 'year'\n  | 'partName'\n  | 'oemNumber'\n  | 'vin'\n  | 'image'\n  | 'fullName'\n  | 'phoneNumber'\n  | 'notes';\n\nexport interface PageFormFieldConfig {\n  key: PartRequestFieldKey;\n  type: 'text' | 'tel' | 'textarea' | 'select' | 'file';\n  label: string;\n  placeholder?: string;\n  helpText?: string;\n  visible: boolean;\n  required: boolean;\n  width: 'full' | 'half' | 'third';\n  order: number;\n}\n\nexport interface PageFormConfig {\n  schema: 'part-request' | 'custom';\n  fields: PageFormFieldConfig[];\n  submitText?: string;\n  submittingText?: string;\n  successTitle?: string;\n  successMessage?: string;\n  errorMessage?: string;\n  contactPhone?: string;\n  maxImageMb?: number;\n  allowImages?: boolean;\n}\n\n`;
    source = source.slice(0, at) + formTypes + source.slice(at);
  }

  if (!source.includes('  formConfig?: PageFormConfig;')) {
    const needle = '  buttonLink?: string;\n';
    const at = source.indexOf(needle, source.indexOf('export interface PageSection {'));
    if (at < 0) throw new Error('v30.9.0 PageSection buttonLink marker missing');
    source = source.slice(0, at + needle.length) + '  /** Schema-backed controls for system/custom form sections. */\n  formConfig?: PageFormConfig;\n' + source.slice(at + needle.length);
  }
  return source;
});

// ---------------------------------------------------------------------------
// Server validation: Persian digits, useful error codes, richer admin workflow.
// ---------------------------------------------------------------------------
edit('src/server/routes/engagement.ts', source => {
  if (!source.includes("from '../../utils/phone'")) {
    const importMarker = "import { pool, type ResultSetHeader, type RowDataPacket } from '../db';\n";
    if (!source.includes(importMarker)) throw new Error('v30.9.0 engagement import marker missing');
    source = source.replace(importMarker, importMarker + "import { normalizeIranMobile } from '../../utils/phone';\n");
  }

  source = source.replace(
    /const normalizePhone = \(input: unknown\): string => \{[\s\S]*?\n\};/,
    `const normalizePhone = (input: unknown): string => normalizeIranMobile(String(input ?? ''));`
  );

  // More practical limits for a public form while the global API limiter remains active.
  source = source.replace(
    /(const publicSubmitLimiter = rateLimit\(\{[\s\S]*?\n\s*limit:)\s*12,/,
    '$1 30,'
  );
  source = source.replace(
    /(const requestImageLimiter = rateLimit\(\{[\s\S]*?\n\s*limit:)\s*12,/,
    '$1 30,'
  );
  source = source.replace('Math.min(maxUploadBytes(), 5 * 1024 * 1024)', 'Math.min(maxUploadBytes(), 10 * 1024 * 1024)');

  const oldValidation = `  if (!/^09\\d{9}$/.test(phoneNumber) || !fullName || !partName || !carBrand || !carModel) {\n    res.status(400).json({ error: 'PART_REQUEST_INVALID' });\n    return;\n  }`;
  const newValidation = `  if (!/^09\\d{9}$/.test(phoneNumber)) {\n    res.status(400).json({ error: 'PART_REQUEST_PHONE_INVALID' });\n    return;\n  }\n  if (!fullName) {\n    res.status(400).json({ error: 'PART_REQUEST_NAME_REQUIRED' });\n    return;\n  }\n  if (!partName) {\n    res.status(400).json({ error: 'PART_REQUEST_PART_REQUIRED' });\n    return;\n  }`;
  if (source.includes(oldValidation)) source = source.replace(oldValidation, newValidation);
  else if (!source.includes('PART_REQUEST_PHONE_INVALID')) throw new Error('v30.9.0 public request validation target missing');

  // New submissions start as new, not silently mixed with already-reviewed requests.
  source = source.replace("    status: 'در حال بررسی'\n  };", "    status: 'جدید'\n  };");
  source = source.replace("VALUES (?, 'در حال بررسی', ?)", "VALUES (?, 'جدید', ?)");

  if (!source.includes('const PART_REQUEST_STATUSES = [')) {
    const marker = 'export const engagementRouter = Router();';
    const statuses = `const PART_REQUEST_STATUSES = [\n  'جدید',\n  'در حال بررسی',\n  'قیمت اعلام شد',\n  'منتظر پاسخ مشتری',\n  'پاسخ داده شد',\n  'تبدیل به سفارش',\n  'بسته شد',\n  'ناموجود',\n  'ناموجود در گمرک'\n] as const;\n\n`;
    if (!source.includes(marker)) throw new Error('v30.9.0 engagement router marker missing');
    source = source.replace(marker, statuses + marker);
  }

  if (!source.includes("engagementRouter.patch(\n  '/part-requests/:id',")) {
    const statusRouteMarker = `engagementRouter.patch(\n  '/part-requests/:id/status',`;
    if (!source.includes(statusRouteMarker)) throw new Error('v30.9.0 part request status route marker missing');
    const route = `engagementRouter.patch(\n  '/part-requests/:id',\n  requireAdminPermission('canManageOrders'),\n  async (req, res) => {\n    const [rows] = await pool.query<JsonRow[]>(\n      'SELECT id, status, data_json, created_at FROM part_requests WHERE id = ? LIMIT 1',\n      [req.params.id]\n    );\n    const current = rows[0];\n    if (!current) {\n      res.status(404).json({ error: 'PART_REQUEST_NOT_FOUND' });\n      return;\n    }\n\n    const currentData = parseJson<any>(current.data_json, {});\n    const requestedStatus = req.body?.status !== undefined ? String(req.body.status) : String(current.status || currentData.status || 'در حال بررسی');\n    if (!PART_REQUEST_STATUSES.includes(requestedStatus as any)) {\n      res.status(400).json({ error: 'PART_REQUEST_STATUS_INVALID' });\n      return;\n    }\n\n    let quotedPrice = currentData.quotedPrice;\n    if (Object.prototype.hasOwnProperty.call(req.body || {}, 'quotedPrice')) {\n      const rawPrice = req.body?.quotedPrice;\n      if (rawPrice === '' || rawPrice == null) quotedPrice = undefined;\n      else {\n        const parsed = Number(rawPrice);\n        if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1_000_000_000_000) {\n          res.status(400).json({ error: 'PART_REQUEST_PRICE_INVALID' });\n          return;\n        }\n        quotedPrice = Math.round(parsed);\n      }\n    }\n\n    const updatedAt = new Intl.DateTimeFormat('fa-IR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date());\n    const data = {\n      ...currentData,\n      status: requestedStatus,\n      quotedPrice,\n      currency: String(req.body?.currency ?? currentData.currency ?? 'تومان').trim().slice(0, 40),\n      estimatedDelivery: String(req.body?.estimatedDelivery ?? currentData.estimatedDelivery ?? '').trim().slice(0, 300),\n      responseText: String(req.body?.responseText ?? currentData.responseText ?? '').trim().slice(0, 4000),\n      adminNote: String(req.body?.adminNote ?? currentData.adminNote ?? '').trim().slice(0, 4000),\n      updatedAt\n    };\n\n    await pool.execute(\n      'UPDATE part_requests SET status = ?, data_json = ?, updated_at = NOW() WHERE id = ?',\n      [requestedStatus, JSON.stringify(data), req.params.id]\n    );\n\n    res.json({ request: { ...partRequestDto(current), ...data, status: requestedStatus } });\n  }\n);\n\n`;
    source = source.replace(statusRouteMarker, route + statusRouteMarker);
  }

  source = source.replace(
    "    const allowed = ['در حال بررسی', 'پاسخ داده شد', 'ناموجود در گمرک'];",
    '    const allowed = PART_REQUEST_STATUSES;'
  );
  source = source.replace(
    '    if (!allowed.includes(status)) {',
    '    if (!allowed.includes(status as any)) {'
  );
  return source;
});

// ---------------------------------------------------------------------------
// Store API: reliable Promise-based page saves + detailed form submit result.
// ---------------------------------------------------------------------------
edit('src/context/StoreContext.tsx', source => {
  const partTypeStart = '  // Part Requests\n';
  const partTypeEnd = '  // Stock Alert (Notify Me)\n';
  const typeBlock = `  // Part Requests\n  partRequests: PartRequest[];\n  submitPartRequest: (req: Omit<PartRequest, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'quotedPrice' | 'currency' | 'estimatedDelivery' | 'responseText' | 'adminNote'>) => Promise<{ ok: boolean; request?: PartRequest; errorCode?: string }>;\n  refreshAdminEngagement: () => Promise<boolean>;\n  updatePartRequest: (id: string, patch: Partial<Pick<PartRequest, 'status' | 'quotedPrice' | 'currency' | 'estimatedDelivery' | 'responseText' | 'adminNote'>>) => Promise<boolean>;\n  updatePartRequestStatus: (id: string, status: PartRequest['status']) => Promise<boolean>;\n  \n`;
  source = replaceSection(source, partTypeStart, partTypeEnd, typeBlock, 'StoreContext part-request contract');

  source = source.replace(
    '  updatePage: (page: SitePage) => void;',
    '  updatePage: (page: SitePage) => Promise<boolean>;'
  );
  source = source.replace(
    '  addSection: (pageSlug: string, section: PageSection) => void;',
    '  addSection: (pageSlug: string, section: PageSection) => Promise<boolean>;'
  );
  source = source.replace(
    '  deleteSection: (pageSlug: string, sectionId: string) => void;',
    '  deleteSection: (pageSlug: string, sectionId: string) => Promise<boolean>;'
  );

  source = source.replace(
    /  const updatePage = \(updatedPage: SitePage\) => \{\n\s*persistPage\(updatedPage, `برگه "\$\{updatedPage\.title\}" با موفقیت ذخیره شد\.`\);\n\s*\};/,
    `  const updatePage = (updatedPage: SitePage): Promise<boolean> =>\n    persistPage(updatedPage, \`برگه "\${updatedPage.title}" با موفقیت ذخیره شد.\`);`
  );

  const addSectionPattern = /  const addSection = \(pageSlug: string, newSection: PageSection\) => \{[\s\S]*?\n  \};\n\n  const deleteSection = \(pageSlug: string, sectionId: string\) => \{[\s\S]*?\n  \};/;
  const addDeleteReplacement = `  const addSection = async (pageSlug: string, newSection: PageSection): Promise<boolean> => {\n    const page = pages.find(item => item.slug === pageSlug);\n    if (!page) {\n      showToast('برگه برای افزودن سکشن پیدا نشد.', 'error');\n      return false;\n    }\n    return persistPage({ ...page, sections: [...page.sections, newSection] }, 'بخش جدید با موفقیت اضافه شد.');\n  };\n\n  const deleteSection = async (pageSlug: string, sectionId: string): Promise<boolean> => {\n    const page = pages.find(item => item.slug === pageSlug);\n    if (!page) {\n      showToast('برگه برای حذف سکشن پیدا نشد.', 'error');\n      return false;\n    }\n    return persistPage({\n      ...page,\n      sections: page.sections.filter(section => section.id !== sectionId)\n    }, 'بخش با موفقیت حذف شد.');\n  };`;
  if (addSectionPattern.test(source)) source = source.replace(addSectionPattern, addDeleteReplacement);
  else if (!source.includes('const addSection = async')) throw new Error('v30.9.0 add/delete section target missing');

  const implStart = '  // Part Requests\n';
  const implEnd = '  // Stock Alerts\n';
  const implementation = `  // Part Requests\n  const submitPartRequest = async (req: Omit<PartRequest, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'quotedPrice' | 'currency' | 'estimatedDelivery' | 'responseText' | 'adminNote'>): Promise<{ ok: boolean; request?: PartRequest; errorCode?: string }> => {\n    try {\n      const { request } = await apiRequest<{ request: PartRequest }>('/api/engagement/part-requests', {\n        method: 'POST',\n        body: JSON.stringify(req)\n      });\n      setPartRequests(prev => [request, ...prev.filter(item => item.id !== request.id)]);\n      showToast('درخواست استعلام قطعه با موفقیت در سرور ثبت شد.');\n      return { ok: true, request };\n    } catch (error) {\n      console.error('Part request submit failed:', error);\n      return {\n        ok: false,\n        errorCode: error instanceof ApiError ? error.code : 'REQUEST_FAILED'\n      };\n    }\n  };\n\n  const updatePartRequest = async (\n    id: string,\n    patch: Partial<Pick<PartRequest, 'status' | 'quotedPrice' | 'currency' | 'estimatedDelivery' | 'responseText' | 'adminNote'>>\n  ): Promise<boolean> => {\n    try {\n      const { request } = await apiRequest<{ request: PartRequest }>(\`/api/engagement/part-requests/\${encodeURIComponent(id)}\`, {\n        method: 'PATCH',\n        body: JSON.stringify(patch)\n      });\n      setPartRequests(prev => prev.map(item => item.id === request.id ? request : item));\n      return true;\n    } catch (error) {\n      console.error('Part request update failed:', error);\n      showToast('ذخیره پاسخ استعلام روی سرور انجام نشد.', 'error');\n      return false;\n    }\n  };\n\n  const updatePartRequestStatus = (id: string, status: PartRequest['status']): Promise<boolean> =>\n    updatePartRequest(id, { status });\n\n`;
  // Use the second occurrence of the Part Requests comment (implementation area).
  const first = source.indexOf(implStart);
  const second = source.indexOf(implStart, first + implStart.length);
  if (second < 0) throw new Error('v30.9.0 StoreContext implementation part-request marker missing');
  const end = source.indexOf(implEnd, second);
  if (end < 0) throw new Error('v30.9.0 StoreContext stock-alert marker missing');
  source = source.slice(0, second) + implementation + source.slice(end);

  if (!source.includes('      updatePartRequest,\n      updatePartRequestStatus,')) {
    source = source.replace(
      '      refreshAdminEngagement,\n      updatePartRequestStatus,',
      '      refreshAdminEngagement,\n      updatePartRequest,\n      updatePartRequestStatus,'
    );
  }
  return source;
});

// ---------------------------------------------------------------------------
// Replace the brittle legacy form implementation with the schema-backed one.
// ---------------------------------------------------------------------------
edit('src/components/parts/PartRequestView.tsx', _source =>
  `export { PartRequestView } from './PartRequestViewProfessional';\n`
);

// ---------------------------------------------------------------------------
// Page Builder: dedicated system-form controls and save only after persistence.
// ---------------------------------------------------------------------------
edit('src/components/admin/AdminPagesTab.tsx', source => {
  if (!source.includes("import { AdminRequestPageSettings } from './AdminRequestPageSettings';")) {
    source = source.replace(
      "import { AdminEntitySeoPanel } from './AdminEntitySeoPanel';\n",
      "import { AdminEntitySeoPanel } from './AdminEntitySeoPanel';\nimport { AdminRequestPageSettings } from './AdminRequestPageSettings';\n"
    );
  }

  const oldSave = `  const handleSaveSection = (e: React.FormEvent) => {\n    e.preventDefault();\n    if (!sectionForm.title) {\n      showToast('عنوان سکشن الزامی است.', 'error');\n      return;\n    }\n\n    if (editingSection) {\n      updateSection(selectedPage.slug, sectionForm);\n    } else {\n      addSection(selectedPage.slug, sectionForm);\n    }\n    setIsSectionModalOpen(false);\n  };`;
  const newSave = `  const handleSaveSection = async (e: React.FormEvent) => {\n    e.preventDefault();\n    const saved = editingSection\n      ? await updateSection(selectedPage.slug, sectionForm)\n      : await addSection(selectedPage.slug, sectionForm);\n    if (saved) setIsSectionModalOpen(false);\n  };`;
  if (source.includes(oldSave)) source = source.replace(oldSave, newSave);
  else if (!source.includes('const handleSaveSection = async')) throw new Error('v30.9.0 AdminPagesTab save handler marker missing');

  if (!source.includes('<AdminRequestPageSettings page={selectedPage} />')) {
    const marker = `          <div className="space-y-3">\n            <AdminEntitySeoPanel`;
    const insert = `          {selectedPage.slug === 'part-request' && (\n            <AdminRequestPageSettings page={selectedPage} />\n          )}\n\n          <div className="space-y-3">\n            <AdminEntitySeoPanel`;
    if (!source.includes(marker)) throw new Error('v30.9.0 AdminPagesTab request settings insertion marker missing');
    source = source.replace(marker, insert);
  }

  // The system form itself may be intentionally untitled; don't force the HTML required attribute.
  source = source.replace(
    `                    required\n                  />`,
    `                    required={sectionForm.sectionKey !== 'request-form'}\n                  />`
  );

  // Protect the core request form from accidental deletion while keeping its content/design editable.
  const deleteNeedle = `                      if (confirm(\`آیا از حذف سکشن "\${section.title}" اطمینان دارید؟\`)) {\n                        deleteSection(selectedPage.slug, section.id);\n                      }`;
  const deleteReplacement = `                      if (selectedPage.slug === 'part-request' && section.sectionKey === 'request-form') {\n                        showToast('فرم اصلی استعلام یک سکشن سیستمی است و حذف نمی‌شود؛ می‌توانید ظاهر و فیلدهای آن را ویرایش کنید.', 'info');\n                        return;\n                      }\n                      if (confirm(\`آیا از حذف سکشن "\${section.title}" اطمینان دارید؟\`)) {\n                        void deleteSection(selectedPage.slug, section.id);\n                      }`;
  if (source.includes(deleteNeedle)) source = source.replace(deleteNeedle, deleteReplacement);
  return source;
});

const assertions = [
  ['src/types/index.ts', 'export interface PageFormConfig {'],
  ['src/types/index.ts', "| 'قیمت اعلام شد'"],
  ['src/server/routes/engagement.ts', 'PART_REQUEST_PHONE_INVALID'],
  ['src/server/routes/engagement.ts', "'/part-requests/:id',"],
  ['src/context/StoreContext.tsx', 'const updatePartRequest = async'],
  ['src/context/StoreContext.tsx', 'updatePage: (page: SitePage) => Promise<boolean>;'],
  ['src/components/parts/PartRequestView.tsx', 'PartRequestViewProfessional'],
  ['src/components/admin/AdminPagesTab.tsx', '<AdminRequestPageSettings page={selectedPage} />']
];
for (const [path, marker] of assertions) {
  if (!fs.readFileSync(path, 'utf8').includes(marker)) {
    throw new Error(`v30.9.0 assertion failed: ${path} :: ${marker}`);
  }
}

console.log('v30.9.0 professional page/form builder:', changed.length ? changed.join(', ') : 'already satisfied');
