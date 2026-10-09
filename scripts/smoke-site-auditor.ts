import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { runSiteAudit } from '../src/server/audit/site-audit.ts';

const report = runSiteAudit();
assert.equal(typeof report.generatedAt, 'string');
assert.equal(typeof report.coreVersion, 'string');
assert.ok(Array.isArray(report.findings));
assert.equal(report.summary.total, report.findings.length);
for (const finding of report.findings) {
  assert.equal(typeof finding.id, 'string');
  assert.equal(typeof finding.title, 'string');
  assert.ok(Array.isArray(finding.evidence));
}

const pluginRoot = path.join(process.cwd(), 'extensions/site-auditor');
assert.ok(fs.existsSync(path.join(pluginRoot, 'plugin.json')));
assert.ok(fs.existsSync(path.join(pluginRoot, 'client/index.js')));
assert.ok(fs.existsSync(path.join(pluginRoot, 'assets/auditor.css')));
const manifest = JSON.parse(fs.readFileSync(path.join(pluginRoot, 'plugin.json'), 'utf8'));
assert.equal(manifest.id, 'site-auditor');
assert.equal(manifest.type, 'plugin');
assert.equal(manifest.clientEntry, 'client/index.js');
console.log(`Site Auditor smoke passed with ${report.findings.length} findings.`);
