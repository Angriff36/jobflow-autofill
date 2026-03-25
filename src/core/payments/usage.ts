// ============================================================================
// Usage Tracking (IndexedDB via Dexie)
// ============================================================================

import { db } from '../storage/db'
import { FREE_FILL_LIMIT } from './plans'
import type { PlanId } from './plans'

function getCurrentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

async function getOrCreateUsageRecord() {
  const month = getCurrentMonth()
  let record = await db.usage.get({ month })
  if (!record) {
    const id = crypto.randomUUID()
    await db.usage.add({
      id,
      month,
      fillCount: 0,
      plan: 'free',
      stripeCustomerId: null,
    })
    record = await db.usage.get({ month })
  }
  return record!
}

export async function getUsageCount(): Promise<number> {
  const record = await getOrCreateUsageRecord()
  return record.fillCount
}

export async function incrementUsage(): Promise<number> {
  const record = await getOrCreateUsageRecord()
  const newCount = record.fillCount + 1
  await db.usage.update(record.id, { fillCount: newCount })
  return newCount
}

export async function isOverLimit(): Promise<boolean> {
  const record = await getOrCreateUsageRecord()
  if (record.plan === 'pro') return false
  return record.fillCount >= FREE_FILL_LIMIT
}

export async function getMonthlyReset(): Promise<Date> {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth() + 1, 1)
}

export async function getCurrentPlan(): Promise<PlanId> {
  const record = await getOrCreateUsageRecord()
  return record.plan
}

export async function setPlan(plan: PlanId, stripeCustomerId?: string): Promise<void> {
  const record = await getOrCreateUsageRecord()
  await db.usage.update(record.id, {
    plan,
    stripeCustomerId: stripeCustomerId ?? record.stripeCustomerId,
  })
}
