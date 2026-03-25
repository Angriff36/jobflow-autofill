/**
 * E2E Test Setup - Helpers for launching Chromium with the JobFlow extension
 */

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pw = require('/home/oc/.npm-global/lib/node_modules/playwright');

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const EXTENSION_PATH = path.resolve(__dirname, '../../dist/extension');
export const SCREENSHOTS_DIR = path.resolve(__dirname, 'screenshots');

export const TEST_PROFILE = {
  personal: {
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane.doe@test.com',
    phone: '5551234567',
    location: {
      address: '456 Oak Ave',
      city: 'Austin',
      state: 'TX',
      zip: '73301',
      country: 'United States',
    },
    linkedIn: 'https://linkedin.com/in/janedoe',
  },
  workExperience: [],
  education: [],
  skills: [],
  answers: [],
};

interface LaunchResult {
  context: any;
  extensionId: string;
  serviceWorker: any;
}

export async function launchBrowserWithExtension(): Promise<LaunchResult> {
  const userDataDir = path.join('/tmp', `jobflow-e2e-${Date.now()}`);

  const context = await pw.chromium.launchPersistentContext(userDataDir, {
    headless: false,
    args: [
      `--disable-extensions-except=${EXTENSION_PATH}`,
      `--load-extension=${EXTENSION_PATH}`,
      '--headless=new',
      '--no-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
    ],
    viewport: { width: 1280, height: 900 },
  });

  // Wait for service worker to initialize
  let serviceWorker = context.serviceWorkers()[0];
  if (!serviceWorker) {
    serviceWorker = await context.waitForEvent('serviceworker', { timeout: 10000 });
  }

  const extensionId = serviceWorker.url().split('/')[2];

  return { context, extensionId, serviceWorker };
}

export async function setTestProfile(context: any, extensionId: string): Promise<void> {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/popup.html`);
  await page.waitForTimeout(500);

  await page.evaluate((profile: any) => {
    return new Promise<void>((resolve, reject) => {
      chrome.storage.local.set({ profile }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  }, TEST_PROFILE);

  await page.close();
}

export interface DetectedField {
  selector: string;
  name: string;
  type: string;
  label: string;
  placeholder: string;
  suggestedMapping: string | null;
}

export interface AutofillResult {
  fieldsDetected: DetectedField[];
  fieldsFilled: number;
  fieldsMissed: DetectedField[];
  errors: string[];
}

export async function detectAndFillFields(page: any): Promise<AutofillResult> {
  const result = await page.evaluate((profile: any) => {
    // ---- Field patterns (mirrored from content script) ----
    const FIELD_PATTERNS: Record<string, RegExp[]> = {
      firstName: [/^(first_?name|firstname|first_name|given_?name|fname)$/i, /^name_first$/i],
      lastName: [/^(last_?name|lastname|last_name|family_?name|surname|lname)$/i, /^name_last$/i],
      fullName: [/^(full_?name|fullname|full_name|name|your_?name)$/i, /^applicant_?name$/i],
      email: [/^(email|email_?address|e_?mail|user_?email|login_?email)$/i, /^email_address$/i],
      phone: [/^(phone|mobile|cell|telephone|tel|phone_?number|contact_?phone|phone_?primary)$/i, /^mobile_?number$/i],
      address: [/^(address|street|street_?address|addr|address1|address_?line_?1)$/i],
      city: [/^(city|town|location|city_?name)$/i],
      state: [/^(state|province|region|state_?province|state_?code)$/i],
      zip: [/^(zip|zip_?code|postal|postal_?code|postcode)$/i],
      country: [/^(country|nation|nationality|country_?code|country_?name)$/i],
      linkedIn: [/^(linkedin|linked_?in|linkedin_?url|linkedin_?profile)$/i],
      portfolio: [/^(portfolio|website|personal_?site|web_?site|url|homepage)$/i],
      github: [/^(github|github_?url|github_?profile)$/i],
      company: [/^(company|employer|company_?name|organization|org|current_?company)$/i],
      jobTitle: [/^(title|job_?title|position|role|current_?title|designation)$/i],
      school: [/^(school|university|college|institution|education_?institution)$/i],
      degree: [/^(degree|education_?level|degree_?type)$/i],
      major: [/^(major|field|field_?of_?study|area_?of_?study)$/i],
      coverLetter: [/^(cover_?letter|coverletter|message|additional_?info)$/i],
      resume: [/^(resume|cv|curriculum|resume_?file|cv_?file)$/i],
    };

    const LABEL_PATTERNS: Record<string, RegExp[]> = {
      firstName: [/first\s*name/i, /given\s*name/i],
      lastName: [/last\s*name/i, /family\s*name/i, /surname/i],
      fullName: [/full\s*name/i, /your\s*name/i, /^name$/i],
      email: [/e[\s-]*mail/i],
      phone: [/phone/i, /mobile/i, /telephone/i, /cell/i],
      address: [/street\s*address/i, /address\s*(line)?\s*1/i, /^address$/i],
      address2: [/address\s*(line)?\s*2/i, /apartment/i, /suite/i, /unit/i],
      city: [/^city$/i, /^town$/i],
      state: [/^state$/i, /province/i, /^region$/i],
      zip: [/zip/i, /postal/i, /postcode/i],
      country: [/country/i],
      linkedIn: [/linkedin/i],
      portfolio: [/portfolio/i, /personal\s*(web)?site/i],
      github: [/github/i],
      company: [/company/i, /employer/i, /organization/i],
      jobTitle: [/job\s*title/i, /position/i, /current\s*title/i, /^title$/i, /^role$/i],
      school: [/school/i, /university/i, /college/i, /institution/i],
      degree: [/degree/i, /education\s*level/i],
      major: [/major/i, /field\s*of\s*study/i],
      coverLetter: [/cover\s*letter/i],
      resume: [/resume/i, /^cv$/i],
    };

    const FIELD_TO_PROFILE_MAP: Record<string, string> = {
      firstName: 'personal.firstName',
      lastName: 'personal.lastName',
      fullName: '__fullName__',
      email: 'personal.email',
      phone: 'personal.phone',
      address: 'personal.location.address',
      city: 'personal.location.city',
      state: 'personal.location.state',
      zip: 'personal.location.zip',
      country: 'personal.location.country',
      linkedIn: 'personal.linkedIn',
      portfolio: 'personal.portfolio',
      github: 'personal.website',
    };

    function findLabel(input: HTMLElement): string {
      const inp = input as HTMLInputElement;
      if (inp.id) {
        const label = document.querySelector(`label[for="${CSS.escape(inp.id)}"]`);
        if (label) return label.textContent?.trim() || '';
      }
      const parentLabel = input.closest('label');
      if (parentLabel) {
        const clone = parentLabel.cloneNode(true) as HTMLElement;
        clone.querySelectorAll('input, select, textarea').forEach(el => el.remove());
        return clone.textContent?.trim() || '';
      }
      const ariaLabel = input.getAttribute('aria-label');
      if (ariaLabel) return ariaLabel;
      const labelledBy = input.getAttribute('aria-labelledby');
      if (labelledBy) {
        const labelEl = document.getElementById(labelledBy);
        if (labelEl) return labelEl.textContent?.trim() || '';
      }
      let prev = input.previousElementSibling;
      while (prev) {
        if (prev.tagName === 'LABEL' || prev.tagName === 'SPAN' || prev.tagName === 'DIV') {
          const text = prev.textContent?.trim();
          if (text && text.length < 100) return text;
        }
        prev = prev.previousElementSibling;
      }
      return '';
    }

    function matchField(name: string, label: string, placeholder: string): string | null {
      for (const [fieldName, patterns] of Object.entries(FIELD_PATTERNS)) {
        for (const pattern of patterns) { if (pattern.test(name)) return fieldName; }
      }
      for (const [fieldName, patterns] of Object.entries(FIELD_PATTERNS)) {
        for (const pattern of patterns) { if (pattern.test(placeholder)) return fieldName; }
      }
      if (label) {
        for (const [fieldName, patterns] of Object.entries(LABEL_PATTERNS)) {
          for (const pattern of patterns) { if (pattern.test(label)) return fieldName; }
        }
      }
      if (placeholder) {
        for (const [fieldName, patterns] of Object.entries(LABEL_PATTERNS)) {
          for (const pattern of patterns) { if (pattern.test(placeholder)) return fieldName; }
        }
      }
      return null;
    }

    function getNestedValue(obj: any, path: string): any {
      return path.split('.').reduce((cur: any, key: string) => {
        return cur && typeof cur === 'object' && key in cur ? cur[key] : null;
      }, obj);
    }

    // Detect fields
    const inputs = document.querySelectorAll<HTMLElement>(
      'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="image"]):not([type="file"]),select,textarea'
    );

    const fields: any[] = [];
    const seen = new Set<string>();

    inputs.forEach((element) => {
      const input = element as HTMLInputElement;
      const name = input.name || input.id || '';
      const type = input.type || 'text';
      const label = findLabel(input);
      const placeholder = input.placeholder || '';
      const matched = matchField(name, label, placeholder);
      const mapping = matched ? (FIELD_TO_PROFILE_MAP[matched] || null) : null;

      let selector = '';
      if (input.id) selector = '#' + CSS.escape(input.id);
      else if (input.name) selector = `[name="${CSS.escape(input.name)}"]`;
      else return;

      if (seen.has(selector)) return;
      seen.add(selector);

      fields.push({ selector, name, type, label, placeholder, suggestedMapping: mapping });
    });

    // Fill fields
    let filledCount = 0;
    const missed: any[] = [];

    for (const field of fields) {
      if (!field.suggestedMapping) {
        missed.push(field);
        continue;
      }

      let value: any;
      if (field.suggestedMapping === '__fullName__') {
        value = [profile.personal.firstName, profile.personal.lastName].filter(Boolean).join(' ');
      } else {
        value = getNestedValue(profile, field.suggestedMapping);
      }

      if (!value && value !== 0) { missed.push(field); continue; }

      let element: HTMLElement | null = null;
      try { element = document.querySelector(field.selector); } catch { continue; }
      if (!element) { missed.push(field); continue; }

      const inp = element as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
      const stringValue = String(value);

      if (inp.tagName === 'SELECT') {
        const select = inp as HTMLSelectElement;
        let found = false;
        for (const opt of select.options) {
          if (opt.value.toLowerCase() === stringValue.toLowerCase() ||
              (opt.textContent?.trim().toLowerCase() || '') === stringValue.toLowerCase()) {
            select.value = opt.value; found = true; break;
          }
        }
        if (!found) {
          for (const opt of select.options) {
            if (opt.value.toLowerCase().includes(stringValue.toLowerCase()) ||
                (opt.textContent?.trim().toLowerCase() || '').includes(stringValue.toLowerCase())) {
              select.value = opt.value; found = true; break;
            }
          }
        }
        if (!found) { missed.push(field); continue; }
      } else {
        const nativeSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype, 'value'
        )?.set || Object.getOwnPropertyDescriptor(
          window.HTMLTextAreaElement.prototype, 'value'
        )?.set;
        if (nativeSetter) nativeSetter.call(inp, stringValue);
        else inp.value = stringValue;
      }

      inp.dispatchEvent(new Event('input', { bubbles: true }));
      inp.dispatchEvent(new Event('change', { bubbles: true }));
      inp.dispatchEvent(new Event('blur', { bubbles: true }));
      filledCount++;
    }

    return { fieldsDetected: fields, fieldsFilled: filledCount, fieldsMissed: missed, errors: [] as string[] };
  }, TEST_PROFILE);

  return result;
}

export async function takeScreenshot(page: any, name: string): Promise<string> {
  const screenshotPath = path.join(SCREENSHOTS_DIR, `${name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  return screenshotPath;
}
