import fs from 'node:fs';

const read = file => fs.readFileSync(file, 'utf8');
const write = (file, content) => fs.writeFileSync(file, content, 'utf8');
const fail = label => { throw new Error(`v30.10.14 marker missing: ${label}`); };

// The admin setting `mobileFooterColumns` must drive the storefront renderer.
{
  const file = 'src/components/layout/Footer.tsx';
  let source = read(file);
  const oldValue = "['--footer-cols-mobile' as any]: settings.footerGridColumnsMobile || 2,";
  const newValue = "['--footer-cols-mobile' as any]: settings.mobileFooterColumns || settings.footerGridColumnsMobile || 2,";
  if (!source.includes(newValue)) {
    if (!source.includes(oldValue)) fail('Footer mobile columns');
    source = source.replace(oldValue, newValue);
  }
  write(file, source);
}

// Runtime contract findings must describe the prepared production source, not the
// untouched canonical checkout that exists beside the immutable bundle.
{
  const file = 'src/server/audit/site-audit.ts';
  let source = read(file);
  source = source.replace("const ENGINE_VERSION = '2.2.0';", "const ENGINE_VERSION = '2.3.0';");

  if (!source.includes('function reconcilePreparedRuntimeContracts(')) {
    const helper = `\nfunction reconcilePreparedRuntimeContracts(findings: AuditFinding[], pipelineTrace: any) {\n  const contracts = pipelineTrace?.prepared?.contracts;\n  if (!contracts || typeof contracts !== 'object') return;\n  const rules: Array<{ key: string; id: string; title: string; category: AuditFinding['category']; severity: AuditFinding['severity']; status: AuditFinding['status']; summary: string; evidence: string[]; recommendation?: string }> = [\n    { key: 'richTextPageRenderer', id: 'rich-text:page-section-rendered-as-plain-text', title: 'Rich Text سکشن به‌صورت متن ساده Render می‌شود', category: 'ui', severity: 'error', status: 'broken', summary: 'خروجی prepared هنوز محتوای Rich Text سکشن را با renderer امن HTML نمایش نمی‌دهد.', evidence: ['prepared:src/components/page/PageView.tsx'], recommendation: 'RichTextContent در خروجی prepared فعال شود.' },\n    { key: 'richTextCssParity', id: 'rich-text:storefront-css-parity-missing', title: 'CSS خروجی Rich Text با ادیتور parity کامل ندارد', category: 'ui', severity: 'warning', status: 'partial', summary: 'خروجی prepared قواعد heading/list/blockquote را کامل ندارد.', evidence: ['prepared:src/components/common/RichTextEditor.css'], recommendation: 'قواعد .rich-text-content در خروجی prepared فعال شوند.' },\n    { key: 'richTextRuntimeProbe', id: 'rich-text:runtime-probe-marker-missing', title: 'Rich Text برای computed-style audit علامت‌گذاری نشده', category: 'contract', severity: 'warning', status: 'partial', summary: 'خروجی prepared marker لازم برای computed-style audit را ندارد.', evidence: ['prepared:src/components/common/RichTextContent.tsx'] },\n    { key: 'liveEditorSynchronousSnapshot', id: 'live-editor:stale-page-snapshot', title: 'Live Editor ممکن است snapshot قدیمی را ذخیره کند', category: 'contract', severity: 'error', status: 'conflict', summary: 'خروجی prepared مسیر ذخیره را به snapshot همگام متصل نکرده است.', evidence: ['prepared:src/context/StoreContext.tsx'], recommendation: 'pagesRef همگام در save path استفاده شود.' },\n    { key: 'liveEditorPersistenceRoundtrip', id: 'live-editor:persistence-roundtrip-unverified', title: 'ذخیره Live Editor round-trip DB را تأیید نمی‌کند', category: 'contract', severity: 'error', status: 'partial', summary: 'خروجی prepared write/readback و مقایسه payload را کامل نکرده است.', evidence: ['prepared:src/context/StoreContext.tsx', 'prepared:src/server/routes/cms.ts'], recommendation: 'write/readback DB و مقایسه payload فعال شود.' }\n  ];\n\n  for (const rule of rules) {\n    const value = contracts[rule.key];\n    if (value === true) {\n      for (let i = findings.length - 1; i >= 0; i -= 1) {\n        if (findings[i]?.id === rule.id) findings.splice(i, 1);\n      }\n      continue;\n    }\n    if (value === false && !findings.some(item => item.id === rule.id)) {\n      findings.push({ id: rule.id, title: rule.title, category: rule.category, severity: rule.severity, status: rule.status, summary: rule.summary, evidence: rule.evidence, recommendation: rule.recommendation });\n    }\n  }\n}\n`;
    const anchor = '\nfunction summaryFor';
    if (!source.includes(anchor)) fail('Site Auditor summary anchor');
    source = source.replace(anchor, helper + anchor);
  }

  if (!source.includes('reconcilePreparedRuntimeContracts(findings, pipelineTrace);')) {
    const anchor = '  scanRichTextAndLiveEditorContracts(files, findings);';
    if (!source.includes(anchor)) fail('Site Auditor rich/live scan call');
    source = source.replace(anchor, `${anchor}\n  reconcilePreparedRuntimeContracts(findings, pipelineTrace);`);
  }

  if (!source.includes("const ENGINE_VERSION = '2.3.0';")) fail('Site Auditor 2.3 engine version');
  write(file, source);
}

console.log('v30.10.14 prepared-runtime contracts + footer mobile-column contract applied.');