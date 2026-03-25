import { useEffect, useState } from 'react'
import { PLANS, FREE_FILL_LIMIT, type PlanId } from '../../core/payments/plans'
import { getUsageCount, getCurrentPlan } from '../../core/payments/usage'

// Stripe Payment Link — replace with real link once Stripe account is set up
const STRIPE_PAYMENT_LINK = import.meta.env.VITE_STRIPE_PAYMENT_LINK || ''

export function UpgradePage() {
  const [usageCount, setUsageCount] = useState(0)
  const [currentPlan, setCurrentPlan] = useState<PlanId>('free')

  useEffect(() => {
    getUsageCount().then(setUsageCount)
    getCurrentPlan().then(setCurrentPlan)
  }, [])

  function handleUpgrade() {
    if (STRIPE_PAYMENT_LINK) {
      window.open(STRIPE_PAYMENT_LINK, '_blank')
    } else {
      // Payment not configured yet — show email
      window.location.href = 'mailto:support@jobflow.app?subject=Upgrade%20to%20Pro'
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Upgrade Your Plan</h1>

      {currentPlan === 'free' && (
        <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 mb-6">
          <strong>{usageCount}/{FREE_FILL_LIMIT} free fills used this month</strong>
          <p className="text-sm text-amber-700 mt-1">Resets on the 1st of each month</p>
        </div>
      )}

      {currentPlan === 'pro' && (
        <div className="bg-green-50 border border-green-300 rounded-lg p-4 mb-6">
          <strong>✓ You're on the Pro plan</strong>
          <p className="text-sm text-green-700 mt-1">Unlimited autofills, all features unlocked</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {Object.values(PLANS).map((plan) => (
          <div
            key={plan.id}
            className={`border-2 rounded-xl p-6 ${
              currentPlan === plan.id ? 'border-green-500 bg-green-50' : 'border-gray-200'
            }`}
          >
            <h2 className="text-xl font-bold">{plan.name}</h2>
            <p className="text-3xl font-bold my-3">
              {plan.price === 0 ? 'Free' : `$${plan.price}/mo`}
            </p>
            <ul className="space-y-2 mb-6">
              {plan.features.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-green-600 mt-0.5">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            {plan.id === 'pro' && currentPlan === 'free' && (
              <button
                onClick={handleUpgrade}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition"
              >
                Upgrade to Pro
              </button>
            )}
            {plan.id === 'free' && currentPlan === 'free' && (
              <div className="text-center text-sm text-gray-500 py-3">Current plan</div>
            )}
            {currentPlan === 'pro' && plan.id === 'pro' && (
              <div className="text-center text-sm text-green-600 py-3 font-medium">Active ✓</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
