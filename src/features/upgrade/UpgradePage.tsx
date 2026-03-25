import { useEffect, useState } from 'react'
import { PLANS, FREE_FILL_LIMIT, type PlanId } from '../../core/payments/plans'
import { getUsageCount, getCurrentPlan } from '../../core/payments/usage'
import { createCheckoutSession, getStripe, STRIPE_PRICE_IDS } from '../../core/payments/stripe'

export function UpgradePage() {
  const [usageCount, setUsageCount] = useState(0)
  const [currentPlan, setCurrentPlan] = useState<PlanId>('free')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getUsageCount().then(setUsageCount)
    getCurrentPlan().then(setCurrentPlan)
  }, [])

  async function handleUpgrade() {
    setLoading(true)
    try {
      const { sessionId } = await createCheckoutSession(STRIPE_PRICE_IDS.pro_monthly)
      const stripe = await getStripe()
      if (stripe && typeof stripe === 'object' && 'redirectToCheckout' in stripe) {
        await (stripe as { redirectToCheckout: (opts: { sessionId: string }) => Promise<unknown> })
          .redirectToCheckout({ sessionId })
      }
    } catch (error) {
      console.error('Checkout error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
      <h1>Upgrade Your Plan</h1>

      {currentPlan === 'free' && (
        <div style={{
          background: '#fef3c7',
          border: '1px solid #f59e0b',
          borderRadius: 8,
          padding: 16,
          marginBottom: 24,
        }}>
          <strong>{usageCount}/{FREE_FILL_LIMIT} free fills used this month</strong>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {Object.values(PLANS).map((plan) => (
          <div
            key={plan.id}
            style={{
              border: currentPlan === plan.id ? '2px solid #10B981' : '1px solid #e5e7eb',
              borderRadius: 12,
              padding: 24,
            }}
          >
            <h2>{plan.name}</h2>
            <p style={{ fontSize: 32, fontWeight: 'bold', margin: '8px 0' }}>
              {plan.price === 0 ? 'Free' : `$${plan.price}/mo`}
            </p>
            <p style={{ color: '#6b7280', marginBottom: 16 }}>
              {plan.fillsPerMonth === null ? 'Unlimited fills' : `${plan.fillsPerMonth} fills/month`}
            </p>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {plan.features.map((feature) => (
                <li key={feature} style={{ padding: '4px 0' }}>
                  ✓ {feature}
                </li>
              ))}
            </ul>
            {plan.id === 'pro' && currentPlan === 'free' && (
              <button
                onClick={handleUpgrade}
                disabled={loading}
                style={{
                  marginTop: 16,
                  width: '100%',
                  padding: '12px 24px',
                  background: '#10B981',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 16,
                  cursor: loading ? 'wait' : 'pointer',
                }}
              >
                {loading ? 'Loading...' : 'Upgrade to Pro'}
              </button>
            )}
            {currentPlan === plan.id && (
              <p style={{ marginTop: 16, textAlign: 'center', color: '#10B981', fontWeight: 'bold' }}>
                Current Plan
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
