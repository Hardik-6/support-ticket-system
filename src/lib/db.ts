/**
 * db.ts — All Supabase database operations
 * Single place for all reads and writes — keeps hooks clean
 */
import { supabase } from './supabase'
import {
  type Ticket, type ExecutionLogEntry,
  Priority, SLA_THRESHOLDS,
} from '@/types/ticket'

// ── Ticket row → Ticket object ────────────────────────────────────────────────
function rowToTicket(row: any): Ticket {
  return {
    id: row.id,
    userId: row.user_id,
    customer: row.customer,
    customerTier: row.customer_tier,
    issue: row.issue,
    category: row.category,
    priority: row.priority as Priority,
    originalPriority: row.original_priority as Priority,
    status: row.status,
    arrivalTime: new Date(row.arrival_time),
    waitingTime: row.waiting_time,
    burstTime: row.burst_time,
    agedCount: row.aged_count,
    reopenCount: row.reopen_count,
    slaBreached: row.sla_breached,
    slaDeadline: new Date(row.sla_deadline),
    lastAgingCheck: new Date(row.last_aging_check),
    resolvedAt: row.resolved_at ? new Date(row.resolved_at) : undefined,
    agentId: row.agent_id ?? undefined,
    pinReason: row.pin_reason ?? undefined,
  }
}

// ── Log row → ExecutionLogEntry ───────────────────────────────────────────────
function rowToLog(row: any): ExecutionLogEntry {
  return {
    id: row.id,
    order: row.order_num,
    ticketId: row.ticket_id,
    customer: row.customer,
    customerTier: row.customer_tier,
    issue: row.issue,
    category: row.category,
    initialPriority: row.initial_priority as Priority,
    finalPriority: row.final_priority as Priority,
    resolvedAt: new Date(row.resolved_at),
    waitedSeconds: row.waited_seconds,
    burstTime: row.burst_time,
    turnaroundTime: row.turnaround_time,
    agentId: row.agent_id ?? undefined,
    wasManualOverride: row.was_manual_override,
    overrideReason: row.override_reason ?? undefined,
    wasReopened: row.was_reopened,
    slaBreached: row.sla_breached,
  }
}

// ── LOAD all tickets for current user ─────────────────────────────────────────
export async function loadTickets(): Promise<Ticket[]> {
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) { console.error('loadTickets:', error); return [] }
  return (data ?? []).map(rowToTicket)
}

// ── LOAD execution log for current user ──────────────────────────────────────
export async function loadExecutionLog(): Promise<ExecutionLogEntry[]> {
  const { data, error } = await supabase
    .from('execution_log')
    .select('*')
    .order('order_num', { ascending: true })
  if (error) { console.error('loadExecutionLog:', error); return [] }
  return (data ?? []).map(rowToLog)
}

// ── SAVE (upsert) a ticket ────────────────────────────────────────────────────
export async function saveTicket(ticket: Ticket, userId: string): Promise<void> {
  const { error } = await supabase.from('tickets').upsert({
    id: ticket.id,
    user_id: userId,
    customer: ticket.customer,
    customer_tier: ticket.customerTier,
    issue: ticket.issue,
    category: ticket.category,
    priority: ticket.priority,
    original_priority: ticket.originalPriority,
    status: ticket.status,
    arrival_time: ticket.arrivalTime.toISOString(),
    waiting_time: ticket.waitingTime,
    burst_time: ticket.burstTime,
    aged_count: ticket.agedCount,
    reopen_count: ticket.reopenCount,
    sla_breached: ticket.slaBreached,
    sla_deadline: ticket.slaDeadline.toISOString(),
    last_aging_check: ticket.lastAgingCheck.toISOString(),
    resolved_at: ticket.resolvedAt?.toISOString() ?? null,
    agent_id: ticket.agentId ?? null,
    pin_reason: ticket.pinReason ?? null,
  }, { onConflict: 'id' })
  if (error) console.error('saveTicket:', error)
}

// ── SAVE multiple tickets (batch upsert) ──────────────────────────────────────
export async function saveTickets(tickets: Ticket[], userId: string): Promise<void> {
  if (tickets.length === 0) return
  const rows = tickets.map(ticket => ({
    id: ticket.id,
    user_id: userId,
    customer: ticket.customer,
    customer_tier: ticket.customerTier,
    issue: ticket.issue,
    category: ticket.category,
    priority: ticket.priority,
    original_priority: ticket.originalPriority,
    status: ticket.status,
    arrival_time: ticket.arrivalTime.toISOString(),
    waiting_time: ticket.waitingTime,
    burst_time: ticket.burstTime,
    aged_count: ticket.agedCount,
    reopen_count: ticket.reopenCount,
    sla_breached: ticket.slaBreached,
    sla_deadline: ticket.slaDeadline.toISOString(),
    last_aging_check: ticket.lastAgingCheck.toISOString(),
    resolved_at: ticket.resolvedAt?.toISOString() ?? null,
    agent_id: ticket.agentId ?? null,
  }))
  const { error } = await supabase.from('tickets').upsert(rows, { onConflict: 'id' })
  if (error) console.error('saveTickets:', error)
}

// ── DELETE a ticket ───────────────────────────────────────────────────────────
export async function deleteTicketFromDb(ticketId: string): Promise<void> {
  const { error } = await supabase.from('tickets').delete().eq('id', ticketId)
  if (error) console.error('deleteTicket:', error)
}

// ── DELETE ALL tickets for user ───────────────────────────────────────────────
export async function deleteAllTickets(): Promise<void> {
  const { error } = await supabase.from('tickets').delete().neq('id', '')
  if (error) console.error('deleteAllTickets:', error)
}

// ── SAVE execution log entry ──────────────────────────────────────────────────
export async function saveLogEntry(entry: ExecutionLogEntry, userId: string): Promise<void> {
  const { error } = await supabase.from('execution_log').insert({
    user_id: userId,
    order_num: entry.order,
    ticket_id: entry.ticketId,
    customer: entry.customer,
    customer_tier: entry.customerTier,
    issue: entry.issue,
    category: entry.category,
    initial_priority: entry.initialPriority,
    final_priority: entry.finalPriority,
    resolved_at: entry.resolvedAt.toISOString(),
    waited_seconds: entry.waitedSeconds,
    burst_time: entry.burstTime,
    turnaround_time: entry.turnaroundTime,
    agent_id: entry.agentId ?? null,
    was_manual_override: entry.wasManualOverride,
    override_reason: entry.overrideReason ?? null,
    was_reopened: entry.wasReopened,
    sla_breached: entry.slaBreached,
  })
  if (error) console.error('saveLogEntry:', error)
}

// ── DELETE a log entry ────────────────────────────────────────────────────────
export async function deleteLogEntry(entryId: string): Promise<void> {
  const { error } = await supabase.from('execution_log').delete().eq('id', entryId)
  if (error) console.error('deleteLogEntry:', error)
}

// ── DELETE ALL log entries for user ──────────────────────────────────────────
export async function deleteAllLogEntries(): Promise<void> {
  const { error } = await supabase.from('execution_log').delete().neq('id', '')
  if (error) console.error('deleteAllLogEntries:', error)
}
