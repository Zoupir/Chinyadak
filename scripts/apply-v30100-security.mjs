import fs from 'node:fs';

const changed = [];
const edit = (file, transform) => {
  const before = fs.readFileSync(file, 'utf8');
  const after = transform(before);
  if (after !== before) {
    fs.writeFileSync(file, after);
    changed.push(file);
  }
};

const replaceSection = (source, startMarker, endMarker, replacement, label) => {
  const start = source.indexOf(startMarker);
  if (start < 0) throw new Error(`v30.10.0 missing start marker: ${label}`);
  const end = source.indexOf(endMarker, start + startMarker.length);
  if (end < 0) throw new Error(`v30.10.0 missing end marker: ${label}`);
  return source.slice(0, start) + replacement + source.slice(end);
};

// ---------------------------------------------------------------------------
// Server-wide browser hardening: production CSP + same-origin mutations.
// Payment callbacks are explicitly exempt because banks post from another site.
// ---------------------------------------------------------------------------
edit('server.ts', source => {
  const helmetPattern = /app\.use\(\s*helmet\(\{[\s\S]*?\}\)\s*\);/;
  const helmetBlock = `app.use(\n  helmet({\n    contentSecurityPolicy: config.nodeEnv === 'production' ? {\n      useDefaults: true,\n      directives: {\n        \"default-src\": [\"'self'\"],\n        \"base-uri\": [\"'self'\"],\n        \"object-src\": [\"'none'\"],\n        \"frame-ancestors\": [\"'self'\"],\n        \"script-src\": [\"'self'\", \"'unsafe-inline'\"],\n        \"style-src\": [\"'self'\", \"'unsafe-inline'\", 'https://fonts.googleapis.com'],\n        \"font-src\": [\"'self'\", 'data:', 'https://fonts.gstatic.com'],\n        \"img-src\": [\"'self'\", 'data:', 'blob:', 'https:'],\n        \"media-src\": [\"'self'\", 'blob:', 'https:'],\n        \"connect-src\": [\"'self'\", 'https:', 'wss:'],\n        \"frame-src\": ['https:'],\n        \"form-action\": [\"'self'\", 'https:'],\n        \"upgrade-insecure-requests\": []\n      }\n    } : false,\n    crossOriginResourcePolicy: { policy: 'cross-origin' },\n    referrerPolicy: { policy: 'strict-origin-when-cross-origin' }\n  })\n);`;
  if (!source.includes('strict-origin-when-cross-origin')) {
    if (!helmetPattern.test(source)) throw new Error('v30.10.0 helmet block not found');
    source = source.replace(helmetPattern, helmetBlock);
  }

  if (!source.includes('API_CROSS_SITE_MUTATION_BLOCKED')) {
    const marker = 'app.use(cookieParser());';
    if (!source.includes(marker)) throw new Error('v30.10.0 cookie parser marker missing');
    const guard = `${marker}\n\nconst apiMutationMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);\napp.use('/api', (req, res, next) => {\n  if (!apiMutationMethods.has(req.method.toUpperCase())) { next(); return; }\n  if (req.path.startsWith('/payments/callback/')) { next(); return; }\n\n  const fetchSite = String(req.get('sec-fetch-site') || '').toLowerCase();\n  if (fetchSite === 'cross-site') {\n    res.status(403).json({ error: 'API_CROSS_SITE_MUTATION_BLOCKED' });\n    return;\n  }\n\n  const origin = String(req.get('origin') || '').trim();\n  if (!origin) { next(); return; }\n  try {\n    const allowedOrigin = new URL(config.appUrl).origin;\n    if (new URL(origin).origin !== allowedOrigin) {\n      res.status(403).json({ error: 'API_ORIGIN_NOT_ALLOWED' });\n      return;\n    }\n  } catch {\n    res.status(403).json({ error: 'API_ORIGIN_NOT_ALLOWED' });\n    return;\n  }\n  next();\n});`;
    source = source.replace(marker, guard);
  }
  return source;
});

// ---------------------------------------------------------------------------
// Any route that still uses requireAdmin must re-check that the administrator
// is active. This makes deactivation effective immediately for admin-only APIs.
// ---------------------------------------------------------------------------
edit('src/server/auth.ts', source => {
  if (!source.includes('ADMIN_SESSION_REVOKED')) {
    const pattern = /export const requireAdmin = \([\s\S]*?\n\};\n\n\ninterface AdminPermissionRow/;
    const replacement = `export const requireAdmin = (\n  req: AuthenticatedRequest,\n  res: Response,\n  next: NextFunction\n): void => {\n  authenticate(req, res, async () => {\n    if (req.auth?.role !== 'admin') {\n      res.status(403).json({ error: 'ADMIN_REQUIRED' });\n      return;\n    }\n    try {\n      const [rows] = await pool.query<Array<RowDataPacket & { is_active: number }>>(\n        'SELECT is_active FROM admin_users WHERE id = ? LIMIT 1',\n        [req.auth.sub]\n      );\n      if (!rows[0]?.is_active) {\n        clearSession(res);\n        res.status(401).json({ error: 'ADMIN_SESSION_REVOKED' });\n        return;\n      }\n      next();\n    } catch (error) {\n      next(error);\n    }\n  });\n};\n\n\ninterface AdminPermissionRow`;
    const next = source.replace(pattern, replacement);
    if (next === source) throw new Error('v30.10.0 requireAdmin target missing');
    source = next;
  }
  return source;
});

// ---------------------------------------------------------------------------
// Payment ownership. Starting a gateway transaction is allowed only for the
// authenticated customer who owns the order.
// ---------------------------------------------------------------------------
edit('src/server/routes/payments.ts', source => {
  if (!source.includes("getOptionalSession")) {
    source = source.replace(
      "import { rateLimit } from 'express-rate-limit';\n",
      "import { rateLimit } from 'express-rate-limit';\nimport { getOptionalSession, type AuthenticatedRequest } from '../auth';\n"
    );
  }
  if (!source.includes('customer_id: string | null;')) {
    source = source.replace(
      '  order_number: string;\n',
      '  order_number: string;\n  customer_id: string | null;\n'
    );
  }
  source = source.replace(
    "paymentsRouter.post('/start', paymentLimiter, async (req, res) => {",
    "paymentsRouter.post('/start', paymentLimiter, async (req: AuthenticatedRequest, res) => {"
  );
  if (!source.includes("PAYMENT_AUTH_REQUIRED")) {
    const marker = "  const requestedProvider = String(req.body?.provider || '').trim().toLowerCase();\n";
    if (!source.includes(marker)) throw new Error('v30.10.0 payment provider marker missing');
    source = source.replace(marker, `${marker}  const session = getOptionalSession(req);\n  if (!session || session.role !== 'customer') {\n    res.status(401).json({ error: 'PAYMENT_AUTH_REQUIRED' });\n    return;\n  }\n`);
  }
  source = source.replace(
    'SELECT id, order_number, status, payment_method, payment_status, total,',
    'SELECT id, order_number, customer_id, status, payment_method, payment_status, total,'
  );
  if (!source.includes('PAYMENT_ORDER_FORBIDDEN')) {
    const marker = "      if (!order) throw new Error('ORDER_NOT_FOUND');\n";
    if (!source.includes(marker)) throw new Error('v30.10.0 payment order marker missing');
    source = source.replace(marker, `${marker}      if (!order.customer_id || order.customer_id !== session.sub) {\n        throw new Error('PAYMENT_ORDER_FORBIDDEN');\n      }\n`);
    source = source.replace(
      "      code === 'ORDER_NOT_FOUND' ? 404 :",
      "      code === 'ORDER_NOT_FOUND' ? 404 :\n      code === 'PAYMENT_ORDER_FORBIDDEN' ? 403 :"
    );
  }
  return source;
});

// ---------------------------------------------------------------------------
// Part-request attachments are private. New files live outside /uploads and are
// served only through an authenticated admin endpoint.
// ---------------------------------------------------------------------------
edit('src/server/routes/engagement.ts', source => {
  source = source.replace(
    "import { maxUploadBytes, uploadDirectory } from '../media';",
    "import { maxUploadBytes } from '../media';"
  );
  source = source.replace(
    "import { decodeMultipartFilename, normalizeUploadedImageFilename, publicUploadUrl } from '../media-filenames';",
    "import { decodeMultipartFilename, normalizeUploadedImageFilename } from '../media-filenames';"
  );
  if (!source.includes("from '../private-files'")) {
    const marker = "import { decodeMultipartFilename, normalizeUploadedImageFilename } from '../media-filenames';\n";
    if (!source.includes(marker)) throw new Error('v30.10.0 engagement media import marker missing');
    source = source.replace(marker, marker + "import { partRequestPrivateDirectory, partRequestPrivateUrl, resolvePartRequestPrivateToken } from '../private-files';\n");
  }

  const uploadStart = "engagementRouter.post('/part-request-image'";
  const requestStart = "engagementRouter.post('/part-requests', publicSubmitLimiter";
  if (!source.includes("data-private-part-request-upload")) {
    const route = `engagementRouter.post('/part-request-image', requestImageLimiter, requestImageUpload.single('image'), async (req, res) => {\n  if (!req.file?.buffer?.length) { res.status(400).json({ error: 'IMAGE_FILE_REQUIRED' }); return; }\n  const detected = detectRequestImageType(req.file.buffer);\n  if (!detected) { res.status(415).json({ error: 'IMAGE_FORMAT_NOT_ALLOWED' }); return; }\n  const safeOriginal = normalizeUploadedImageFilename(req.file.originalname, detected.extension);\n  if (!safeOriginal) { res.status(400).json({ error: 'IMAGE_FILENAME_INVALID' }); return; }\n\n  const now = new Date();\n  const year = String(now.getUTCFullYear());\n  const month = String(now.getUTCMonth() + 1).padStart(2, '0');\n  const ext = path.extname(safeOriginal);\n  const stem = path.basename(safeOriginal, ext).slice(0, 160);\n  const storedName = \`${'${Date.now()}'}-${'${randomUUID().slice(0, 8)}'}-${'${stem}'}${'${ext}'}\`;\n  const relativePath = path.posix.join(year, month, storedName);\n  const targetDir = path.join(partRequestPrivateDirectory(), year, month);\n  await fs.mkdir(targetDir, { recursive: true });\n  await fs.writeFile(path.join(targetDir, storedName), req.file.buffer, { flag: 'wx' });\n\n  res.status(201).json({\n    url: partRequestPrivateUrl(relativePath),\n    originalName: decodeMultipartFilename(req.file.originalname),\n    mime: detected.mime,\n    size: req.file.buffer.length,\n    private: true,\n    marker: 'data-private-part-request-upload'\n  });\n});\n\nengagementRouter.get('/part-request-files/:token', requireAdminPermission('canManageOrders'), async (req, res) => {\n  const target = resolvePartRequestPrivateToken(String(req.params.token || ''));\n  if (!target) { res.status(400).json({ error: 'PART_REQUEST_FILE_TOKEN_INVALID' }); return; }\n  try {\n    await fs.access(target);\n  } catch {\n    res.status(404).json({ error: 'PART_REQUEST_FILE_NOT_FOUND' });\n    return;\n  }\n  res.setHeader('Cache-Control', 'private, no-store');\n  res.setHeader('X-Content-Type-Options', 'nosniff');\n  res.sendFile(target);\n});\n\n`;
    source = replaceSection(source, uploadStart, requestStart, route, 'private part request upload route');
  }

  source = source.replace(
    "const imageUrl = /^\\/uploads\\/part-requests\\//.test(imageUrlRaw) ? imageUrlRaw.slice(0, 1200) : '';",
    "const imageUrl = /^\\/api\\/engagement\\/part-request-files\\/[A-Za-z0-9_-]+$/.test(imageUrlRaw) ? imageUrlRaw.slice(0, 1600) : '';"
  );
  if (!source.includes("part-request-files\\/[A-Za-z0-9_-]+")) {
    throw new Error('v30.10.0 private attachment validation missing');
  }
  return source;
});

// ---------------------------------------------------------------------------
// Media library authorization + referenced-file delete protection.
// ---------------------------------------------------------------------------
edit('src/server/routes/media.ts', source => {
  source = source.replace("import { requireAdmin } from '../auth';", "import { requireMediaAdmin } from '../media-auth';");
  if (!source.includes("from '../media-references'")) {
    const marker = "import { decodeMultipartFilename, normalizeUploadedImageFilename, publicUploadUrl } from '../media-filenames';\n";
    if (!source.includes(marker)) throw new Error('v30.10.0 media filename import marker missing');
    source = source.replace(marker, marker + "import { findMediaReferences } from '../media-references';\n");
  }
  source = source.replace(/\brequireAdmin\b/g, 'requireMediaAdmin');

  if (!source.includes('MEDIA_FILE_IN_USE')) {
    const marker = "  try {\n    await fs.unlink(target);";
    if (!source.includes(marker)) throw new Error('v30.10.0 media delete marker missing');
    source = source.replace(marker, `  const references = await findMediaReferences(publicUploadUrl(relativePath), relativePath);\n  if (references.length) {\n    res.status(409).json({ error: 'MEDIA_FILE_IN_USE', references });\n    return;\n  }\n  try {\n    await fs.unlink(target);`);
  }
  return source;
});

// ---------------------------------------------------------------------------
// Rich-media upload is streamed to disk by multer. Large video/audio files are
// never buffered wholesale in the Node/Passenger process.
// ---------------------------------------------------------------------------
const richMediaSource = `import fs from 'node:fs/promises';\nimport { constants as fsConstants } from 'node:fs';\nimport os from 'node:os';\nimport path from 'node:path';\nimport { randomUUID } from 'node:crypto';\nimport { Router } from 'express';\nimport multer from 'multer';\nimport { requireMediaAdmin } from '../media-auth';\nimport { uploadDirectory } from '../media';\nimport { decodeMultipartFilename, publicUploadUrl } from '../media-filenames';\n\ntype RichMediaKind = 'audio' | 'video';\n\nconst allowedByKind: Record<RichMediaKind, Record<string, string[]>> = {\n  audio: {\n    mp3: ['audio/mpeg', 'audio/mp3'], wav: ['audio/wav', 'audio/x-wav', 'audio/wave'],\n    ogg: ['audio/ogg', 'application/ogg'], m4a: ['audio/mp4', 'audio/x-m4a'], aac: ['audio/aac', 'audio/x-aac']\n  },\n  video: {\n    mp4: ['video/mp4', 'application/mp4'], webm: ['video/webm'],\n    ogv: ['video/ogg', 'application/ogg'], mov: ['video/quicktime']\n  }\n};\n\nconst maxRichMediaBytes = (): number => {\n  const configured = Number(process.env.MAX_RICH_MEDIA_MB || 96);\n  const mb = Number.isFinite(configured) ? Math.max(8, Math.min(512, configured)) : 96;\n  return Math.floor(mb * 1024 * 1024);\n};\n\nconst looksLikeAllowedMedia = (head: Buffer, extension: string, kind: RichMediaKind): boolean => {\n  if (!head.length) return false;\n  const ascii = head.toString('ascii');\n  if (kind === 'audio') {\n    if (extension === 'mp3') return ascii.startsWith('ID3') || (head[0] === 0xff && (head[1] & 0xe0) === 0xe0);\n    if (extension === 'wav') return ascii.startsWith('RIFF') && ascii.slice(8, 12) === 'WAVE';\n    if (extension === 'ogg') return ascii.startsWith('OggS');\n    if (extension === 'm4a') return ascii.includes('ftyp');\n    if (extension === 'aac') return head[0] === 0xff && (head[1] & 0xf0) === 0xf0;\n  } else {\n    if (extension === 'mp4' || extension === 'mov') return ascii.includes('ftyp');\n    if (extension === 'webm') return head.length >= 4 && head[0] === 0x1a && head[1] === 0x45 && head[2] === 0xdf && head[3] === 0xa3;\n    if (extension === 'ogv') return ascii.startsWith('OggS');\n  }\n  return false;\n};\n\nconst safeUploadedFilename = (rawName: unknown, kind: RichMediaKind, mime: string, head: Buffer): string | null => {\n  const filename = decodeMultipartFilename(rawName).trim();\n  if (!filename || filename.length > 240) return null;\n  if (/[\\u0000-\\u001f\\u007f]/u.test(filename) || /[\\u202A-\\u202E\\u2066-\\u2069]/u.test(filename)) return null;\n  if (filename.includes('/') || filename.includes('\\\\') || filename === '.' || filename === '..') return null;\n  const extension = path.extname(filename).slice(1).toLowerCase();\n  const acceptedMimes = allowedByKind[kind][extension];\n  if (!acceptedMimes?.includes(String(mime || '').toLowerCase())) return null;\n  return looksLikeAllowedMedia(head, extension, kind) ? filename : null;\n};\n\nconst upload = multer({\n  storage: multer.diskStorage({\n    destination: (_req, _file, callback) => callback(null, os.tmpdir()),\n    filename: (_req, _file, callback) => callback(null, 'yadak-rich-' + randomUUID() + '.upload')\n  }),\n  limits: { fileSize: maxRichMediaBytes(), files: 1, fields: 8 }\n});\n\nconst readHead = async (filePath: string): Promise<Buffer> => {\n  const handle = await fs.open(filePath, 'r');\n  try {\n    const buffer = Buffer.alloc(64);\n    const result = await handle.read(buffer, 0, buffer.length, 0);\n    return buffer.subarray(0, result.bytesRead);\n  } finally {\n    await handle.close();\n  }\n};\n\nexport const richMediaRouter = Router();\n\nrichMediaRouter.post('/upload', requireMediaAdmin, upload.single('file'), async (req, res, next) => {\n  const tempPath = req.file?.path;\n  try {\n    const kind = String(req.body?.kind || '') as RichMediaKind;\n    if (!['audio', 'video'].includes(kind)) { res.status(400).json({ error: 'RICH_MEDIA_KIND_INVALID' }); return; }\n    if (!req.file || !tempPath) { res.status(400).json({ error: 'RICH_MEDIA_FILE_REQUIRED' }); return; }\n\n    const head = await readHead(tempPath);\n    const filename = safeUploadedFilename(req.file.originalname, kind, req.file.mimetype, head);\n    if (!filename) {\n      res.status(415).json({ error: kind === 'video' ? 'VIDEO_FORMAT_NOT_ALLOWED' : 'AUDIO_FORMAT_NOT_ALLOWED' });\n      return;\n    }\n\n    const rawCategory = String(req.body?.category || 'editor-media').toLowerCase();\n    const category = rawCategory.replace(/[^a-z0-9_-]/g, '').slice(0, 40) || 'editor-media';\n    const now = new Date();\n    const year = String(now.getUTCFullYear());\n    const month = String(now.getUTCMonth() + 1).padStart(2, '0');\n    const relativeDir = path.posix.join(category, kind, year, month);\n    const targetDir = path.join(uploadDirectory(), category, kind, year, month);\n    await fs.mkdir(targetDir, { recursive: true });\n    const targetPath = path.join(targetDir, filename);\n\n    try {\n      await fs.copyFile(tempPath, targetPath, fsConstants.COPYFILE_EXCL);\n    } catch (error: any) {\n      if (error?.code === 'EEXIST') { res.status(409).json({ error: 'MEDIA_FILENAME_EXISTS', filename }); return; }\n      throw error;\n    }\n\n    const relativePath = path.posix.join(relativeDir, filename);\n    res.status(201).json({\n      url: publicUploadUrl(relativePath), relativePath, kind, mime: req.file.mimetype,\n      size: req.file.size, originalName: filename, bufferedInMemory: false\n    });\n  } catch (error) {\n    next(error);\n  } finally {\n    if (tempPath) await fs.unlink(tempPath).catch(() => undefined);\n  }\n});\n`;
if (fs.readFileSync('src/server/routes/rich-media.ts', 'utf8') !== richMediaSource) {
  fs.writeFileSync('src/server/routes/rich-media.ts', richMediaSource);
  changed.push('src/server/routes/rich-media.ts');
}

// ---------------------------------------------------------------------------
// Trust badges: allow only a narrow HTML subset instead of executing arbitrary
// administrator-provided HTML/event handlers in every visitor browser.
// ---------------------------------------------------------------------------
edit('src/components/layout/Footer.tsx', source => {
  if (!source.includes("safeEmbedHtml")) {
    const marker = "import { RichTextContent } from '../common/RichTextContent';\n";
    if (!source.includes(marker)) throw new Error('v30.10.0 footer import marker missing');
    source = source.replace(marker, marker + "import { sanitizeTrustedEmbedHtml } from '../../utils/safeEmbedHtml';\n");
  }
  source = source.replace(
    'dangerouslySetInnerHTML={{ __html: badge.htmlCode }}',
    'dangerouslySetInnerHTML={{ __html: sanitizeTrustedEmbedHtml(badge.htmlCode) }}'
  );
  source = source.replace(
    'dangerouslySetInnerHTML={{ __html: settings.footerEnamadHtml }}',
    'dangerouslySetInnerHTML={{ __html: sanitizeTrustedEmbedHtml(settings.footerEnamadHtml) }}'
  );
  if (source.includes('__html: badge.htmlCode') || source.includes('__html: settings.footerEnamadHtml')) {
    throw new Error('v30.10.0 raw footer HTML still present');
  }
  return source;
});

console.log(changed.length ? `v30.10.0 security hardening applied: ${changed.join(', ')}` : 'v30.10.0 security hardening already satisfied.');
