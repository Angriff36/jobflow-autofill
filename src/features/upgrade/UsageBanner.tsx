import { useEffect, useState } from 'react'
import { FREE_FILL_LIMIT } from '../../core/payments/plans'
import { getUsageCount, getCurrentPlan } from '../../core/payments/usage'
import type { PlanId } from '../../core/payments/plans'

export function UsageBanner() {
  const [usageCount, setUsageCount] = useState(0)
  const [plan, setPlan] = useState<PlanId>('free')

  useEffect(() => {
    getUsageCount().then(setUsageCount)
    getCurrentPlan().then(setPlan)
  }, [])

  if (plan !== 'free') return null

  const remaining = Math.max(0, FREE_FILL_LIMIT - usageCount)

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: remaining <= 3 ? '#fef2f2' : '#eff6ff',
      border: `1px solid ${remaining <= 3 ? '#fca5a5' : '#bfdbfe'}`,
      borderRadius: 8,
      padding: '8px 16px',
      fontSize: 14,
    }}>
      <span>
        <strong>{remaining}/{FREE_FILL_LIMIT}</strong> free fills remaining this month
      </span>
      <a
        href="/upgrade"
        style={{
          color: '#10B981',
          fontWeight: 600,
          textDecoration: 'none',
        }}
      >
        Upgrade to Pro
      </a>
    </div>
  )
}
