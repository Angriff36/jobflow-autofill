# JobFlow Autofill - E2E Test Report

**Date:** 2026-03-25
**Test Profile:** Jane Doe (jane.doe@test.com)

## Summary

| Metric | Value |
|--------|-------|
| Sites Tested | 3 |
| Sites with Successful Fill | 2/3 |
| Total Fields Detected | 37 |
| Total Fields Filled | 11 |
| Total Fields Missed | 26 |
| Overall Success Rate | 29.7% |

---

## Greenhouse

**Status:** PASS
**URL:** https://job-boards.greenhouse.io/anthropic/jobs/5023394008
**Fields Detected:** 8
**Fields Filled:** 5
**Fields Missed:** 3
**Fill Rate:** 62.5%

### Fields Detected

| Name/ID | Type | Label | Mapping | Status |
|---------|------|-------|---------|--------|
| first_name | text | First Name* | personal.firstName | Filled |
| last_name | text | Last Name* | personal.lastName | Filled |
| email | text | Email* | personal.email | Filled |
| country | text | Country | personal.location.country | Filled |
| iti-0__search-input | search | Search | - | Missed |
| phone | tel | Phone | personal.phone | Filled |
| question_14364081008 | text | Please note that you will not be conside | - | Missed |
| g-recaptcha-response | textarea |  | - | Missed |

### Verification Results

| Field | Expected | Actual | Pass |
|-------|----------|--------|------|
| first_name | Jane | Jane | YES |
| last_name | Doe | Doe | YES |
| email | jane.doe@test.com | jane.doe@test.com | YES |
| phone | 5551234567 | 5551234567 | YES |

### Screenshots

- Before: `screenshots/greenhouse-before.png`
- After: `screenshots/greenhouse-after.png`

---

## Lever

**Status:** PASS
**URL:** https://jobs.lever.co/leverdemo/c559265a-55ec-4f75-ac56-78290081f6e7/apply
**Fields Detected:** 29
**Fields Filled:** 6
**Fields Missed:** 23
**Fill Rate:** 20.7%

### Fields Detected

| Name/ID | Type | Label | Mapping | Status |
|---------|------|-------|---------|--------|
| name | text | Full name✱ | __fullName__ | Filled |
| pronouns | checkbox | He/him | - | Missed |
| pronouns | checkbox | Use name only | - | Missed |
| customPronounsOption | checkbox | Custom | - | Missed |
| pronouns | text | Custom | - | Missed |
| email | email | Email✱ | personal.email | Filled |
| phone | text | Phone ✱ | personal.phone | Filled |
| location | text | Current location No location found. Try  | personal.location.city | Filled |
| org | text | Current company ✱ | - | Missed |
| urls[LinkedIn] | text | LinkedIn URL | personal.linkedIn | Filled |
| urls[Github] | text | Github URL | personal.website | Missed |
| urls[Other Website] | text | Other Website URL | - | Missed |
| urls[Video Link ] | text | Video Link  URL | - | Missed |
| cards[b27604f4-073c-4494-a0bc-85a23b9b774a][field0] | select-one |  | - | Missed |
| cards[b27604f4-073c-4494-a0bc-85a23b9b774a][field1] | textarea |  | - | Missed |
| cards[b27604f4-073c-4494-a0bc-85a23b9b774a][field2] | text |  | - | Missed |
| cards[5fecf689-baa0-4070-a7c8-303d00b6d6f8][field0] | text |  | - | Missed |
| cards[8cf0b5ca-3ec0-47f3-8d15-7762164192b2][field0] | textarea |  | - | Missed |
| cards[71e7dd65-58c3-4e3c-bb55-0bf2d73fe5ad][field0] | select-one |  | - | Missed |
| comments | textarea | Additional information | - | Missed |
| eeo[gender] | select-one | Gender | - | Missed |
| eeo[race] | radio | Hispanic or LatinoA person of Cuban, Mex | - | Missed |
| eeo[veteran] | select-one | Veteran status | - | Missed |
| eeo[disability] | select-one | Disability status | - | Missed |
| eeo[disabilitySignature] | text | Name | __fullName__ | Filled |
| eeo[disabilitySignatureDate] | text | Date | - | Missed |
| surveysResponses[8dfb36ea-fd79-4bea-aa2d-734a7b290c35][responses][field0] | radio | 17 or younger | - | Missed |
| surveysResponses[8dfb36ea-fd79-4bea-aa2d-734a7b290c35][responses][field1] | radio | Female | - | Missed |
| surveysResponses[8dfb36ea-fd79-4bea-aa2d-734a7b290c35][responses][field2] | checkbox | White / Caucasian | - | Missed |

### Verification Results

| Field | Expected | Actual | Pass |
|-------|----------|--------|------|
| full_name | Jane Doe | Jane Doe | YES |
| email | jane.doe@test.com | jane.doe@test.com | YES |
| phone | 5551234567 | 5551234567 | YES |
| linkedin | https://linkedin.com/in/janedoe | https://linkedin.com/in/janedoe | YES |

### Screenshots

- Before: `screenshots/lever-before.png`
- After: `screenshots/lever-after.png`

---

## Workable

**Status:** FAIL
**URL:** N/A
**Fields Detected:** 0
**Fields Filled:** 0
**Fields Missed:** 0
**Fill Rate:** 0.0%

### Errors

- No Workable job applications found. Workable is a JS-heavy React SPA; tested companies either have no openings or the React app did not fully render job listings. Companies tested: depositphotos, taxjar, samsara, netdata, vimeo, toggl, toptal, hubspot-2

### Screenshots

- Before: `screenshots/workable-no-jobs.png`

---

