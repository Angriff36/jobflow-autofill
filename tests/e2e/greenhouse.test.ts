/**
 * E2E Test: Greenhouse job application autofill
 */

import {
  launchBrowserWithExtension,
  setTestProfile,
  detectAndFillFields,
  takeScreenshot,
  TEST_PROFILE,
} from './setup.ts';

export interface TestResult {
  site: string;
  url: string;
  success: boolean;
  fieldsDetected: any[];
  fieldsFilled: number;
  fieldsMissed: any[];
  screenshotBefore: string;
  screenshotAfter: string;
  errors: string[];
  verifications: Record<string, { expected: string; actual: string; passed: boolean }>;
}

export async function runGreenhouseTest(): Promise<TestResult> {
  const result: TestResult = {
    site: 'Greenhouse',
    url: '',
    success: false,
    fieldsDetected: [],
    fieldsFilled: 0,
    fieldsMissed: [],
    screenshotBefore: '',
    screenshotAfter: '',
    errors: [],
    verifications: {},
  };

  let context: any = null;

  try {
    const launch = await launchBrowserWithExtension();
    context = launch.context;
    await setTestProfile(context, launch.extensionId);

    const page = await context.newPage();
    await page.goto('https://job-boards.greenhouse.io/anthropic', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    await page.waitForTimeout(3000);

    // Find first job listing link
    const jobLink = await page.$('a[href*="/anthropic/jobs/"]');
    if (!jobLink) {
      const anyLink = await page.$('.opening a, .job-post a, [data-mapped="true"] a, a[href*="jobs"]');
      if (!anyLink) {
        result.errors.push('No job listings found on Greenhouse board');
        result.screenshotBefore = await takeScreenshot(page, 'greenhouse-no-jobs');
        return result;
      }
      await anyLink.click();
    } else {
      await jobLink.click();
    }

    await page.waitForTimeout(3000);
    result.url = page.url();

    // Look for apply button
    const applyButton = await page.$('#apply_button, a[href="#application"], .btn-apply, [data-test="apply-button"]');
    if (applyButton) {
      await applyButton.click();
      await page.waitForTimeout(2000);
    }

    await page.waitForTimeout(2000);

    // Take before screenshot
    result.screenshotBefore = await takeScreenshot(page, 'greenhouse-before');

    // Run autofill
    const fillResult = await detectAndFillFields(page);
    result.fieldsDetected = fillResult.fieldsDetected;
    result.fieldsFilled = fillResult.fieldsFilled;
    result.fieldsMissed = fillResult.fieldsMissed;
    result.errors.push(...fillResult.errors);

    // Take after screenshot
    result.screenshotAfter = await takeScreenshot(page, 'greenhouse-after');

    // Verify specific fields
    const verifyFields = [
      { selector: '#first_name, [name="first_name"], [autocomplete="given-name"]', field: 'first_name', expected: TEST_PROFILE.personal.firstName },
      { selector: '#last_name, [name="last_name"], [autocomplete="family-name"]', field: 'last_name', expected: TEST_PROFILE.personal.lastName },
      { selector: '#email, [name="email"], [type="email"]', field: 'email', expected: TEST_PROFILE.personal.email },
      { selector: '#phone, [name="phone"], [type="tel"]', field: 'phone', expected: TEST_PROFILE.personal.phone },
    ];

    for (const v of verifyFields) {
      const el = await page.$(v.selector);
      if (el) {
        const actual = await el.evaluate((e: HTMLInputElement) => e.value);
        result.verifications[v.field] = {
          expected: v.expected,
          actual: actual || '',
          passed: actual === v.expected,
        };
      } else {
        result.verifications[v.field] = {
          expected: v.expected,
          actual: '(field not found)',
          passed: false,
        };
      }
    }

    result.success = result.fieldsFilled > 0;
  } catch (err: any) {
    result.errors.push(err.message || String(err));
  } finally {
    if (context) await context.close().catch(() => {});
  }

  return result;
}

// Run standalone
const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/^.*\//, ''));
if (isMain) {
  runGreenhouseTest().then((r) => {
    console.log(JSON.stringify(r, null, 2));
    process.exit(r.success ? 0 : 1);
  });
}
