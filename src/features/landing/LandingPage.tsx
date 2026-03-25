import { Link } from 'react-router-dom'
import {
  Zap,
  Shield,
  BarChart3,
  Clock,
  ChevronDown,
  ChevronUp,
  Users,
  CheckCircle,
} from 'lucide-react'
import { useState } from 'react'
import { BlogSection } from './BlogSection'
import { EmailCapture } from './EmailCapture'

// ─── Hero ────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="bg-gradient-to-b from-blue-600 to-blue-700 text-white py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold mb-6 leading-tight">
          Stop Re-Typing. Start Applying.
        </h1>
        <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
          JobFlow Autofill saves your profile once and fills out job applications across
          Greenhouse, Lever, Workable, and more — in seconds.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="#early-access"
            className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors text-lg"
          >
            Get Early Access
          </a>
          <Link
            to="/auth"
            className="px-8 py-4 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-400 transition-colors text-lg border border-blue-400"
          >
            Sign In
          </Link>
        </div>
      </div>
    </section>
  )
}

// ─── Features ────────────────────────────────────────────────────────────────

const features = [
  {
    icon: Zap,
    title: 'One-Click Autofill',
    description:
      'Fill out entire job applications in seconds. Your profile maps to form fields automatically across all major ATS platforms.',
  },
  {
    icon: Shield,
    title: 'Local-First Privacy',
    description:
      'Your data stays on your device. No servers, no tracking, no data selling. Cloud sync is optional and always under your control.',
  },
  {
    icon: BarChart3,
    title: 'Application Tracker',
    description:
      'Every application is logged automatically. Track your pipeline with a Kanban board, set follow-up reminders, and never lose track.',
  },
  {
    icon: Clock,
    title: 'Save Hours Per Week',
    description:
      'The average application takes 20 minutes. With JobFlow, it takes seconds. Apply to more jobs with less effort.',
  },
]

function Features() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Everything you need to apply faster
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Built for serious job seekers who value their time and their privacy.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature) => (
            <div key={feature.title} className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <feature.icon className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Supported Platforms ─────────────────────────────────────────────────────

const platforms = [
  'Greenhouse',
  'Lever',
  'Workable',
  'Ashby',
  'SmartRecruiters',
  'iCIMS',
]

function SupportedPlatforms() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">
          Works with the ATS platforms companies actually use
        </h2>
        <div className="flex flex-wrap justify-center gap-4">
          {platforms.map((platform) => (
            <span
              key={platform}
              className="px-5 py-2.5 bg-white rounded-full border border-gray-200 text-gray-700 font-medium text-sm"
            >
              <CheckCircle className="w-4 h-4 inline-block mr-1.5 text-green-500 -mt-0.5" />
              {platform}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Social Proof ────────────────────────────────────────────────────────────

function SocialProof() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Users className="w-8 h-8 text-blue-600" />
          <span className="text-4xl font-extrabold text-gray-900">2,400+</span>
        </div>
        <p className="text-lg text-gray-600 mb-8">
          Trusted by job seekers who have saved thousands of hours on applications.
        </p>
        <div className="grid md:grid-cols-3 gap-6 text-left">
          {[
            {
              quote: 'I went from 5 applications a day to 30. The autofill is unbelievably accurate.',
              name: 'Sarah K.',
              role: 'Software Engineer',
            },
            {
              quote: 'Finally a tool that respects my privacy. My data stays on my laptop, period.',
              name: 'Marcus T.',
              role: 'Product Manager',
            },
            {
              quote: 'The application tracker alone is worth it. I actually know where I stand now.',
              name: 'Priya R.',
              role: 'UX Designer',
            },
          ].map((testimonial) => (
            <div
              key={testimonial.name}
              className="bg-gray-50 rounded-xl p-6 border border-gray-100"
            >
              <p className="text-gray-700 mb-4 italic">"{testimonial.quote}"</p>
              <p className="text-sm font-semibold text-gray-900">{testimonial.name}</p>
              <p className="text-sm text-gray-500">{testimonial.role}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Pricing ─────────────────────────────────────────────────────────────────

function Pricing() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Simple, fair pricing</h2>
          <p className="text-lg text-gray-600">Free to start. Upgrade when you need more.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Free</h3>
            <p className="text-3xl font-extrabold text-gray-900 mb-6">
              $0<span className="text-lg font-normal text-gray-500">/mo</span>
            </p>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                One-click autofill on all supported ATS
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                Full profile management
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                Application tracking (up to 50)
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                Local-first storage
              </li>
            </ul>
          </div>
          <div className="bg-white rounded-xl border-2 border-blue-600 p-8 relative">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
              Most Popular
            </span>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Pro</h3>
            <p className="text-3xl font-extrabold text-gray-900 mb-6">
              $9<span className="text-lg font-normal text-gray-500">/mo</span>
            </p>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                Everything in Free
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                Unlimited application tracking
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                Cloud sync across devices
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                Analytics & insights
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                Resume parsing
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                Priority support
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── FAQ ─────────────────────────────────────────────────────────────────────

const faqs = [
  {
    q: 'Is my data safe?',
    a: 'Yes. JobFlow is built local-first, meaning your personal information is stored on your device by default. No data is sent to any server unless you explicitly enable cloud sync. We never sell or share your data.',
  },
  {
    q: 'What job sites do you support?',
    a: 'JobFlow works with all major applicant tracking systems including Greenhouse, Lever, Workable, Ashby, SmartRecruiters, and iCIMS. It also supports many company career pages and job boards with standard form layouts.',
  },
  {
    q: 'Does it auto-submit applications?',
    a: 'No. JobFlow fills in your information but never submits an application without your review. You always have the final say before clicking submit.',
  },
  {
    q: 'Can I use it on multiple devices?',
    a: 'Yes. Enable optional cloud sync to keep your profile and application history synchronized across all your devices. Cloud sync is opt-in and you can disable it anytime.',
  },
  {
    q: 'Do I need to create an account?',
    a: 'No. JobFlow works entirely without an account in local-only mode. Creating an account is only needed if you want cloud sync, cross-device access, or Pro features.',
  },
  {
    q: 'What if autofill gets a field wrong?',
    a: 'You can always edit any field after autofill completes. JobFlow also lets you review the filled data before you submit, so nothing goes out without your approval.',
  },
]

function FAQ() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section className="py-20 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
          Frequently Asked Questions
        </h2>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="border border-gray-200 rounded-lg">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left"
              >
                <span className="font-medium text-gray-900">{faq.q}</span>
                {open === i ? (
                  <ChevronUp className="w-5 h-5 text-gray-400 shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />
                )}
              </button>
              {open === i && (
                <div className="px-5 pb-5 text-gray-600 text-sm leading-relaxed">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Footer ──────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-white font-bold text-lg">JobFlow</span>
            <p className="text-sm mt-1">Apply smarter, not harder.</p>
          </div>
          <div className="flex gap-6 text-sm">
            <Link to="/blog" className="hover:text-white transition-colors">
              Blog
            </Link>
            <Link to="/auth" className="hover:text-white transition-colors">
              Sign In
            </Link>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
          &copy; {new Date().getFullYear()} JobFlow. All rights reserved.
        </div>
      </div>
    </footer>
  )
}

// ─── Landing Page ────────────────────────────────────────────────────────────

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link to="/" className="text-xl font-bold text-blue-600">
            JobFlow
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/blog" className="text-sm text-gray-600 hover:text-gray-900">
              Blog
            </Link>
            <Link
              to="/auth"
              className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      <Hero />
      <Features />
      <SupportedPlatforms />
      <SocialProof />
      <Pricing />
      <BlogSection />
      <div id="early-access">
        <EmailCapture />
      </div>
      <FAQ />
      <Footer />
    </div>
  )
}
