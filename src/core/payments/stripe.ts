// ============================================================================
// Stripe Client Configuration
// ============================================================================

const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined

let stripePromise: Promise<unknown> | null = null

export function getStripe() {
  if (!stripePromise && STRIPE_PUBLISHABLE_KEY) {
    stripePromise = import('@stripe/stripe-js').then(({ loadStripe }) =>
      loadStripe(STRIPE_PUBLISHABLE_KEY!)
    )
  }
  return stripePromise
}

export async function createCheckoutSession(priceId: string): Promise<{ sessionId: string }> {
  // Placeholder: calls backend to create a Stripe Checkout session
  const response = await fetch('/api/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ priceId }),
  })

  if (!response.ok) {
    throw new Error('Failed to create checkout session')
  }

  return response.json()
}

export const STRIPE_PRICE_IDS = {
  pro_monthly: 'price_pro_monthly_placeholder',
} as const
