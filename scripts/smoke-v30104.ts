import assert from 'node:assert/strict';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';

const base = String(process.env.TEST_BASE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
const origin = new URL(base).origin;
const source = (file: string) => fs.readFileSync(file, 'utf8');

assert.match(source('src/server/routes/media.ts'), /getMediaLibraryItems/);
assert.match(source('src/server/routes/media.ts'), /MEDIA_FILE_IN_USE/);
assert.match(source('src/server/routes/media.ts'), /nextOffset/);
assert.match(source('src/server/routes/rich-media.ts'), /bufferedInMemory: false/);
assert.match(source('src/server/routes/rich-media.ts'), /registerUploadedMedia/);
assert.match(source('src/server/media-library.ts'), /generateResponsiveImageVariants/);
assert.match(source('src/server/media-library.ts'), /MEDIA_LIBRARY_CACHE_MS/);
assert.match(source('src/server/media-references.ts'), /source: 'seo-meta'/);
assert.match(source('src/components/admin/AdminMediaLibrary.tsx'), /PAGE_SIZE = 80/);
assert.match(source('src/components/common/MediaPickerModal.tsx'), /kind: 'image'/);
assert.match(source('server.ts'), /app\.use\('\/api\/rich-media', richMediaRouter\)/);

const sameOriginHeaders = (cookie?: string): Record<string, string> => ({
  origin,
  'sec-fetch-site': 'same-origin',
  ...(cookie ? { cookie } : {})
});
const jsonHeaders = (cookie?: string): Record<string, string> => ({
  ...sameOriginHeaders(cookie),
  'content-type': 'application/json'
});

const json = async <T>(path: string, init: RequestInit = {}, expected = 200): Promise<{ response: Response; data: T }> => {
  const response = await fetch(base + path, init);
  const text = await response.text();
  if (response.status !== expected) throw new Error(`${init.method || 'GET'} ${path}: expected ${expected}, got ${response.status}: ${text}`);
  return { response, data: text ? JSON.parse(text) as T : {} as T };
};

const run = async () => {
  const login = await json<{ admin: any }>('/api/auth/admin/login', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({
      username: process.env.ADMIN_BOOTSTRAP_USER || 'admin',
      password: process.env.ADMIN_BOOTSTRAP_PASSWORD || ''
    })
  });
  const cookie = String(login.response.headers.get('set-cookie') || '').split(';')[0];
  assert(cookie, 'Admin session cookie missing.');

  let imageRelativePath = '';
  let audioRelativePath = '';
  let pageId = '';
  try {
    const imageBuffer = await sharp({
      create: { width: 520, height: 320, channels: 3, background: { r: 248, g: 248, b: 248 } }
    }).png().toBuffer();
    const imageName = `تصویر-مرحله-۵-${randomUUID().slice(0, 6)}.png`;
    const imageForm = new FormData();
    imageForm.append('category', 'stage5-ci');
    imageForm.append('image', new Blob([imageBuffer], { type: 'image/png' }), imageName);
    const uploadResponse = await fetch(base + '/api/media/image', {
      method: 'POST', headers: sameOriginHeaders(cookie), body: imageForm
    });
    const uploadText = await uploadResponse.text();
    assert.equal(uploadResponse.status, 201, uploadText);
    const uploaded = JSON.parse(uploadText) as any;
    imageRelativePath = uploaded.relativePath;
    assert.equal(uploaded.kind, 'image');
    assert.equal(uploaded.originalName, imageName);
    assert.equal(uploaded.width, 520);
    assert.equal(uploaded.height, 320);
    assert.ok(Array.isArray(uploaded.variants) && uploaded.variants.length >= 1, 'Responsive WebP variants missing.');
    assert.ok(uploaded.variants.every((variant:any) => variant.format === 'webp'));
    assert.match(String(uploaded.thumbnailUrl), /\.webp$/);

    const library = await json<any>('/api/media/library?kind=image&category=stage5-ci&limit=1&offset=0', {
      headers: sameOriginHeaders(cookie)
    });
    assert.equal(library.data.items.length, 1);
    assert.ok(library.data.total >= 1);
    assert.equal(typeof library.data.hasMore, 'boolean');
    assert.ok('nextOffset' in library.data);
    const listedImage = library.data.items.find((item:any) => item.relativePath === imageRelativePath) || library.data.items[0];
    assert.equal(listedImage.kind, 'image');
    assert.ok(listedImage.thumbnailUrl);
    assert.ok(Array.isArray(listedImage.variants));

    const alt = `ALT مرحله پنج ${randomUUID().slice(0, 5)}`;
    const title = `عنوان رسانه مرحله پنج ${randomUUID().slice(0, 5)}`;
    const savedMeta = await json<any>('/api/media/library/meta', {
      method: 'PUT', headers: jsonHeaders(cookie),
      body: JSON.stringify({ relativePath: imageRelativePath, alt, title, caption: 'کپشن تست', description: 'توضیح کامل تست' })
    });
    assert.equal(savedMeta.data.seo.alt, alt);
    assert.equal(savedMeta.data.seo.title, title);

    const reloaded = await json<any>('/api/media/library?kind=image&category=stage5-ci&q=' + encodeURIComponent(title) + '&limit=10&refresh=1', {
      headers: sameOriginHeaders(cookie)
    });
    const persisted = reloaded.data.items.find((item:any) => item.relativePath === imageRelativePath);
    assert(persisted, 'Uploaded image missing after metadata save.');
    assert.equal(persisted.seo.alt, alt);
    assert.equal(persisted.seo.title, title);

    pageId = `page-media-stage5-${randomUUID()}`;
    const pageSlug = `media-stage5-${randomUUID().slice(0, 8)}`;
    await json<any>(`/api/cms/pages/${encodeURIComponent(pageId)}`, {
      method: 'PUT', headers: jsonHeaders(cookie),
      body: JSON.stringify({
        id: pageId,
        slug: pageSlug,
        title: 'Stage 5 media reference page',
        description: `Reference ${uploaded.url}`,
        isSystem: false,
        updatedAt: '',
        sections: [{ id: `${pageId}-section`, title: 'Media', isVisible: true, order: 1, content: `<img src="${uploaded.url}" alt="stage5" />` }]
      })
    });

    const refs = await json<any>('/api/media/library/references?relativePath=' + encodeURIComponent(imageRelativePath), {
      headers: sameOriginHeaders(cookie)
    });
    assert.equal(refs.data.inUse, true);
    assert.ok(refs.data.references.some((ref:any) => ref.source === 'page' && ref.id === pageId), 'CMS page media reference not detected.');

    const blockedDelete = await json<any>('/api/media/library', {
      method: 'DELETE', headers: jsonHeaders(cookie), body: JSON.stringify({ relativePath: imageRelativePath })
    }, 409);
    assert.equal(blockedDelete.data.error, 'MEDIA_FILE_IN_USE');
    assert.ok(Array.isArray(blockedDelete.data.references) && blockedDelete.data.references.length > 0);

    await json(`/api/cms/pages/${encodeURIComponent(pageId)}`, { method: 'DELETE', headers: jsonHeaders(cookie) });
    pageId = '';
    await json('/api/media/library', {
      method: 'DELETE', headers: jsonHeaders(cookie), body: JSON.stringify({ relativePath: imageRelativePath })
    });
    imageRelativePath = '';

    const audioName = `صدای-مرحله-۵-${randomUUID().slice(0, 6)}.mp3`;
    const audioBytes = Buffer.concat([Buffer.from('ID3'), Buffer.alloc(256, 0)]);
    const audioForm = new FormData();
    audioForm.append('kind', 'audio');
    audioForm.append('category', 'stage5-ci');
    audioForm.append('file', new Blob([audioBytes], { type: 'audio/mpeg' }), audioName);
    const audioResponse = await fetch(base + '/api/rich-media/upload', {
      method: 'POST', headers: sameOriginHeaders(cookie), body: audioForm
    });
    const audioText = await audioResponse.text();
    assert.equal(audioResponse.status, 201, audioText);
    const audio = JSON.parse(audioText) as any;
    audioRelativePath = audio.relativePath;
    assert.equal(audio.kind, 'audio');
    assert.equal(audio.bufferedInMemory, false);
    assert.equal(audio.originalName, audioName);
    assert.equal(audio.seo.kind, 'audio');

    const audioList = await json<any>('/api/media/library?kind=audio&category=stage5-ci&limit=10&refresh=1', {
      headers: sameOriginHeaders(cookie)
    });
    const listedAudio = audioList.data.items.find((item:any) => item.relativePath === audioRelativePath);
    assert(listedAudio, 'Uploaded audio missing from unified media library.');
    assert.equal(listedAudio.kind, 'audio');

    await json('/api/media/library', {
      method: 'DELETE', headers: jsonHeaders(cookie), body: JSON.stringify({ relativePath: audioRelativePath })
    });
    audioRelativePath = '';

    console.log('v30.10.4 stage 5 media/content pipeline smoke passed.');
  } finally {
    if (pageId) await fetch(base + `/api/cms/pages/${encodeURIComponent(pageId)}`, { method:'DELETE', headers: jsonHeaders(cookie) }).catch(() => undefined);
    for (const relativePath of [imageRelativePath, audioRelativePath].filter(Boolean)) {
      await fetch(base + '/api/media/library', {
        method:'DELETE', headers: jsonHeaders(cookie), body: JSON.stringify({ relativePath })
      }).catch(() => undefined);
    }
  }
};

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
