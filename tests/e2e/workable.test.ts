/**
 * E2E Test: Workable job application autofill
 * Tests against real Workable-hosted job applications
 * Note: Workable is a React SPA - job listings may not be available if companies have no openings
 */

import {
  launchBrowserWithExtension,
  setTestProfile,
  detectAndFillFields,
  takeScreenshot,
  TEST_PROFILE,
} from './setup.ts';

import type { TestResult } from './greenhouse.test.ts';

export async function runWorkableTest(): Promise<TestResult> {
  const result: TestResult = {
    site: 'Workable',
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

    // Try multiple Workable companies - Workable is a React SPA, needs longer waits
    const workableCompanies = [
      'depositphotos',
      'taxjar',
      'samsara',
      'netdata',
      'vimeo',
      'toggl',
      'toptal',
      'hubspot-2',
    ];

    let foundApplication = false;

    for (const company of workableCompanies) {
      try {
        await page.goto(`https://apply.workable.com/${company}/`, {
          waitUntil: 'domcontentloaded',
          timeout: 15000,
        });
        await page.waitForTimeout(5000); // Workable is React SPA, needs time to render

        // Check for job listings - Workable renders jobs in a specific data-ui structure
        const jobInfo = await page.evaluate(() => {
          // Check for "no jobs" message
          const blankSlate = document.querySelector('[data-ui="blank-slate"]');
          if (blankSlate) return { hasJobs: false, jobLinks: [] };

          // Look for job links in the rendered React content
          const links = document.querySelectorAll('a');
          const jobLinks = Array.from(links)
            .filter(l => l.href.includes('/j/'))
            .map(l => ({ href: l.href, text: (l.textContent || '').trim().substring(0, 60) }));

          // Also look for list items that might be jobs
          const jobItems = document.querySelectorAll('[data-ui="job"], li a[href*="/j/"]');

          return {
            hasJobs: jobLinks.length > 0 || jobItems.length > 0,
            jobLinks: jobLinks.slice(0, 5),
          };
        });

        if (jobInfo.hasJobs && jobInfo.jobLinks.length > 0) {
          console.log(`  Found jobs at ${company}: ${jobInfo.jobLinks.length} listings`);

          // Navigate to first job
          await page.goto(jobInfo.jobLinks[0].href, {
            waitUntil: 'domcontentloaded',
            timeout: 15000,
          });
          await page.waitForTimeout(3000);

          // Look for apply button
          const applyClicked = await page.evaluate(() => {
            const btn = document.querySelector('a[href*="/apply"], button[data-ui="apply-button"]') as HTMLElement;
            if (btn) { btn.click(); return true; }
            return false;
          });

          if (applyClicked) {
            await page.waitForTimeout(3000);
          }

          foundApplication = true;
          break;
        }
      } catch {
        continue;
      }
    }

    if (!foundApplication) {
      result.errors.push(
        'No Workable job applications found. Workable is a JS-heavy React SPA; ' +
        'tested companies either have no openings or the React app did not fully render job listings. ' +
        'Companies tested: ' + workableCompanies.join(', ')
      );
      result.screenshotBefore = await takeScreenshot(page, 'workable-no-jobs');
      return result;
    }

    result.url = page.url();
    result.screenshotBefore = await takeScreenshot(page, 'workable-before');

    const fillResult = await detectAndFillFields(page);
    result.fieldsDetected = fillResult.fieldsDetected;
    result.fieldsFilled = fillResult.fieldsFilled;
    result.fieldsMissed = fillResult.fieldsMissed;
    result.errors.push(...fillResult.errors);

    result.screenshotAfter = await takeScreenshot(page, 'workable-after');

    const verifyFields = [
      { selector: '[name="firstname"], [name="first_name"], #firstname', field: 'first_name', expected: TEST_PROFILE.personal.firstName },
      { selector: '[name="lastname"], [name="last_name"], #lastname', field: 'last_name', expected: TEST_PROFILE.personal.lastName },
      { selector: '[name="email"], [type="email"]', field: 'email', expected: TEST_PROFILE.personal.email },
      { selector: '[name="phone"], [type="tel"]', field: 'phone', expected: TEST_PROFILE.personal.phone },
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

const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/^.*\//, ''));
if (isMain) {
  runWorkableTest().then((r) => {
    console.log(JSON.stringify(r, null, 2));
    process.exit(r.success ? 0 : 1);
  });
}
