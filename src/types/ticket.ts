export enum Priority {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
}

export const PRIORITY_WEIGHT: Record<Priority, number> = {
  [Priority.High]: 3,
  [Priority.Medium]: 2,
  [Priority.Low]: 1,
}

export const PRIORITY_UPGRADE: Record<Priority, Priority> = {
  [Priority.Low]: Priority.Medium,
  [Priority.Medium]: Priority.High,
  [Priority.High]: Priority.High,
}

export type TicketStatus = 'pending' | 'in-progress' | 'resolved' | 'reopened'
export type CustomerTier = 'enterprise' | 'pro' | 'free'
export type TicketCategory = 'billing' | 'technical' | 'account' | 'feature' | 'general'

export const SLA_THRESHOLDS: Record<CustomerTier, number> = {
  enterprise: 60,
  pro: 240,
  free: 1440,
}

export const AGING_THRESHOLDS: Record<TicketCategory, number> = {
  billing: 8,
  technical: 10,
  account: 10,
  feature: 15,
  general: 12,
}

export interface Ticket {
  id: string
  userId?: string
  customer: string
  customerTier: CustomerTier
  issue: string
  category: TicketCategory
  priority: Priority
  originalPriority: Priority
  status: TicketStatus
  arrivalTime: Date
  waitingTime: number
  burstTime: number
  startTime?: Date
  resolvedAt?: Date
  lastAgingCheck: Date
  agedCount: number
  agentId?: string
  pinReason?: string
  reopenCount: number
  slaDeadline: Date
  slaBreached: boolean
}

export interface ExecutionLogEntry {
  id?: string
  order: number
  ticketId: string
  customer: string
  customerTier: CustomerTier
  issue: string
  category: TicketCategory
  initialPriority: Priority
  finalPriority: Priority
  resolvedAt: Date
  waitedSeconds: number
  burstTime: number
  turnaroundTime: number
  agentId?: string
  wasManualOverride: boolean
  overrideReason?: string
  wasReopened: boolean
  slaBreached: boolean
}

export interface Agent {
  id: string
  name: string
  status: 'available' | 'busy'
  currentTicketId?: string
  resolvedCount: number
}

export interface QueueMetrics {
  averageWaitTime: number
  maxWaitTime: number
  averageTurnaroundTime: number
  slaBreachCount: number
  stavedTickets: number
  totalProcessed: number
}

export interface TicketFormData {
  customer: string
  customerTier: CustomerTier
  issue: string
  category: TicketCategory
  priority: Priority
  burstTime: number
}

export const AGING_CONFIG = {
  THRESHOLD_SECONDS: 10,
  INTERVAL_MS: 1000,
} as const
