/**
 * E2E Test: Lever job application autofill
 * Tests against Lever's demo job board (leverdemo) which always has postings
 */

import {
  launchBrowserWithExtension,
  setTestProfile,
  detectAndFillFields,
  takeScreenshot,
  TEST_PROFILE,
} from './setup.ts';

import type { TestResult } from './greenhouse.test.ts';

export async function runLeverTest(): Promise<TestResult> {
  const result: TestResult = {
    site: 'Lever',
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

    // Use Lever's demo board which always has postings
    await page.goto('https://jobs.lever.co/leverdemo', {
      waitUntil: 'domcontentloaded',
      timeout: 20000,
    });
    await page.waitForTimeout(3000);

    // Find first job posting
    const firstJobHref = await page.evaluate(() => {
      const link = document.querySelector('.posting-title a, .posting a') as HTMLAnchorElement;
      return link ? link.href : null;
    });

    if (!firstJobHref) {
      result.errors.push('No Lever job postings found on leverdemo');
      result.screenshotBefore = await takeScreenshot(page, 'lever-no-jobs');
      return result;
    }

    // Navigate to job page
    await page.goto(firstJobHref, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);

    // Find and navigate to apply page
    const applyHref = await page.evaluate(() => {
      const link = document.querySelector('a[href*="/apply"]') as HTMLAnchorElement;
      return link ? link.href : null;
    });

    if (applyHref) {
      await page.goto(applyHref, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(3000);
    } else {
      result.errors.push('No apply button found on Lever job page');
      result.screenshotBefore = await takeScreenshot(page, 'lever-no-apply');
      return result;
    }

    result.url = page.url();
    result.screenshotBefore = await takeScreenshot(page, 'lever-before');

    // Run autofill
    const fillResult = await detectAndFillFields(page);
    result.fieldsDetected = fillResult.fieldsDetected;
    result.fieldsFilled = fillResult.fieldsFilled;
    result.fieldsMissed = fillResult.fieldsMissed;
    result.errors.push(...fillResult.errors);

    result.screenshotAfter = await takeScreenshot(page, 'lever-after');

    // Verify fields - Lever uses name="name" for full name, name="email", name="phone", name="urls[LinkedIn]"
    const verifyFields = [
      { selector: '[name="name"]', field: 'full_name', expected: `${TEST_PROFILE.personal.firstName} ${TEST_PROFILE.personal.lastName}` },
      { selector: '[name="email"]', field: 'email', expected: TEST_PROFILE.personal.email },
      { selector: '[name="phone"]', field: 'phone', expected: TEST_PROFILE.personal.phone },
      { selector: '[name="urls[LinkedIn]"]', field: 'linkedin', expected: TEST_PROFILE.personal.linkedIn },
    ];

    for (const v of verifyFields) {
      try {
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
      } catch {
        result.verifications[v.field] = {
          expected: v.expected,
          actual: '(selector error)',
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

const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/^.*\//, ''));
if (isMain) {
  runLeverTest().then((r) => {
    console.log(JSON.stringify(r, null, 2));
    process.exit(r.success ? 0 : 1);
  });
}
