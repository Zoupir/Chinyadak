import assert from 'node:assert/strict';
import { markdownToSafeHtml } from '../src/utils/richText';
import { buildRoutePath } from '../src/utils/navigation';

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
  const exactCopyright = '<p style="text-align:right">تمامی حقوق مادی و معنوی محفوظ است.</p><p style="text-align:right">طراحی سایت و سئو با <a href="https://takrank.ir" target="_blank" rel="nofollow noopener noreferrer"><span style="color:rgb(254, 162, 57)!important"><strong>تک </strong></span><span style="color:rgb(92, 146, 255)!important"><strong>رنک</strong></span></a></p>';
  const html = markdownToSafeHtml(exactCopyright);
  assert.equal((html.match(/<p\b/g) || []).length, 2, 'Copyright paragraphs were flattened.');
  assert.match(html, /text-align:right!important/i, 'Authored paragraph alignment did not receive priority.');
  assert.match(html, /rgb\(254, 162, 57\)!important/i, 'First authored color was lost.');
  assert.match(html, /rgb\(92, 146, 255\)!important/i, 'Second authored color was lost.');
  assert.equal(buildRoutePath('admin', 'overview'), '/admin/overview', 'Admin dashboard route is not canonical.');
  assert.equal(buildRoutePath('admin', 'requests'), '/admin/requests', 'Admin part-request route is not canonical.');

  const adminPassword = process.env.ADMIN_BOOTSTRAP_PASSWORD || '';
  assert(adminPassword.length >= 10, 'ADMIN_BOOTSTRAP_PASSWORD is required.');
  const login = await json<{ admin: any }>('/api/auth/admin/login', {
    method: 'POST',
    body: JSON.stringify({ username: process.env.ADMIN_BOOTSTRAP_USER || 'admin', password: adminPassword })
  });
  const adminCookie = cookieFrom(login.response);
  assert(adminCookie, 'Admin cookie missing.');

  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64');
  const uploadForm = new FormData();
  uploadForm.append('image', new Blob([Uint8Array.from(png)], { type: 'image/png' }), 'عکس استعلام تست ۱۴۰۵.png');
  const uploadResponse = await request('/api/engagement/part-request-image', { method: 'POST', body: uploadForm }, 201);
  const upload = await uploadResponse.json() as { url: string; originalName: string };
  assert(upload.url.startsWith('/uploads/part-requests/'), 'Part-request image was not stored in its isolated folder.');
  assert.equal(upload.originalName, 'عکس استعلام تست ۱۴۰۵.png', 'Persian request image name was corrupted.');
  await request(upload.url);

  const suffix = String(Date.now()).slice(-7);
  const phone = `0912${suffix}`.slice(0, 11);
  const submitted = await json<{ request: any }>('/api/engagement/part-requests', {
    method: 'POST',
    body: JSON.stringify({
      carBrand: 'KMC',
      carModel: 'J7',
      year: '1405',
      partName: `استعلام واقعی v30.8.2 ${suffix}`,
      oemNumber: `V3082-${suffix}`,
      phoneNumber: phone,
      fullName: 'تست استعلام ادمین',
      notes: 'Regression test for admin visibility',
      imageUrl: upload.url,
      imageName: upload.originalName,
      imageAttached: true
    })
  }, 201);
  assert(submitted.data.request.id, 'Part request insert returned no id.');
  assert.equal(submitted.data.request.imageUrl, upload.url, 'Part request did not retain uploaded image URL.');

  const adminData = await json<{ partRequests: any[] }>('/api/engagement/admin', {
    headers: { Cookie: adminCookie }
  });
  const visible = adminData.data.partRequests.find(item => item.id === submitted.data.request.id);
  assert(visible, 'New public part request is not visible to admin API.');
  assert.equal(visible.imageUrl, upload.url, 'Admin API did not return the request attachment.');

  console.log('v30.8.2 regression smoke passed.');
};

run().catch(error => {
  console.error(error);
  process.exit(1);
});
