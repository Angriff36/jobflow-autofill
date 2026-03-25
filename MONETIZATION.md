# JobFlow Autofill — Monetization Plan

## Pricing Tiers

### Free
- Store 1 profile
- Autofill up to 10 applications/month
- Basic application tracker (list view only)
- Browser extension with field detection

### Pro — $9/month
- Unlimited autofill
- Multiple profiles (per job type/industry)
- Full kanban pipeline + follow-up reminders
- Cloud sync across devices
- Application analytics (response rates, timing insights)
- Priority field detection updates

### Team — $19/month (future)
- Everything in Pro
- AI cover letter generation
- Shared application templates
- Team dashboard for recruiting agencies

## Revenue Model
- Stripe Checkout for subscriptions
- 14-day free trial of Pro (no CC required)
- Usage tracking via Supabase (fills_count per month)
- Gate features client-side with plan check

## Tech Requirements
- Supabase: user accounts, subscription status, usage tracking
- Stripe: checkout sessions, webhook for subscription events
- Extension: read plan from chrome.storage, enforce limits
- Landing page: pricing section, CTA to Chrome Web Store

## Chrome Web Store
- Free listing, in-app upgrade to Pro
- Screenshots: before/after autofill on real job sites
- Keywords: job application, autofill, form filler, job tracker
