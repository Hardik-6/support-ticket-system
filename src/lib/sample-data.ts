import { Priority, type Ticket, type Agent, AGING_CONFIG, SLA_THRESHOLDS } from '@/types/ticket'

let _idCounter = 1
export function makeTicketId() { return `TKT-${String(_idCounter++).padStart(3, '0')}` }
export function resetIdCounter(n: number) { _idCounter = n }
export function getIdCounter() { return _idCounter }
export function setIdCounter(n: number) { _idCounter = n }

export function generateSampleTickets(userId: string): Ticket[] {
  const now = new Date()
  const ago = (s: number) => new Date(now.getTime() - s * 1000)
  const sla = (tier: 'enterprise' | 'pro' | 'free', at: Date) =>
    new Date(at.getTime() + SLA_THRESHOLDS[tier] * 60 * 1000)
  const t = AGING_CONFIG.THRESHOLD_SECONDS

  const raw = [
    { customer: 'Alice Johnson',  tier: 'enterprise' as const, cat: 'account'   as const, issue: 'Cannot login — password reset not working',        pri: Priority.High,   burst: 15, ago: 45 },
    { customer: 'David Brown',    tier: 'enterprise' as const, cat: 'billing'   as const, issue: 'Need invoice copy for order #8821 urgently',        pri: Priority.High,   burst: 10, ago: 48 },
    { customer: 'Bob Smith',      tier: 'pro'        as const, cat: 'technical' as const, issue: 'Dashboard charts not loading after recent update',  pri: Priority.Medium, burst: 30, ago: t * 3 + 5 },
    { customer: 'Frank Miller',   tier: 'pro'        as const, cat: 'billing'   as const, issue: 'Billing discrepancy on last month statement',       pri: Priority.Medium, burst: 20, ago: t * 3 + 2 },
    { customer: 'Emma Davis',     tier: 'free'       as const, cat: 'feature'   as const, issue: 'Feature request: dark mode for mobile app',         pri: Priority.Medium, burst: 5,  ago: 8 },
    { customer: 'Carol White',    tier: 'free'       as const, cat: 'general'   as const, issue: 'Question about data export formats available',      pri: Priority.Low,    burst: 5,  ago: t * 5 + 3 },
    { customer: 'Grace Lee',      tier: 'pro'        as const, cat: 'technical' as const, issue: 'How to integrate the API with CRM system?',         pri: Priority.Low,    burst: 25, ago: t + 2 },
    { customer: 'Henry Patel',    tier: 'free'       as const, cat: 'general'   as const, issue: 'Request for a demo of enterprise plan features',    pri: Priority.Low,    burst: 10, ago: 5 },
    { customer: 'Iris Chen',      tier: 'enterprise' as const, cat: 'technical' as const, issue: 'API integration returning 500 errors in production', pri: Priority.High,   burst: 45, ago: 2 },
  ]

  return raw.map(item => {
    const at = ago(item.ago)
    return {
      id: makeTicketId(),
      userId,
      customer: item.customer,
      customerTier: item.tier,
      issue: item.issue,
      category: item.cat,
      priority: item.pri,
      originalPriority: item.pri,
      status: 'pending' as const,
      arrivalTime: at,
      waitingTime: item.ago,
      burstTime: item.burst,
      lastAgingCheck: at,
      agedCount: 0,
      reopenCount: 0,
      slaDeadline: sla(item.tier, at),
      slaBreached: false,
    }
  })
}

export const DEFAULT_AGENTS: Agent[] = [
  { id: 'A1', name: 'Agent Sarah', status: 'available', resolvedCount: 0 },
  { id: 'A2', name: 'Agent Mike',  status: 'available', resolvedCount: 0 },
  { id: 'A3', name: 'Agent Priya', status: 'available', resolvedCount: 0 },
]
