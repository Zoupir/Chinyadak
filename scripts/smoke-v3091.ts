import assert from 'node:assert/strict';
import fs from 'node:fs';
import { markdownToSafeHtml } from '../src/utils/richText';

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
  const centered = '<p style="text-align:center"><strong>متن تست وسط‌چین</strong></p>';
  const sanitized = markdownToSafeHtml(centered);
  assert.match(sanitized, /text-align:center!important/i, 'Editor-authored alignment loses priority during sanitization.');
  assert.match(sanitized, /<strong>متن تست وسط‌چین<\/strong>/, 'Inline formatting was lost during sanitization.');

  const composerSource = fs.readFileSync('src/components/common/RichTextComposer.tsx', 'utf8');
  if (/data-quill-rich-editor="30\.10\.9"/.test(composerSource)) {
    assert.match(composerSource, /await import\('quill'\)/, 'Quill successor is not deferred to the browser.');
    assert.match(composerSource, /attributors\/style\/align/, 'Quill alignment style attributor is missing.');
    assert.match(composerSource, /attributors\/style\/color/, 'Quill color style attributor is missing.');
    assert.match(composerSource, /getSemanticHTML/, 'Quill successor does not emit semantic HTML.');
    assert.doesNotMatch(composerSource, /document\.execCommand/, 'Deprecated execCommand editor leaked into Quill successor.');
  } else if (/data-stable-rich-editor="30\.10\.8"/.test(composerSource)) {
    assert.match(composerSource, /savedRangeRef/, 'Replacement editor does not preserve the browser selection.');
    assert.match(composerSource, /document\.execCommand\('styleWithCSS'/, 'Replacement editor does not use CSS-backed formatting.');
    assert.match(composerSource, /onPaste=\{onPaste\}/, 'Replacement editor does not sanitize pasted content.');
  } else {
    assert.match(composerSource, /data-rich-composer-version="30\.9\.1"/, 'Stable editor toolbar patch is missing.');
    assert.match(composerSource, /onPointerDown=\{event => \{[\s\S]*onClick\(\)/, 'Toolbar does not execute on first pointer press.');
    assert.match(composerSource, /internalEmissionRef\.current === incomingHtml/, 'Controlled editor echo guard is missing.');
  }

  const pageSource = fs.readFileSync('src/components/page/PageView.tsx', 'utf8');
  assert.match(pageSource, /<RichTextContent content=\{section\.content\}/, 'CMS page section still escapes rich editor HTML.');
  assert.match(pageSource, /<RichTextContent content=\{item\.content\}/, 'CMS page item still escapes rich editor HTML.');

  const footerSource = fs.readFileSync('src/components/layout/Footer.tsx', 'utf8');
  assert.match(footerSource, /data-footer-rich-text="30\.9\.1"/, 'Footer rich-text renderer patch is missing.');
  assert.doesNotMatch(footerSource, /renderCopyright = .*\binline\b/, 'Footer copyright still flattens paragraphs to inline text.');

  const adminPassword = process.env.ADMIN_BOOTSTRAP_PASSWORD || '';
  assert(adminPassword.length >= 10, 'ADMIN_BOOTSTRAP_PASSWORD is required.');
  const login = await json<{ admin: unknown }>('/api/auth/admin/login', {
    method: 'POST',
    body: JSON.stringify({ username: process.env.ADMIN_BOOTSTRAP_USER || 'admin', password: adminPassword })
  });
  const cookie = cookieFrom(login.response);
  assert(cookie, 'Admin session cookie missing.');

  const before = await json<{ settings: Record<string, unknown> | null }>('/api/cms/bundle');
  const oldCopyright = String(before.data.settings?.footerCopyrightText || '');
  const savedCopyright = '<p style="text-align:center"><strong>CI footer rich text</strong></p>';

  const saved = await json<{ settings: Record<string, unknown> }>('/api/cms/settings', {
    method: 'PATCH',
    headers: { Cookie: cookie },
    body: JSON.stringify({ footerCopyrightText: savedCopyright })
  });
  assert.equal(saved.data.settings.footerCopyrightText, savedCopyright, 'Footer API did not return the saved rich HTML.');

  const publicBundle = await json<{ settings: Record<string, unknown> | null }>('/api/cms/bundle');
  assert.equal(publicBundle.data.settings?.footerCopyrightText, savedCopyright, 'Public CMS bundle did not receive saved footer rich HTML.');

  const testPage = {
    id: 'ci-rich-editor-page',
    slug: 'ci-rich-editor-page',
    title: 'CI Rich Editor',
    description: '',
    isSystem: false,
    updatedAt: 'CI',
    sections: [{
      id: 'ci-rich-section',
      title: 'Rich section',
      content: centered,
      isVisible: true,
      order: 1
    }]
  };
  await json('/api/cms/pages/ci-rich-editor-page', {
    method: 'PUT',
    headers: { Cookie: cookie },
    body: JSON.stringify(testPage)
  });
  const afterPageSave = await json<{ pages: Array<{ id: string; sections?: Array<{ content?: string }> }> }>('/api/cms/bundle');
  const storedPage = afterPageSave.data.pages.find(page => page.id === testPage.id);
  assert.equal(storedPage?.sections?.[0]?.content, centered, 'CMS page rich HTML did not survive persistence.');

  await request('/api/cms/pages/ci-rich-editor-page', { method: 'DELETE', headers: { Cookie: cookie } });
  await json('/api/cms/settings', {
    method: 'PATCH',
    headers: { Cookie: cookie },
    body: JSON.stringify({ footerCopyrightText: oldCopyright })
  });

  console.log('Rich editor persistence/rendering regression passed for legacy, stable replacement, or Quill successor editor.');
};

run().catch(error => {
  console.error(error);
  process.exit(1);
});
