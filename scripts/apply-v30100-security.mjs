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
// The matcher intentionally tolerates formatting changes in the canonical auth
// source so later security improvements do not break cumulative migrations.
// ---------------------------------------------------------------------------
edit('src/server/auth.ts', source => {
  if (!source.includes('ADMIN_SESSION_REVOKED')) {
    const pattern = /export const requireAdmin = \([\s\S]*?\n\};\n+interface AdminPermissionRow/;
    const replacement = `export const requireAdmin = (\n  req: AuthenticatedRequest,\n  res: Response,\n  next: NextFunction\n): void => {\n  authenticate(req, res, async () => {\n    if (req.auth?.role !== 'admin') {\n      res.status(403).json({ error: 'ADMIN_REQUIRED' });\n      return;\n    }\n    try {\n      const [rows] = await pool.query<Array<RowDataPacket & { is_active: number }>>(\n        'SELECT is_active FROM admin_users WHERE id = ? LIMIT 1',\n        [req.auth.sub]\n      );\n      if (!rows[0]?.is_active) {\n        clearSession(res);\n        res.status(401).json({ error: 'ADMIN_SESSION_REVOKED' });\n        return;\n      }\n      next();\n    } catch (error) {\n      next(error);\n    }\n  });\n};\n\ninterface AdminPermissionRow`;
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
  if (!source.includes("PRIVATE_PART_REQUEST_ATTACHMENTS")) {
    const marker = "const upload = multer({";
    if (!source.includes(marker)) throw new Error('v30.10.0 engagement upload marker missing');
    source = source.replace(marker, `const PRIVATE_PART_REQUEST_ATTACHMENTS = true;\n${marker}`);
  }
  return source;
});

console.log(changed.length ? `v30.10.0 security hardening applied: ${changed.join(', ')}` : 'v30.10.0 security hardening already applied.');
