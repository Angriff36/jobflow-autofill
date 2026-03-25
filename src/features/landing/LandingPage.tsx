import { Link } from 'react-router-dom'

const CHROME_STORE_URL = '#'

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 to-white pt-20 pb-24 sm:pt-28 sm:pb-32">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100/40 via-transparent to-transparent" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-1.5 text-sm font-medium text-blue-700 mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600" />
          </span>
          Chrome Extension + Web Dashboard
        </div>
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 leading-tight">
          Stop Re-Typing.
          <br />
          <span className="text-blue-600">Start Applying.</span>
        </h1>
        <p className="mt-6 max-w-2xl mx-auto text-lg sm:text-xl text-slate-600 leading-relaxed">
          Save your profile once, then autofill any job application with one click.
          Works on Greenhouse, Lever, Workable, Ashby, and more.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href={CHROME_STORE_URL}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-blue-600/25 hover:bg-blue-700 hover:shadow-blue-600/40 transition-all duration-200"
          >
            <ChromeIcon />
            Add to Chrome — It's Free
          </a>
          <a
            href="#how-it-works"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-8 py-4 text-lg font-semibold text-slate-700 hover:border-slate-400 hover:bg-slate-50 transition-all duration-200"
          >
            See How It Works
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </a>
        </div>
        <p className="mt-4 text-sm text-slate-500">Free forever. No credit card required.</p>
      </div>
    </section>
  )
}

function HowItWorksSection() {
  const steps = [
    {
      number: '1',
      title: 'Save Your Profile',
      description: 'Enter your info once — personal details, work history, education, skills, and custom answers.',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
      ),
    },
    {
      number: '2',
      title: 'Open a Job Application',
      description: 'Navigate to any job posting on Greenhouse, Lever, Workable, Ashby, or other major ATS platforms.',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" />
        </svg>
      ),
    },
    {
      number: '3',
      title: 'One-Click Autofill',
      description: 'Click the JobFlow button and watch every field fill instantly. Review, tweak if needed, and submit.',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
        </svg>
      ),
    },
  ]

  return (
    <section id="how-it-works" className="py-20 sm:py-28 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-blue-600">How It Works</h2>
          <p className="mt-2 text-3xl sm:text-4xl font-bold text-slate-900">Three steps to faster applications</p>
        </div>
        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
          {steps.map((step, i) => (
            <div key={step.number} className="relative text-center">
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-[60%] w-[80%] border-t-2 border-dashed border-slate-200" />
              )}
              <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                {step.icon}
                <span className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                  {step.number}
                </span>
              </div>
              <h3 className="mt-6 text-xl font-semibold text-slate-900">{step.title}</h3>
              <p className="mt-3 text-slate-600 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function FeaturesSection() {
  const features = [
    {
      title: 'Smart Field Detection',
      description: 'AI-powered recognition automatically maps your profile data to any form field, even custom questions.',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
        </svg>
      ),
    },
    {
      title: 'Application Pipeline',
      description: 'Track every application from "Applied" to "Offer" with a visual kanban board and detailed timeline.',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125z" />
        </svg>
      ),
    },
    {
      title: 'Follow-Up Reminders',
      description: 'Never let an application go cold. Get smart reminders to follow up at the right time.',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
      ),
    },
    {
      title: 'Cross-Device Sync',
      description: 'Your profile and applications sync seamlessly across all your devices with cloud backup.',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
        </svg>
      ),
    },
    {
      title: 'Works Everywhere',
      description: 'Greenhouse, Lever, Workable, Ashby, and dozens more ATS platforms supported out of the box.',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
        </svg>
      ),
    },
    {
      title: 'Application Analytics',
      description: 'See your response rates, application timing insights, and optimize your job search strategy.',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      ),
    },
  ]

  return (
    <section id="features" className="py-20 sm:py-28 bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-blue-600">Features</h2>
          <p className="mt-2 text-3xl sm:text-4xl font-bold text-slate-900">Everything you need to land your next role</p>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-slate-600">
            More than just autofill — JobFlow is your complete job search command center.
          </p>
        </div>
        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-xl bg-white p-8 shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-200 transition-all duration-200"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200">
                {feature.icon}
              </div>
              <h3 className="mt-5 text-lg font-semibold text-slate-900">{feature.title}</h3>
              <p className="mt-2 text-slate-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function PricingSection() {
  return (
    <section id="pricing" className="py-20 sm:py-28 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-blue-600">Pricing</h2>
          <p className="mt-2 text-3xl sm:text-4xl font-bold text-slate-900">Simple, transparent pricing</p>
          <p className="mt-4 text-lg text-slate-600">Start free, upgrade when you're ready.</p>
        </div>
        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 max-w-4xl mx-auto">
          {/* Free Tier */}
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Free</h3>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-5xl font-bold text-slate-900">$0</span>
              <span className="text-slate-500">/month</span>
            </div>
            <p className="mt-4 text-slate-600">Perfect for getting started with your job search.</p>
            <ul className="mt-8 space-y-4">
              {[
                'Store 1 profile',
                'Autofill up to 10 applications/month',
                'Basic application tracker (list view)',
                'Browser extension with field detection',
              ].map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <CheckIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
                  <span className="text-slate-700">{feature}</span>
                </li>
              ))}
            </ul>
            <a
              href={CHROME_STORE_URL}
              className="mt-8 block w-full rounded-lg border border-slate-300 bg-white px-6 py-3 text-center font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all duration-200"
            >
              Get Started Free
            </a>
          </div>

          {/* Pro Tier */}
          <div className="relative rounded-2xl border-2 border-blue-600 bg-white p-8 shadow-lg">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-4 py-1 text-sm font-semibold text-white">
              Most Popular
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Pro</h3>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-5xl font-bold text-slate-900">$9</span>
              <span className="text-slate-500">/month</span>
            </div>
            <p className="mt-4 text-slate-600">For serious job seekers who want every advantage.</p>
            <ul className="mt-8 space-y-4">
              {[
                'Unlimited autofill',
                'Multiple profiles (per job type/industry)',
                'Full kanban pipeline + follow-up reminders',
                'Cloud sync across devices',
                'Application analytics & timing insights',
                'Priority field detection updates',
              ].map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <CheckIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
                  <span className="text-slate-700">{feature}</span>
                </li>
              ))}
            </ul>
            <a
              href={CHROME_STORE_URL}
              className="mt-8 block w-full rounded-lg bg-blue-600 px-6 py-3 text-center font-semibold text-white shadow-md shadow-blue-600/25 hover:bg-blue-700 transition-all duration-200"
            >
              Start 14-Day Free Trial
            </a>
            <p className="mt-3 text-center text-sm text-slate-500">No credit card required</p>
          </div>
        </div>
      </div>
    </section>
  )
}

function CTASection() {
  return (
    <section className="py-20 sm:py-28 bg-blue-600">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white">Ready to stop re-typing?</h2>
        <p className="mt-4 text-lg text-blue-100">
          Join thousands of job seekers who save hours every week with JobFlow Autofill.
        </p>
        <a
          href={CHROME_STORE_URL}
          className="mt-8 inline-flex items-center gap-2 rounded-lg bg-white px-8 py-4 text-lg font-semibold text-blue-600 shadow-lg hover:bg-blue-50 transition-all duration-200"
        >
          <ChromeIcon />
          Add to Chrome — Free
        </a>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="bg-slate-900 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
              </div>
              <span className="text-lg font-bold text-white">JobFlow</span>
            </div>
            <p className="mt-4 text-sm text-slate-400">
              The fastest way to apply to jobs. Save your profile once, autofill everywhere.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">Product</h4>
            <ul className="mt-4 space-y-2">
              <li><a href="#features" className="text-sm text-slate-400 hover:text-white transition-colors">Features</a></li>
              <li><a href="#pricing" className="text-sm text-slate-400 hover:text-white transition-colors">Pricing</a></li>
              <li><a href={CHROME_STORE_URL} className="text-sm text-slate-400 hover:text-white transition-colors">Chrome Extension</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">Support</h4>
            <ul className="mt-4 space-y-2">
              <li><a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">Help Center</a></li>
              <li><a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">Contact Us</a></li>
              <li><a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">Status</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">Legal</h4>
            <ul className="mt-4 space-y-2">
              <li><a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-slate-800 pt-8 text-center text-sm text-slate-500">
          &copy; {new Date().getFullYear()} JobFlow. All rights reserved.
        </div>
      </div>
    </footer>
  )
}

function Navbar() {
  return (
    <nav className="fixed top-0 z-50 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
          </div>
          <span className="text-xl font-bold text-slate-900">JobFlow</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">How It Works</a>
          <a href="#features" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Features</a>
          <a href="#pricing" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Pricing</a>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/app/dashboard"
            className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            Sign In
          </Link>
          <a
            href={CHROME_STORE_URL}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            Get Started
          </a>
        </div>
      </div>
    </nav>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  )
}

function ChromeIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8 0-1.85.63-3.55 1.69-4.9L9.5 12l-1.81 4.74C8.97 18.15 10.4 19 12 19c1.85 0 3.55-.63 4.9-1.69L12 13.5l4.74-1.81C18.15 10.41 19 8.6 19 7c0-1.85-.63-3.55-1.69-4.9L12 6.5V2z" />
    </svg>
  )
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <HeroSection />
      <HowItWorksSection />
      <FeaturesSection />
      <PricingSection />
      <CTASection />
      <Footer />
    </div>
  )
}
