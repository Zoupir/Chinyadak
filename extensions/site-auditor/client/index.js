const STATE_KEY = '__yadakSiteAuditorState';
const AUDITOR_VERSION = '2.3.0';
const CRAWL_HTTP_PATHS = ['/', '/cart', '/checkout', '/wishlist', '/account', '/admin'];
const CRAWL_BROWSER_PATHS = ['/', '/cart', '/checkout', '/wishlist', '/account'];

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[ch]));
}

function severityLabel(severity) {
  return ({ critical: 'بحرانی', error: 'خطا', warning: 'هشدار', info: 'اطلاعات' })[severity] || severity;
}

function statusLabel(status) {
  return ({ working: 'سالم', partial: 'ناقص', broken: 'خراب', conflict: 'تداخل', unknown: 'نیازمند بررسی' })[status] || status;
}

function downloadJson(report) {
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `site-audit-v${AUDITOR_VERSION}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function downloadText(report) {
  const lines = [
    `Site Audit v${AUDITOR_VERSION}`,
    `Generated: ${report.generatedAt}`,
    `Core: ${report.coreVersion}`,
    `Commit: ${report.commit || '-'}`,
    '',
    `Summary: total=${report.summary.total}, critical=${report.summary.critical}, errors=${report.summary.errors}, warnings=${report.summary.warnings}, conflicts=${report.summary.conflicts}, broken=${report.summary.broken}, partial=${report.summary.partial}`,
    ''
  ];
  for (const item of report.findings || []) {
    lines.push(`[${severityLabel(item.severity)} / ${statusLabel(item.status)}] ${item.title}`);
    lines.push(item.summary || '');
    if (item.likelyCause) lines.push(`علت محتمل: ${item.likelyCause}`);
    if (item.evidence?.length) lines.push(`شواهد: ${item.evidence.join(' | ')}`);
    if (item.recommendation) lines.push(`پیشنهاد: ${item.recommendation}`);
    lines.push('');
  }
  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `site-audit-v${AUDITOR_VERSION}-${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function summarizeDocument(doc, url, extra = {}) {
  const root = doc.querySelector('#root');
  const bodyText = (doc.body?.innerText || '').trim();
  const viewport = doc.defaultView?.innerWidth || 0;
  const documentWidth = doc.documentElement?.scrollWidth || 0;
  const brokenImages = [...doc.images]
    .filter(img => img.complete && img.naturalWidth === 0)
    .slice(0, 50)
    .map(img => img.currentSrc || img.src);
  const emptyAnchors = [...doc.querySelectorAll('a')]
    .filter(a => !a.getAttribute('href') || a.getAttribute('href') === '#')
    .slice(0, 50)
    .map(a => (a.textContent || '').trim());
  const seen = new Set();
  const duplicateIds = new Set();
  doc.querySelectorAll('[id]').forEach(el => {
    if (seen.has(el.id)) duplicateIds.add(el.id);
    else seen.add(el.id);
  });
  return {
    url,
    title: doc.title,
    horizontalOverflow: viewport > 0 && documentWidth > viewport + 1,
    brokenImages,
    emptyAnchors,
    duplicateIds: [...duplicateIds].slice(0, 50),
    textLength: bodyText.length,
    forms: doc.forms?.length || 0,
    buttons: doc.querySelectorAll('button').length,
    links: doc.querySelectorAll('a').length,
    rootChildren: root?.childElementCount || 0,
    contentRendering: doc.documentElement?.dataset?.contentRendering || '',
    jsRole: root?.getAttribute('data-js-role') || '',
    ...extra
  };
}

function normalizeComparableStyle(doc, property, requested) {
  const raw = String(requested || '').trim();
  if (!raw) return '';
  if (property === 'font-weight') {
    if (raw === 'bold') return '700';
    if (raw === 'normal') return '400';
    return raw;
  }
  if (property === 'color' || property === 'background-color') {
    const probe = doc.createElement('span');
    probe.style.position = 'fixed';
    probe.style.visibility = 'hidden';
    probe.style.setProperty(property, raw);
    doc.body.appendChild(probe);
    const normalized = doc.defaultView?.getComputedStyle(probe).getPropertyValue(property).trim() || raw;
    probe.remove();
    return normalized;
  }
  return raw;
}

function collectRichTextStyleConflicts(doc, pageUrl) {
  const conflicts = [];
  const properties = ['text-align', 'font-weight', 'color', 'background-color', 'font-size', 'line-height'];
  const view = doc.defaultView;
  if (!view) return conflicts;
  const nodes = [...doc.querySelectorAll('[data-rich-text-content="1"] [style]')].slice(0, 150);
  for (const node of nodes) {
    const computed = view.getComputedStyle(node);
    for (const property of properties) {
      const requestedRaw = node.style.getPropertyValue(property).trim();
      if (!requestedRaw) continue;
      if ((property === 'font-size' || property === 'line-height') && !/^-?\d+(?:\.\d+)?px$/i.test(requestedRaw)) continue;
      const requested = normalizeComparableStyle(doc, property, requestedRaw);
      let actual = computed.getPropertyValue(property).trim();
      if (property === 'font-weight') actual = normalizeComparableStyle(doc, property, actual);
      if (requested && actual && requested !== actual) {
        conflicts.push({
          url: pageUrl,
          tag: node.tagName.toLowerCase(),
          property,
          requested,
          actual,
          text: (node.textContent || '').trim().slice(0, 120)
        });
        if (conflicts.length >= 50) return conflicts;
      }
    }
  }
  return conflicts;
}

async function collectBrowserSignals() {
  const state = window[STATE_KEY] || { errors: [], rejections: [], fetchFailures: [] };
  return {
    ...summarizeDocument(document, location.href),
    readyState: document.readyState,
    consoleErrors: state.errors.slice(-50),
    unhandledRejections: state.rejections.slice(-50),
    fetchFailures: state.fetchFailures.slice(-50),
    richTextStyleConflicts: collectRichTextStyleConflicts(document, location.href)
  };
}

function browserFindings(signals) {
  const out = [];
  const add = (id, title, severity, status, summary, evidence, recommendation) => out.push({ id, title, category: 'runtime', severity, status, summary, evidence, recommendation });
  if (signals.horizontalOverflow) add('browser-horizontal-overflow', 'بیرون‌زدگی افقی در صفحه فعلی', 'warning', 'partial', 'عرض محتوای صفحه از viewport بیشتر است.', [signals.url], 'CSS responsive و عناصر fixed/absolute بررسی شوند.');
  if (signals.brokenImages.length) add('browser-broken-images', 'تصاویر خراب در صفحه فعلی', 'error', 'broken', `${signals.brokenImages.length} تصویر لود نشده است.`, signals.brokenImages, 'مسیر رسانه، دسترسی فایل و URL تولیدشده بررسی شود.');
  if (signals.duplicateIds.length) add('browser-duplicate-ids', 'ID تکراری در DOM', 'warning', 'conflict', 'ID تکراری می‌تواند selectorها، labelها و اسکریپت‌های UI را به عنصر اشتباه متصل کند.', signals.duplicateIds, 'IDها یکتا شوند.');
  if (signals.consoleErrors.length) add('browser-console-errors', 'خطاهای JavaScript در مرورگر', 'error', 'broken', `${signals.consoleErrors.length} خطای runtime ثبت شده است.`, signals.consoleErrors.map(x => String(x).slice(0, 500)), 'Stack trace و component مربوطه بررسی شود.');
  if (signals.unhandledRejections.length) add('browser-unhandled-rejections', 'Promiseهای مدیریت‌نشده', 'error', 'partial', `${signals.unhandledRejections.length} rejection بدون handler ثبت شده است.`, signals.unhandledRejections.map(x => String(x).slice(0, 500)), 'Promise chain باید catch و feedback قابل مشاهده داشته باشد.');
  if (signals.fetchFailures.length) add('browser-fetch-failures', 'فراخوانی‌های API ناموفق در مرورگر', 'error', 'partial', `${signals.fetchFailures.length} درخواست HTTP ناموفق ثبت شده است.`, signals.fetchFailures.slice(-50), 'status code، endpoint و contract پاسخ با UI تطبیق داده شود.');
  if (signals.richTextStyleConflicts?.length) add('rich-text:computed-style-conflict', 'استایل Rich Text در CSS نهایی override شده', 'warning', 'conflict', `${signals.richTextStyleConflicts.length} property بعد از cascade با مقدار inline درخواستی یکسان نیست.`, signals.richTextStyleConflicts.map(item => `${item.url} | ${item.tag} | ${item.property}: requested=${item.requested}, actual=${item.actual} | ${item.text}`), 'selector و specificity قالب برای .rich-text-content بررسی شود.');
  return out;
}

function installCollectors() {
  if (window[STATE_KEY]) return;
  const state = window[STATE_KEY] = { errors: [], rejections: [], fetchFailures: [] };
  window.addEventListener('error', event => {
    state.errors.push(`${event.message || 'error'} @ ${event.filename || location.href}:${event.lineno || 0}:${event.colno || 0}`);
  });
  window.addEventListener('unhandledrejection', event => {
    state.rejections.push(String(event.reason?.stack || event.reason || 'unhandled rejection'));
  });
  const nativeFetch = window.fetch.bind(window);
  window.fetch = async (...args) => {
    try {
      const response = await nativeFetch(...args);
      if (!response.ok) {
        const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
        if (!String(url || '').includes('/api/support/client-event')) state.fetchFailures.push(`${response.status} ${url || ''}`);
      }
      return response;
    } catch (error) {
      const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
      state.fetchFailures.push(`EXCEPTION ${url || ''} ${String(error)}`);
      throw error;
    }
  };
}

async function probeHttp(pathname) {
  const started = performance.now();
  try {
    const response = await fetch(pathname, { credentials: 'same-origin', cache: 'no-store', headers: { 'x-site-auditor-probe': '1' } });
    const text = await response.text();
    const parsed = new DOMParser().parseFromString(text, 'text/html');
    return {
      path: pathname,
      status: response.status,
      ok: response.ok,
      finalUrl: response.url,
      contentType: response.headers.get('content-type') || '',
      bytes: new TextEncoder().encode(text).byteLength,
      title: parsed.title || '',
      durationMs: Math.round(performance.now() - started)
    };
  } catch (error) {
    return { path: pathname, status: 0, ok: false, finalUrl: '', contentType: '', bytes: 0, title: '', durationMs: Math.round(performance.now() - started), error: String(error) };
  }
}

async function probeRenderedPage(pathname, timeoutMs = 8000) {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.tabIndex = -1;
  iframe.style.position = 'fixed';
  iframe.style.width = '1280px';
  iframe.style.height = '900px';
  iframe.style.left = '-100000px';
  iframe.style.top = '0';
  iframe.style.visibility = 'hidden';
  iframe.style.pointerEvents = 'none';
  const started = performance.now();

  const result = await new Promise(resolve => {
    let settled = false;
    const finish = payload => {
      if (settled) return;
      settled = true;
      resolve(payload);
    };
    const timer = window.setTimeout(() => {
      try {
        const doc = iframe.contentDocument;
        if (!doc) return finish({ path: pathname, url: new URL(pathname, location.origin).href, textLength: 0, timedOut: true, probeError: 'iframe document unavailable' });
        finish({ path: pathname, ...summarizeDocument(doc, iframe.contentWindow?.location?.href || new URL(pathname, location.origin).href, { timedOut: true, richTextStyleConflicts: collectRichTextStyleConflicts(doc, iframe.contentWindow?.location?.href || pathname) }) });
      } catch (error) {
        finish({ path: pathname, url: new URL(pathname, location.origin).href, textLength: 0, timedOut: true, probeError: String(error) });
      }
    }, timeoutMs);

    const poll = () => {
      if (settled) return;
      try {
        const doc = iframe.contentDocument;
        const win = iframe.contentWindow;
        if (!doc || !win) return window.setTimeout(poll, 100);
        const root = doc.querySelector('#root');
        const textLength = (doc.body?.innerText || '').trim().length;
        const hasMountedRoot = Boolean(root && root.childElementCount > 0);
        const publicHydrated = doc.documentElement?.dataset?.contentRendering === 'server-hydrated' || root?.getAttribute('data-js-role') === 'hydration-only';
        if (doc.readyState === 'complete' && (textLength > 0 || hasMountedRoot || publicHydrated)) {
          window.clearTimeout(timer);
          const pageUrl = win.location.href;
          finish({ path: pathname, ...summarizeDocument(doc, pageUrl, { timedOut: false, probeDurationMs: Math.round(performance.now() - started), richTextStyleConflicts: collectRichTextStyleConflicts(doc, pageUrl) }) });
          return;
        }
      } catch (error) {
        window.clearTimeout(timer);
        finish({ path: pathname, url: new URL(pathname, location.origin).href, textLength: 0, timedOut: false, probeError: String(error) });
        return;
      }
      window.setTimeout(poll, 100);
    };

    iframe.addEventListener('load', poll, { once: true });
    iframe.addEventListener('error', () => {
      window.clearTimeout(timer);
      finish({ path: pathname, url: new URL(pathname, location.origin).href, textLength: 0, timedOut: false, probeError: 'iframe load failed' });
    }, { once: true });
    iframe.src = pathname;
    document.body.appendChild(iframe);
  });

  iframe.remove();
  return result;
}

async function runCrawl() {
  const [http, pages] = await Promise.all([
    Promise.all(CRAWL_HTTP_PATHS.map(pathname => probeHttp(pathname))),
    Promise.all(CRAWL_BROWSER_PATHS.map(pathname => probeRenderedPage(pathname)))
  ]);
  return { paths: CRAWL_HTTP_PATHS, http, pages };
}

function crawlFindings(crawl) {
  const out = [];
  const add = (id, title, severity, status, summary, evidence, recommendation) => out.push({ id, title, category: 'runtime', severity, status, summary, evidence, recommendation });
  for (const result of crawl.http || []) {
    if (!result.ok) add(`crawl-http:${result.path}`, `پاسخ HTTP ناموفق در ${result.path}`, 'error', 'broken', `HTTP ${result.status || 'network error'} دریافت شد.`, [result.finalUrl || result.path, result.error || ''], 'route، middleware و log سرور بررسی شود.');
  }
  for (const page of crawl.pages || []) {
    if (page.probeError) {
      add(`crawl-probe:${page.path}`, `ممیزی مرورگر برای ${page.path} کامل نشد`, 'warning', 'unknown', 'probe مرورگر نتوانست DOM این مسیر را با اطمینان ارزیابی کند.', [page.url || page.path, page.probeError], 'مسیر به‌صورت دستی و با Browser E2E بررسی شود.');
      continue;
    }
    if (page.timedOut && Number(page.textLength || 0) === 0) {
      add(`crawl-empty:${page.path}`, `محتوای خالی بعد از انتظار کامل در ${page.path}`, 'error', 'broken', 'صفحه client-rendered پس از ۸ ثانیه هنوز متن قابل مشاهده ندارد.', [page.url || page.path, `rootChildren=${page.rootChildren || 0}`, `ready=${page.contentRendering || page.jsRole || 'client'}`], 'mount شدن React، dynamic import، route condition و loading/error state بررسی شود.');
    }
    if (page.horizontalOverflow) add(`crawl-overflow:${page.path}`, `بیرون‌زدگی افقی در ${page.path}`, 'warning', 'partial', 'عرض DOM از viewport تست بیشتر است.', [page.url || page.path], 'responsive CSS و عناصر absolute/fixed بررسی شوند.');
    if (page.brokenImages?.length) add(`crawl-broken-images:${page.path}`, `تصاویر خراب در ${page.path}`, 'warning', 'partial', `${page.brokenImages.length} تصویر با naturalWidth=0 پیدا شد.`, page.brokenImages, 'URL و موجودیت media بررسی شود.');
    if (page.richTextStyleConflicts?.length) add(`crawl-rich-text-style:${page.path}`, `تداخل computed style در Rich Text مسیر ${page.path}`, 'warning', 'conflict', `${page.richTextStyleConflicts.length} property Rich Text توسط cascade تغییر کرده است.`, page.richTextStyleConflicts.map(item => `${item.property}: requested=${item.requested}, actual=${item.actual} | ${item.text}`), 'specificity قالب و قواعد .rich-text-content بررسی شود.');
  }
  return out;
}

function recomputeSummary(report) {
  report.summary = {
    total: report.findings.length,
    critical: report.findings.filter(x => x.severity === 'critical').length,
    errors: report.findings.filter(x => x.severity === 'error').length,
    warnings: report.findings.filter(x => x.severity === 'warning').length,
    conflicts: report.findings.filter(x => x.status === 'conflict').length,
    broken: report.findings.filter(x => x.status === 'broken').length,
    partial: report.findings.filter(x => x.status === 'partial').length
  };
}

function render(target, report, loading = false, error = '') {
  if (!target) return;
  if (loading) {
    target.innerHTML = `<div class="ysa-loading">در حال ممیزی سورس، API و رفتار واقعی صفحات…</div>`;
    return;
  }
  if (error) {
    target.innerHTML = `<div class="ysa-error">${escapeHtml(error)}</div>`;
    return;
  }
  const s = report.summary;
  const weight = { critical: 0, error: 1, warning: 2, info: 3 };
  const findings = [...(report.findings || [])].sort((a, b) => (weight[a.severity] ?? 9) - (weight[b.severity] ?? 9));
  target.innerHTML = `
    <div class="ysa-toolbar">
      <div>
        <h2>ممیزی جامع سایت</h2>
        <p>Auditor ${escapeHtml(report.auditorVersion || AUDITOR_VERSION)} · Core ${escapeHtml(report.coreVersion)} · ${escapeHtml(report.commit || 'commit نامشخص')} · ${escapeHtml(report.scannedFiles || 0)} فایل · ${escapeHtml(report.routeInventorySize || 0)} Route</p>
      </div>
      <div class="ysa-actions">
        <button data-ysa-run>اجرای دوباره</button>
        <button data-ysa-json>خروجی JSON</button>
        <button data-ysa-text>گزارش متنی</button>
      </div>
    </div>
    <div class="ysa-grid">
      <div><strong>${s.total}</strong><span>کل موارد</span></div>
      <div><strong>${s.critical}</strong><span>بحرانی</span></div>
      <div><strong>${s.errors}</strong><span>خطا</span></div>
      <div><strong>${s.warnings}</strong><span>هشدار</span></div>
      <div><strong>${s.conflicts}</strong><span>تداخل</span></div>
      <div><strong>${s.partial}</strong><span>ناقص</span></div>
    </div>
    <div class="ysa-findings">
      ${findings.length ? findings.map(item => `
        <article class="ysa-card ysa-${escapeHtml(item.severity)}">
          <div class="ysa-card-head"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(severityLabel(item.severity))} · ${escapeHtml(statusLabel(item.status))}</span></div>
          <p>${escapeHtml(item.summary)}</p>
          ${item.likelyCause ? `<div><b>علت محتمل:</b> ${escapeHtml(item.likelyCause)}</div>` : ''}
          ${item.evidence?.length ? `<details><summary>شواهد (${item.evidence.length})</summary><pre>${escapeHtml(item.evidence.join('\n'))}</pre></details>` : ''}
          ${item.recommendation ? `<div class="ysa-rec"><b>پیشنهاد اصلاح:</b> ${escapeHtml(item.recommendation)}</div>` : ''}
        </article>`).join('') : '<div class="ysa-ok">مورد مشکوکی در ممیزی فعلی پیدا نشد.</div>'}
    </div>`;
  target.querySelector('[data-ysa-run]')?.addEventListener('click', () => runAudit(target));
  target.querySelector('[data-ysa-json]')?.addEventListener('click', () => downloadJson(report));
  target.querySelector('[data-ysa-text]')?.addEventListener('click', () => downloadText(report));
}

async function runAudit(target) {
  render(target, null, true);
  try {
    const [serverResponse, browser, crawl] = await Promise.all([
      fetch('/api/audit/site-audit', { credentials: 'same-origin', cache: 'no-store' }),
      collectBrowserSignals(),
      runCrawl()
    ]);
    if (!serverResponse.ok) throw new Error(`Audit API failed: HTTP ${serverResponse.status}`);
    const report = await serverResponse.json();
    report.auditorVersion = AUDITOR_VERSION;
    report.browser = browser;
    report.crawl = crawl;
    report.findings = [...(report.findings || []), ...browserFindings(browser), ...crawlFindings(crawl)];
    recomputeSummary(report);
    window.__YADAK_SITE_AUDIT_REPORT__ = report;
    render(target, report);
  } catch (error) {
    render(target, null, false, `ممیزی اجرا نشد: ${error?.message || error}`);
  }
}

export function activate(api) {
  installCollectors();
  api.registerAdminMenu({
    id: 'site-auditor',
    label: 'ممیزی و تشخیص تداخل',
    order: 930,
    render(container) {
      container.classList.add('ysa-root');
      runAudit(container);
    }
  });
}