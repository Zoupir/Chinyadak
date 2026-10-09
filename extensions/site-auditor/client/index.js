const STATE_KEY = '__yadakSiteAuditorState';

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
  a.download = `site-audit-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function downloadText(report) {
  const lines = [
    `Site Audit`,
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
  a.download = `site-audit-${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function collectBrowserSignals() {
  const state = window[STATE_KEY] || { errors: [], rejections: [], fetchFailures: [] };
  const current = {
    url: location.href,
    title: document.title,
    readyState: document.readyState,
    horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
    brokenImages: [...document.images].filter(img => img.complete && img.naturalWidth === 0).slice(0, 50).map(img => img.currentSrc || img.src),
    emptyAnchors: [...document.querySelectorAll('a')].filter(a => !a.getAttribute('href') || a.getAttribute('href') === '#').slice(0, 50).map(a => (a.textContent || '').trim()),
    duplicateIds: (() => {
      const seen = new Set(); const dup = new Set();
      document.querySelectorAll('[id]').forEach(el => { if (seen.has(el.id)) dup.add(el.id); else seen.add(el.id); });
      return [...dup].slice(0, 50);
    })(),
    consoleErrors: state.errors.slice(-50),
    unhandledRejections: state.rejections.slice(-50),
    fetchFailures: state.fetchFailures.slice(-50)
  };
  return current;
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

function render(target, report, loading = false, error = '') {
  if (!target) return;
  if (loading) {
    target.innerHTML = `<div class="ysa-loading">در حال ممیزی سورس، API و رفتار فعلی سایت…</div>`;
    return;
  }
  if (error) {
    target.innerHTML = `<div class="ysa-error">${escapeHtml(error)}</div>`;
    return;
  }
  const s = report.summary;
  const findings = [...(report.findings || [])].sort((a, b) => ({ critical: 0, error: 1, warning: 2, info: 3 }[a.severity] - ({ critical: 0, error: 1, warning: 2, info: 3 }[b.severity]));
  target.innerHTML = `
    <div class="ysa-toolbar">
      <div>
        <h2>ممیزی جامع سایت</h2>
        <p>Core ${escapeHtml(report.coreVersion)} · ${escapeHtml(report.commit || 'commit نامشخص')}</p>
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
    const [serverResponse, browser] = await Promise.all([
      fetch('/api/audit/site-audit', { credentials: 'same-origin', cache: 'no-store' }),
      collectBrowserSignals()
    ]);
    if (!serverResponse.ok) throw new Error(`Audit API failed: HTTP ${serverResponse.status}`);
    const report = await serverResponse.json();
    const runtime = browserFindings(browser);
    report.browser = browser;
    report.findings = [...(report.findings || []), ...runtime];
    report.summary = {
      total: report.findings.length,
      critical: report.findings.filter(x => x.severity === 'critical').length,
      errors: report.findings.filter(x => x.severity === 'error').length,
      warnings: report.findings.filter(x => x.severity === 'warning').length,
      conflicts: report.findings.filter(x => x.status === 'conflict').length,
      broken: report.findings.filter(x => x.status === 'broken').length,
      partial: report.findings.filter(x => x.status === 'partial').length
    };
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
    icon: 'activity',
    order: 930,
    render(container) {
      container.classList.add('ysa-root');
      runAudit(container);
    }
  });
}
