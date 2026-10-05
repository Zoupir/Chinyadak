import assert from 'node:assert/strict';
import { markdownToSafeHtml } from '../src/utils/richText';

const base = String(process.env.TEST_BASE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');

const request = async (
  path: string,
  options: RequestInit = {},
  expected = 200
): Promise<Response> => {
  const response = await fetch(`${base}${path}`, options);
  if (response.status !== expected) {
    const body = await response.text().catch(() => '');
    throw new Error(`${options.method || 'GET'} ${path}: expected ${expected}, received ${response.status}: ${body}`);
  }
  return response;
};

const json = async <T>(
  path: string,
  options: RequestInit = {},
  expected = 200
): Promise<{ response: Response; data: T }> => {
  const response = await request(path, {
    ...options,
    headers: {
      'content-type': 'application/json',
      ...(options.headers || {})
    }
  }, expected);
  return { response, data: await response.json() as T };
};

const cookieFrom = (response: Response): string => {
  const value = response.headers.get('set-cookie') || '';
  const cookie = value.split(';')[0]?.trim();
  assert(cookie, 'Session cookie was not returned.');
  return cookie;
};

const cookieHeaders = (cookie: string) => ({ Cookie: cookie });

const run = async () => {
  const formattedHtml = markdownToSafeHtml('<p style="text-align: right;"><span style="color: #c2410c;">سلام</span> <a href="https://example.com">پیوند</a></p>');
  assert.match(formattedHtml, /text-align:right/i, 'Rich text sanitizer dropped paragraph alignment.');
  assert.match(formattedHtml, /color:#c2410c/i, 'Rich text sanitizer dropped inline text color.');
  assert.match(formattedHtml, /href="https:\/\/example\.com"/i, 'Rich text sanitizer dropped a safe link.');
  const unsafeHtml = markdownToSafeHtml('<p style="text-align: right; background-image: url(javascript:alert(1))"><span style="color: red; position: fixed">متن</span></p>');
  assert.doesNotMatch(unsafeHtml, /background-image|javascript:|position:/i, 'Rich text sanitizer retained unsafe CSS.');
  
  const health = await json<{ ok: boolean; database: string }>('/api/health');
  assert.equal(health.data.ok, true);
  assert.equal(health.data.database, 'connected');

  const catalog = await json<{ products: any[] }>('/api/catalog/products');
  const categories = await json<{ categories: any[] }>('/api/catalog/categories');
  const vehicles = await json<{ brands: any[]; models: any[] }>('/api/vehicles');
  const cms = await json<{ articles: any[]; pages: any[]; sliders: any[] }>('/api/cms/bundle');

  assert(catalog.data.products.length > 0, 'Seeded product catalog is empty.');
  assert(categories.data.categories.length > 0, 'Seeded categories are empty.');
  assert(vehicles.data.brands.length > 0, 'Seeded vehicle brands are empty.');
  assert(vehicles.data.models.length > 0, 'Seeded vehicle models are empty.');
  assert(cms.data.articles.length > 0, 'Seeded articles are empty.');

  const product = catalog.data.products.find(item => Number(item.stock || 0) > 0) || catalog.data.products[0];
  assert(product?.id && product?.slug, 'No usable seeded product.');

  const productHtml = await (await request(`/product/${encodeURIComponent(product.slug)}`)).text();
  assert(productHtml.includes('rel="canonical"'), 'Product HTML is missing canonical URL.');
  assert(productHtml.includes('/product/'), 'Product canonical URL is not product-specific.');
  assert(productHtml.includes('"@type":"Product"'), 'Product JSON-LD was not server-rendered.');

  const sitemap = await (await request('/sitemap.xml')).text();
  assert(sitemap.includes('/sitemap-products-1.xml'), 'Sitemap index is missing product sitemap.');
  assert(sitemap.includes('/sitemap-categories-1.xml'), 'Sitemap index is missing category sitemap.');
  assert(sitemap.includes('/sitemap-articles-1.xml'), 'Sitemap index is missing article sitemap.');

  const productSitemap = await (await request('/sitemap-products-1.xml')).text();
  const categorySitemap = await (await request('/sitemap-categories-1.xml')).text();
  const articleSitemap = await (await request('/sitemap-articles-1.xml')).text();
  assert(productSitemap.includes('/product/'), 'Product sitemap is missing product URLs.');
  assert(categorySitemap.includes('/category/'), 'Category sitemap is missing category URLs.');
  assert(articleSitemap.includes('/article/'), 'Article sitemap is missing article URLs.');

  const runtimeSeo = await json<{ meta: any }>(
    '/api/seo/runtime?path=' + encodeURIComponent('/product/' + product.slug)
  );
  assert(runtimeSeo.data.meta?.canonical?.includes('/product/'), 'Runtime SEO canonical is invalid.');
  assert.equal(runtimeSeo.data.meta?.ogType, 'product');

  const robots = await (await request('/robots.txt')).text();
  assert(robots.includes('Sitemap:'), 'robots.txt is missing sitemap declaration.');
  assert(robots.includes('Disallow: /admin'), 'robots.txt must block admin indexing.');

  const adminPassword = process.env.ADMIN_BOOTSTRAP_PASSWORD || '';
  assert(adminPassword.length >= 10, 'ADMIN_BOOTSTRAP_PASSWORD is required by smoke test.');
  const adminLogin = await json<{ admin: any }>('/api/auth/admin/login', {
    method: 'POST',
    body: JSON.stringify({
      username: process.env.ADMIN_BOOTSTRAP_USER || 'admin',
      password: adminPassword
    })
  });
  const adminCookie = cookieFrom(adminLogin.response);
  assert.equal(adminLogin.data.admin.role, 'super_admin');

  // End-to-end regression: Persian multipart names must survive upload and load from a URL.
  const persianFilename = 'تصویر قطعه فارسی ۱۴۰۵.png';
  const pngBytes = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64');
  const uploadForm = new FormData();
  uploadForm.append('image', new Blob([Uint8Array.from(pngBytes)], { type: 'image/png' }), persianFilename);
  uploadForm.append('category', 'integration');
  let uploadedPath = '';
  try {
    const uploadResponse = await request('/api/media/image', {
      method: 'POST',
      headers: cookieHeaders(adminCookie),
      body: uploadForm
    }, 201);
    const uploaded = await uploadResponse.json() as { url: string; filename: string; originalName: string; relativePath: string };
    uploadedPath = uploaded.relativePath;
    assert.equal(uploaded.filename, persianFilename, 'Uploaded filename was corrupted.');
    assert.equal(uploaded.originalName, persianFilename, 'Returned original filename was corrupted.');
    assert(uploaded.url.endsWith(encodeURIComponent(persianFilename)), 'Uploaded URL did not encode the Persian filename.');
    const servedImage = await request(uploaded.url);
    assert.equal(servedImage.headers.get('content-type')?.split(';')[0], 'image/png');
    assert.equal((await servedImage.arrayBuffer()).byteLength, pngBytes.byteLength, 'Uploaded image did not load intact.');
    const mediaSearch = await json<{ items: Array<{ filename: string; relativePath: string }> }>(
      '/api/media/library?q=' + encodeURIComponent('تصویر قطعه'),
      { headers: cookieHeaders(adminCookie) }
    );
    assert(mediaSearch.data.items.some(item => item.filename === persianFilename && item.relativePath === uploadedPath), 'Media library did not preserve the Persian filename.');
  } finally {
    if (uploadedPath) {
      await json('/api/media/library', {
        method: 'DELETE',
        headers: cookieHeaders(adminCookie),
        body: JSON.stringify({ relativePath: uploadedPath })
      }).catch(() => undefined);
    }
  }

  const seoSummary = await json<{ summary: any; settings: any }>('/api/seo/summary', {
    headers: cookieHeaders(adminCookie)
  });
  assert(seoSummary.data.settings?.modules?.meta, 'TakRank SEO meta module is not enabled.');
  assert.equal(typeof seoSummary.data.summary?.openIssues, 'number');

  const seoWorkspace = await json<{ entity: any; analysis: any }>(
    '/api/seo/entities/product/' + encodeURIComponent(product.id),
    { headers: cookieHeaders(adminCookie) }
  );
  assert.equal(seoWorkspace.data.entity?.id, product.id);
  assert.equal(typeof seoWorkspace.data.analysis?.score, 'number');

  const admins = await json<{ admins: any[] }>('/api/admin-data/admins', {
    headers: cookieHeaders(adminCookie)
  });
  assert(admins.data.admins.length >= 1, 'Admin list is unavailable.');

  // RBAC: a content-only manager must not be able to read orders.
  const limitedUsername = `ci_content_${Date.now()}`;
  const limitedPassword = 'CI-Content-Manager-123!';
  await json('/api/admin-data/admins', {
    method: 'POST',
    headers: cookieHeaders(adminCookie),
    body: JSON.stringify({
      username: limitedUsername,
      password: limitedPassword,
      fullName: 'CI Content Manager',
      role: 'content_manager',
      isActive: true,
      permissions: {
        canManageProducts: false,
        canManageOrders: false,
        canManageArticles: true,
        canManageSliders: false,
        canManageSettings: false,
        canManageAdmins: false,
        canAccessSandbox: false,
        canManageVehicles: false
      }
    })
  }, 201);

  const limitedLogin = await json<{ admin: any }>('/api/auth/admin/login', {
    method: 'POST',
    body: JSON.stringify({ username: limitedUsername, password: limitedPassword })
  });
  const limitedCookie = cookieFrom(limitedLogin.response);
  await request('/api/orders', { headers: cookieHeaders(limitedCookie) }, 403);

  // Encrypted integrations: plaintext secrets must never be returned.
  const secretValue = 'ci-secret-api-key-1234567890';
  const integrations = await json<{ integrations: any }>('/api/integrations', {
    method: 'PUT',
    headers: cookieHeaders(adminCookie),
    body: JSON.stringify({
      smsProvider: 'kavenegar',
      smsApiKey: secretValue,
      smsSenderNumber: '10004346',
      smsNotifyOnOrder: true,
      smsNotifyOnStock: true,
      smsTrackingPattern: 'ci-pattern',
      accountingSoftware: 'none',
      accountingApiKey: 'ci-accounting-secret',
      accountingAutoSyncStock: false,
      webhookUrl: 'https://example.com/chinpart-ci-webhook',
      webhookSecret: 'ci-webhook-secret'
    })
  });
  assert.notEqual(integrations.data.integrations.smsApiKey, secretValue);
  assert.match(integrations.data.integrations.smsApiKey, /•/);

  // Media upload: write a real PNG to persistent upload storage.
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z5Z0AAAAASUVORK5CYII=',
    'base64'
  );
  const form = new FormData();
  form.append('category', 'ci');
  form.append('image', new Blob([png], { type: 'image/png' }), 'ci.png');
  const mediaResponse = await request('/api/media/image', {
    method: 'POST',
    headers: cookieHeaders(adminCookie),
    body: form
  }, 201);
  const media = await mediaResponse.json() as { url: string };
  assert(media.url.startsWith('/uploads/'));
  await request(media.url);

  // Public engagement capture.
  const customerPhone = '09120000001';
  const partRequest = await json<{ request: any }>('/api/engagement/part-requests', {
    method: 'POST',
    body: JSON.stringify({
      carBrand: 'KMC',
      carModel: 'J7',
      year: '1403',
      partName: 'قطعه تست CI',
      oemNumber: 'CI-OEM-1',
      phoneNumber: customerPhone,
      fullName: 'کاربر تست CI',
      notes: 'Automated integration smoke test'
    })
  }, 201);
  assert(partRequest.data.request.id);

  await json('/api/engagement/stock-alerts', {
    method: 'POST',
    body: JSON.stringify({ productId: product.id, phone: customerPhone })
  }, 201);

  await json('/api/engagement/search-log', {
    method: 'POST',
    body: JSON.stringify({ query: 'واتر پمپ تست CI', resultsCount: 3 })
  });

  // Customer activation + secure retrieval of their own request.
  const customerRegister = await json<{ customer: any }>('/api/auth/customer/register', {
    method: 'POST',
    body: JSON.stringify({
      firstName: 'کاربر',
      lastName: 'تست',
      phone: customerPhone,
      password: 'CI-Customer-Password-123!',
      type: 'retail',
      vehicle: 'KMC J7'
    })
  }, 201);
  const customerCookie = cookieFrom(customerRegister.response);
  assert.equal(customerRegister.data.customer.loyaltyPoints, 50, 'Signup bonus was not persisted to the customer balance.');
  const signupLoyalty = await json<{ transactions: any[] }>('/api/auth/customer/loyalty', {
    headers: cookieHeaders(customerCookie)
  });
  assert(signupLoyalty.data.transactions.some(tx => tx.type === 'bonus' && tx.reason === 'signup_bonus' && tx.points === 50),
    'Signup bonus transaction is missing from the customer ledger.');

  const mine = await json<{ requests: any[] }>('/api/engagement/part-requests/mine', {
    headers: cookieHeaders(customerCookie)
  });
  assert(mine.data.requests.some(item => item.id === partRequest.data.request.id));

  // Order creation is recalculated by the server and must be trackable only with phone + order number.
  const orderCreated = await json<{ order: any }>('/api/orders', {
    method: 'POST',
    headers: cookieHeaders(customerCookie),
    body: JSON.stringify({
      customer: {
        firstName: 'کاربر',
        lastName: 'تست',
        phone: customerPhone,
        province: 'تهران',
        city: 'تهران',
        postalCode: '1234567890',
        address: 'نشانی تست CI',
        notes: ''
      },
      items: [{ productId: product.id, quantity: 1 }],
      shippingMethodId: 'post',
      paymentMethodId: 'saman'
    })
  }, 201);

  assert(orderCreated.data.order.orderNumber, 'Order number was not created.');
  assert(Number(orderCreated.data.order.total) > 0, 'Server-calculated order total is invalid.');

  const tracking = await json<{ order: any }>('/api/orders/track', {
    method: 'POST',
    body: JSON.stringify({
      orderNumber: orderCreated.data.order.orderNumber,
      phone: customerPhone
    })
  });
  assert.equal(tracking.data.order.orderNumber, orderCreated.data.order.orderNumber);

  // Loyalty earns only after an order is marked paid, and is stored in the same customer ledger.
  await json(`/api/orders/${encodeURIComponent(orderCreated.data.order.id)}/status`, {
    method: 'PATCH',
    headers: cookieHeaders(adminCookie),
    body: JSON.stringify({ status: 'paid' })
  });
  const paidLoyalty = await json<{ transactions: any[] }>('/api/auth/customer/loyalty', {
    headers: cookieHeaders(customerCookie)
  });
  const paidOrderTransactions = paidLoyalty.data.transactions.filter(tx => tx.orderNumber === orderCreated.data.order.orderNumber);
  assert(paidOrderTransactions.some(tx => tx.type === 'earned' && tx.points > 0),
    'A paid order did not award purchase points.');
  assert(paidOrderTransactions.some(tx => tx.type === 'bonus' && tx.reason === 'first_paid_order'),
    'The first paid-order bonus was not recorded.');

  // When the seeded product is large enough for the configured minimum, redeem and cancel it.
  if (Number(orderCreated.data.order.subtotal) >= 100000) {
    const beforeRedeem = await json<{ customer: any }>('/api/auth/me', {
      headers: cookieHeaders(customerCookie)
    });
    const redeemOrder = await json<{ order: any }>('/api/orders', {
      method: 'POST',
      headers: cookieHeaders(customerCookie),
      body: JSON.stringify({
        customer: {
          firstName: 'کاربر', lastName: 'تست', phone: customerPhone, province: 'تهران',
          city: 'تهران', postalCode: '1234567890', address: 'نشانی تست CI', notes: ''
        },
        items: [{ productId: product.id, quantity: 1 }],
        shippingMethodId: 'post',
        paymentMethodId: 'saman',
        loyaltyPointsToRedeem: 50
      })
    }, 201);
    assert.equal(Number(redeemOrder.data.order.discountAmount), 50000,
      'Checkout did not apply the configured points discount.');
    await json(`/api/orders/${encodeURIComponent(redeemOrder.data.order.id)}/status`, {
      method: 'PATCH',
      headers: cookieHeaders(adminCookie),
      body: JSON.stringify({ status: 'cancelled' })
    });
    const afterCancel = await json<{ transactions: any[] }>('/api/auth/customer/loyalty', {
      headers: cookieHeaders(customerCookie)
    });
    assert(afterCancel.data.transactions.some(tx => tx.type === 'refund' && tx.reason === 'redemption_return' && tx.points === 50),
      'Cancelling an unpaid order did not restore redeemed points.');
    const afterCancelMe = await json<{ customer: any }>('/api/auth/me', {
      headers: cookieHeaders(customerCookie)
    });
    assert.equal(afterCancelMe.data.customer.loyaltyPoints, beforeRedeem.data.customer.loyaltyPoints,
      'Loyalty balance did not return to its pre-redemption value after cancellation.');
  }

  // Admin reporting must contain data captured above.
  const engagementAdmin = await json<{ partRequests: any[]; stockAlerts: any[]; searchLogs: any[] }>(
    '/api/engagement/admin',
    { headers: cookieHeaders(adminCookie) }
  );
  assert(engagementAdmin.data.partRequests.some(item => item.id === partRequest.data.request.id));
  assert(engagementAdmin.data.stockAlerts.some(item => item.productId === product.id && item.phone === customerPhone));
  assert(engagementAdmin.data.searchLogs.some(item => item.query === 'واتر پمپ تست CI'));

  console.log('Smoke test passed: DB, auth, RBAC, CMS, SEO, media, integrations, engagement and orders.');
};

run().catch(error => {
  console.error(error);
  process.exit(1);
});
