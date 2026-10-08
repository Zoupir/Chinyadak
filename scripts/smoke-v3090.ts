import assert from 'node:assert/strict';
import fs from 'node:fs';
import { normalizeIranMobile, isValidIranMobile } from '../src/utils/phone';
import { normalizePartRequestFormConfig } from '../src/config/partRequestForm';

const base = String(process.env.TEST_BASE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');

const request = async (path: string, options: RequestInit = {}, expected = 200): Promise<Response> => {
  const response = await fetch(base + path, options);
  if (response.status !== expected) {
    const body = await response.text().catch(() => '');
    throw new Error(`${options.method || 'GET'} ${path}: expected ${expected}, got ${response.status}: ${body}`);
  }
  return response;
};

const json = async <T>(path: string, options: RequestInit = {}, expected = 200) => {
  const response = await request(path, {
    ...options,
    headers: { 'content-type': 'application/json', ...(options.headers || {}) }
  }, expected);
  return { response, data: await response.json() as T };
};

const cookieFrom = (response: Response) => String(response.headers.get('set-cookie') || '').split(';')[0].trim();

const run = async () => {
  assert.equal(normalizeIranMobile('۰۹۱۲ ۱۲۳ ۴۵۶۷'), '09121234567');
  assert.equal(normalizeIranMobile('+98 912-123-4567'), '09121234567');
  assert.equal(normalizeIranMobile('0098-912-123-4567'), '09121234567');
  assert.equal(isValidIranMobile('٠٩١٢١٢٣٤٥٦٧'), true, 'Arabic-Indic mobile digits should validate.');

  const defaultConfig = normalizePartRequestFormConfig(undefined);
  assert(defaultConfig.fields.some(field => field.key === 'phoneNumber' && field.required && field.visible));
  assert(defaultConfig.fields.some(field => field.key === 'image'));

  const suffix = String(Date.now()).slice(-7);
  const persianPhone = '۰۹۱۲' + suffix.replace(/[0-9]/g, digit => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)]);
  const submitted = await json<{ request: any }>('/api/engagement/part-requests', {
    method: 'POST',
    body: JSON.stringify({
      carBrand: '',
      carModel: '',
      year: '',
      partName: `استعلام فرم حرفه‌ای ${suffix}`,
      phoneNumber: persianPhone,
      fullName: 'کاربر تست فرم حرفه‌ای',
      notes: 'Persian digit and optional vehicle regression'
    })
  }, 201);
  assert(submitted.data.request.id, 'Professional request insert returned no id.');
  assert.equal(submitted.data.request.phoneNumber, normalizeIranMobile(persianPhone));
  assert.equal(submitted.data.request.status, 'جدید');

  const invalid = await json<{ error: string }>('/api/engagement/part-requests', {
    method: 'POST',
    body: JSON.stringify({ partName: 'تست', fullName: 'تست', phoneNumber: '۱۲۳۴' })
  }, 400);
  assert.equal(invalid.data.error, 'PART_REQUEST_PHONE_INVALID');

  const adminPassword = process.env.ADMIN_BOOTSTRAP_PASSWORD || '';
  assert(adminPassword.length >= 10, 'ADMIN_BOOTSTRAP_PASSWORD is required.');
  const login = await json<{ admin: any }>('/api/auth/admin/login', {
    method: 'POST',
    body: JSON.stringify({ username: process.env.ADMIN_BOOTSTRAP_USER || 'admin', password: adminPassword })
  });
  const adminCookie = cookieFrom(login.response);
  assert(adminCookie, 'Admin cookie missing.');

  const adminData = await json<{ partRequests: any[] }>('/api/engagement/admin', {
    headers: { Cookie: adminCookie }
  });
  assert(adminData.data.partRequests.some(item => item.id === submitted.data.request.id), 'Submitted request is missing in admin center.');

  const updated = await json<{ request: any }>(`/api/engagement/part-requests/${encodeURIComponent(submitted.data.request.id)}`, {
    method: 'PATCH',
    headers: { Cookie: adminCookie },
    body: JSON.stringify({
      status: 'قیمت اعلام شد',
      quotedPrice: 12500000,
      currency: 'تومان',
      estimatedDelivery: '۷ تا ۱۰ روز کاری',
      responseText: 'موجود و قابل تامین است.',
      adminNote: 'یادداشت داخلی تست CI'
    })
  });
  assert.equal(updated.data.request.status, 'قیمت اعلام شد');
  assert.equal(updated.data.request.quotedPrice, 12500000);
  assert.equal(updated.data.request.responseText, 'موجود و قابل تامین است.');
  assert.equal(updated.data.request.adminNote, 'یادداشت داخلی تست CI');
  assert(updated.data.request.updatedAt, 'Updated request did not receive an update timestamp.');

  const cms = await json<{ pages: any[] }>('/api/cms/bundle');
  const requestPage = cms.data.pages.find(page => page.slug === 'part-request');
  assert(requestPage, 'System part-request page is missing from CMS bundle.');
  const requestSection = requestPage.sections.find((section: any) => section.sectionKey === 'request-form');
  assert(requestSection, 'System request-form section is missing.');

  const customizedConfig = normalizePartRequestFormConfig(requestSection);
  customizedConfig.submitText = `ثبت تست ${suffix}`;
  customizedConfig.contactPhone = '۰۹۱۲۱۲۳۴۵۶۷';
  customizedConfig.fields = customizedConfig.fields.map(field => field.key === 'oemNumber'
    ? { ...field, label: 'کد فنی سفارشی', visible: false }
    : field);

  const savedPage = {
    ...requestPage,
    sections: requestPage.sections.map((section: any) => section.id === requestSection.id
      ? { ...section, formConfig: customizedConfig }
      : section)
  };
  await json(`/api/cms/pages/${encodeURIComponent(requestPage.id)}`, {
    method: 'PUT',
    headers: { Cookie: adminCookie },
    body: JSON.stringify(savedPage)
  });

  const cmsAfter = await json<{ pages: any[] }>('/api/cms/bundle');
  const persisted = cmsAfter.data.pages.find(page => page.id === requestPage.id)
    ?.sections?.find((section: any) => section.id === requestSection.id)?.formConfig;
  assert.equal(persisted?.submitText, `ثبت تست ${suffix}`, 'Form builder submit text was not persisted.');
  assert.equal(persisted?.contactPhone, '۰۹۱۲۱۲۳۴۵۶۷', 'Dedicated contact phone was not persisted.');
  assert.equal(persisted?.fields?.find((field: any) => field.key === 'oemNumber')?.visible, false, 'Field visibility was not persisted.');

  const source = fs.readFileSync('src/components/parts/PartRequestView.tsx', 'utf8');
  assert(source.includes('PartRequestViewProfessional'), 'Professional request form was not selected by source preparation.');
  const pagesSource = fs.readFileSync('src/components/admin/AdminPagesTab.tsx', 'utf8');
  assert(pagesSource.includes('AdminRequestPageSettings'), 'Request form builder was not attached to AdminPagesTab.');

  console.log('v30.9.0 professional form/page builder smoke passed.');
};

run().catch(error => {
  console.error(error);
  process.exit(1);
});
