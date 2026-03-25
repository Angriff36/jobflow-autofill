// ============================================================================
// Plan Definitions
// ============================================================================

export type PlanId = 'free' | 'pro'

export interface PlanDefinition {
  id: PlanId
  name: string
  price: number // monthly in USD, 0 for free
  fillsPerMonth: number | null // null = unlimited
  features: string[]
}

export const PLANS: Record<PlanId, PlanDefinition> = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    fillsPerMonth: 10,
    features: [
      '1 profile',
      '10 autofills per month',
      'Basic application tracker (list view)',
      'Browser extension with field detection',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 9,
    fillsPerMonth: null,
    features: [
      'Unlimited autofill',
      'Multiple profiles',
      'Full kanban pipeline + follow-up reminders',
      'Cloud sync across devices',
      'Application analytics',
      'Priority field detection updates',
    ],
  },
}

export const FREE_FILL_LIMIT = 10
