#!/usr/bin/env node

/**
 * Multi-site E2E test runner
 * Runs autofill tests across multiple job application sites and generates a report
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { runGreenhouseTest } from './greenhouse.test.ts';
import type { TestResult } from './greenhouse.test.ts';
import { runLeverTest } from './lever.test.ts';
import { runWorkableTest } from './workable.test.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPORT_PATH = path.resolve(__dirname, 'REPORT.md');

async function main() {
  console.log('=== JobFlow Autofill E2E Test Suite ===\n');

  const results: TestResult[] = [];

  const tests: Array<{ name: string; run: () => Promise<TestResult> }> = [
    { name: 'Greenhouse', run: runGreenhouseTest },
    { name: 'Lever', run: runLeverTest },
    { name: 'Workable', run: runWorkableTest },
  ];

  for (const test of tests) {
    console.log(`\n--- Running ${test.name} test ---`);
    try {
      const result = await test.run();
      results.push(result);
      console.log(`  ${test.name}: ${result.success ? 'PASS' : 'FAIL'} (${result.fieldsFilled}/${result.fieldsDetected.length} fields filled)`);
      if (result.errors.length > 0) {
        console.log(`  Errors: ${result.errors.join('; ')}`);
      }
    } catch (err: any) {
      console.log(`  ${test.name}: ERROR - ${err.message}`);
      results.push({
        site: test.name,
        url: '',
        success: false,
        fieldsDetected: [],
        fieldsFilled: 0,
        fieldsMissed: [],
        screenshotBefore: '',
        screenshotAfter: '',
        errors: [err.message || String(err)],
        verifications: {},
      });
    }
  }

  const report = generateReport(results);
  fs.writeFileSync(REPORT_PATH, report);
  console.log(`\nReport written to ${REPORT_PATH}`);
}

function generateReport(results: TestResult[]): string {
  const totalDetected = results.reduce((sum, r) => sum + r.fieldsDetected.length, 0);
  const totalFilled = results.reduce((sum, r) => sum + r.fieldsFilled, 0);
  const totalMissed = results.reduce((sum, r) => sum + r.fieldsMissed.length, 0);
  const successRate = totalDetected > 0 ? ((totalFilled / totalDetected) * 100).toFixed(1) : '0.0';
  const sitesSucceeded = results.filter(r => r.success).length;

  let md = `# JobFlow Autofill - E2E Test Report

**Date:** ${new Date().toISOString().split('T')[0]}
**Test Profile:** Jane Doe (jane.doe@test.com)

## Summary

| Metric | Value |
|--------|-------|
| Sites Tested | ${results.length} |
| Sites with Successful Fill | ${sitesSucceeded}/${results.length} |
| Total Fields Detected | ${totalDetected} |
| Total Fields Filled | ${totalFilled} |
| Total Fields Missed | ${totalMissed} |
| Overall Success Rate | ${successRate}% |

---

`;

  for (const r of results) {
    const siteRate = r.fieldsDetected.length > 0
      ? ((r.fieldsFilled / r.fieldsDetected.length) * 100).toFixed(1)
      : '0.0';

    md += `## ${r.site}

**Status:** ${r.success ? 'PASS' : 'FAIL'}
**URL:** ${r.url || 'N/A'}
**Fields Detected:** ${r.fieldsDetected.length}
**Fields Filled:** ${r.fieldsFilled}
**Fields Missed:** ${r.fieldsMissed.length}
**Fill Rate:** ${siteRate}%

`;

    if (r.fieldsDetected.length > 0) {
      md += `### Fields Detected

| Name/ID | Type | Label | Mapping | Status |
|---------|------|-------|---------|--------|
`;
      for (const f of r.fieldsDetected) {
        const isFilled = f.suggestedMapping && !r.fieldsMissed.find((m: any) => m.selector === f.selector);
        md += `| ${f.name || f.selector} | ${f.type} | ${(f.label || '').substring(0, 40)} | ${f.suggestedMapping || '-'} | ${isFilled ? 'Filled' : 'Missed'} |\n`;
      }
      md += '\n';
    }

    if (Object.keys(r.verifications).length > 0) {
      md += `### Verification Results

| Field | Expected | Actual | Pass |
|-------|----------|--------|------|
`;
      for (const [field, v] of Object.entries(r.verifications)) {
        md += `| ${field} | ${v.expected} | ${v.actual} | ${v.passed ? 'YES' : 'NO'} |\n`;
      }
      md += '\n';
    }

    if (r.errors.length > 0) {
      md += `### Errors

${r.errors.map(e => `- ${e}`).join('\n')}

`;
    }

    md += `### Screenshots

`;
    if (r.screenshotBefore) {
      md += `- Before: \`${path.relative(path.dirname(REPORT_PATH), r.screenshotBefore)}\`\n`;
    }
    if (r.screenshotAfter) {
      md += `- After: \`${path.relative(path.dirname(REPORT_PATH), r.screenshotAfter)}\`\n`;
    }
    md += '\n---\n\n';
  }

  return md;
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
