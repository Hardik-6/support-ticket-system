/**
 * use-ticket-system.ts
 * Full scheduling engine with Supabase persistence.
 * All tickets and logs are saved to the database — survive page refresh.
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { formatDistanceToNow } from 'date-fns'
import {
  type Ticket, type Agent, type ExecutionLogEntry, type TicketFormData, type QueueMetrics,
  Priority, PRIORITY_WEIGHT, PRIORITY_UPGRADE, AGING_CONFIG, AGING_THRESHOLDS, SLA_THRESHOLDS,
} from '@/types/ticket'
import {
  loadTickets, loadExecutionLog, saveTicket, saveTickets,
  deleteTicketFromDb, deleteAllTickets, saveLogEntry,
  deleteLogEntry, deleteAllLogEntries,
} from '@/lib/db'
import {
  generateSampleTickets, DEFAULT_AGENTS,
  makeTicketId, resetIdCounter, setIdCounter,
} from '@/lib/sample-data'

// ── Sub-priority: aged High ranks below natural High ──────────────────────────
function getEffectiveWeight(t: Ticket): number {
  const base = PRIORITY_WEIGHT[t.priority]
  if (t.priority === Priority.High && t.agedCount > 0) return base - 0.5
  return base
}

// ── Scheduling comparator ─────────────────────────────────────────────────────
function makeComparator(pinnedId: string | null) {
  return (a: Ticket, b: Ticket): number => {
    if (a.status === 'resolved' && b.status !== 'resolved') return 1
    if (b.status === 'resolved' && a.status !== 'resolved') return -1
    if (a.id === pinnedId) return -1
    if (b.id === pinnedId) return 1
    const wd = getEffectiveWeight(b) - getEffectiveWeight(a)
    if (wd !== 0) return wd
    // FIFO by ticket number
    const an = parseInt(a.id.replace('TKT-', ''))
    const bn = parseInt(b.id.replace('TKT-', ''))
    return an - bn
  }
}

// ── Aging algorithm ───────────────────────────────────────────────────────────
function applyAging(tickets: Ticket[], now: Date) {
  const agedIds: string[] = []
  const updated = tickets.map(t => {
    if (t.status === 'resolved') return t
    const slaBreached = now > t.slaDeadline
    if (t.priority === Priority.High) {
      return slaBreached !== t.slaBreached ? { ...t, slaBreached } : t
    }
    const threshold = AGING_THRESHOLDS[t.category]
    const elapsed = (now.getTime() - t.lastAgingCheck.getTime()) / 1000
    if (elapsed >= threshold) {
      const newPri = PRIORITY_UPGRADE[t.priority]
      if (newPri !== t.priority) {
        agedIds.push(t.id)
        return { ...t, priority: newPri, lastAgingCheck: now, agedCount: t.agedCount + 1, slaBreached }
      }
    }
    return slaBreached !== t.slaBreached ? { ...t, slaBreached } : t
  })
  return { updated, agedIds }
}

// ── Metrics ───────────────────────────────────────────────────────────────────
function computeMetrics(log: ExecutionLogEntry[], tickets: Ticket[]): QueueMetrics {
  const pending = tickets.filter(t => t.status === 'pending' || t.status === 'reopened')
  const waits = [...log.map(e => e.waitedSeconds), ...pending.map(t => t.waitingTime)]
  const tats = log.map(e => e.turnaroundTime)
  return {
    averageWaitTime: waits.length ? Math.round(waits.reduce((a, b) => a + b, 0) / waits.length) : 0,
    maxWaitTime: waits.length ? Math.max(...waits) : 0,
    averageTurnaroundTime: tats.length ? Math.round(tats.reduce((a, b) => a + b, 0) / tats.length) : 0,
    slaBreachCount: log.filter(e => e.slaBreached).length + tickets.filter(t => t.slaBreached && t.status !== 'resolved').length,
    stavedTickets: log.filter(e => e.initialPriority !== e.finalPriority).length,
    totalProcessed: log.length,
  }
}

interface Props { userId: string }

export function useTicketSystem({ userId }: Props) {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [executionLog, setExecutionLog] = useState<ExecutionLogEntry[]>([])
  const [agents, setAgents] = useState<Agent[]>(DEFAULT_AGENTS)
  const [recentlyAgedIds, setRecentlyAgedIds] = useState<Set<string>>(new Set())
  const [pinnedId, setPinnedId] = useState<string | null>(null)
  const [pinReason, setPinReason] = useState('')
  const [loading, setLoading] = useState(true)
  const executionOrderRef = useRef(1)

  // ── Load data from Supabase on mount ─────────────────────────────────────────
  useEffect(() => {
    async function init() {
      setLoading(true)
      const [dbTickets, dbLog] = await Promise.all([loadTickets(), loadExecutionLog()])
      setTickets(dbTickets)
      setExecutionLog(dbLog)
      // Set ID counter above max existing ID
      const maxId = dbTickets.reduce((max, t) => {
        const n = parseInt(t.id.replace('TKT-', ''))
        return n > max ? n : max
      }, 99)
      setIdCounter(maxId + 1)
      executionOrderRef.current = dbLog.length + 1
      setLoading(false)
    }
    init()
  }, [userId])

  // ── Aging interval ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (loading) return
    const interval = setInterval(() => {
      const now = new Date()
      setTickets(prev => {
        const withWaits = prev.map(t =>
          (t.status === 'pending' || t.status === 'reopened')
            ? { ...t, waitingTime: Math.floor((now.getTime() - t.arrivalTime.getTime()) / 1000) }
            : t
        )
        const { updated, agedIds } = applyAging(withWaits, now)
        if (agedIds.length > 0) {
          setRecentlyAgedIds(p => { const n = new Set(p); agedIds.forEach(id => n.add(id)); return n })
          setTimeout(() => {
            setRecentlyAgedIds(p => { const n = new Set(p); agedIds.forEach(id => n.delete(id)); return n })
          }, 2000)
          // Save aged tickets to DB
          agedIds.forEach(id => {
            const t = updated.find(x => x.id === id)
            if (t) saveTicket(t, userId)
          })
        }
        return updated
      })
    }, AGING_CONFIG.INTERVAL_MS)
    return () => clearInterval(interval)
  }, [loading, userId])

  // ── Add ticket ────────────────────────────────────────────────────────────────
  const addTicket = useCallback(async (data: TicketFormData) => {
    const now = new Date()
    const newTicket: Ticket = {
      id: makeTicketId(),
      userId,
      customer: data.customer.trim(),
      customerTier: data.customerTier,
      issue: data.issue.trim(),
      category: data.category,
      priority: data.priority,
      originalPriority: data.priority,
      status: 'pending',
      arrivalTime: now,
      waitingTime: 0,
      burstTime: data.burstTime,
      lastAgingCheck: now,
      agedCount: 0,
      reopenCount: 0,
      slaDeadline: new Date(now.getTime() + SLA_THRESHOLDS[data.customerTier] * 60 * 1000),
      slaBreached: false,
    }
    setTickets(prev => [...prev, newTicket])
    await saveTicket(newTicket, userId)
  }, [userId])

  // ── Process next ticket ───────────────────────────────────────────────────────
  const processNextTicket = useCallback(async () => {
    const comparator = makeComparator(pinnedId)
    const pending = tickets
      .filter(t => t.status === 'pending' || t.status === 'reopened')
      .sort(comparator)
    if (pending.length === 0) return

    const top = pending[0]
    const now = new Date()
    const availAgent = agents.find(a => a.status === 'available')

    const resolved: Ticket = { ...top, status: 'resolved', resolvedAt: now, startTime: now, agentId: availAgent?.id }
    setTickets(prev => prev.map(t => t.id === top.id ? resolved : t))
    await saveTicket(resolved, userId)

    const logEntry: ExecutionLogEntry = {
      order: executionOrderRef.current++,
      ticketId: top.id,
      customer: top.customer,
      customerTier: top.customerTier,
      issue: top.issue,
      category: top.category,
      initialPriority: top.originalPriority,
      finalPriority: top.priority,
      resolvedAt: now,
      waitedSeconds: top.waitingTime,
      burstTime: top.burstTime,
      turnaroundTime: Math.floor((now.getTime() - top.arrivalTime.getTime()) / 1000),
      agentId: availAgent?.id,
      wasManualOverride: top.id === pinnedId,
      overrideReason: top.id === pinnedId ? pinReason : undefined,
      wasReopened: top.reopenCount > 0,
      slaBreached: top.slaBreached,
    }
    setExecutionLog(prev => [...prev, logEntry])
    await saveLogEntry(logEntry, userId)

    if (availAgent) {
      setAgents(ag => ag.map(a => a.id === availAgent.id
        ? { ...a, status: 'busy', currentTicketId: top.id, resolvedCount: a.resolvedCount + 1 }
        : a))
      setTimeout(() => {
        setAgents(ag => ag.map(a => a.id === availAgent.id
          ? { ...a, status: 'available', currentTicketId: undefined } : a))
      }, Math.min(top.burstTime * 500, 5000))
    }

    if (top.id === pinnedId) { setPinnedId(null); setPinReason('') }
  }, [tickets, pinnedId, pinReason, agents, userId])

  // ── Resolve a specific ticket ─────────────────────────────────────────────────
  const resolveTicket = useCallback(async (id: string) => {
    const ticket = tickets.find(t => t.id === id)
    if (!ticket || ticket.status === 'resolved') return
    const now = new Date()
    const resolved: Ticket = { ...ticket, status: 'resolved', resolvedAt: now }
    setTickets(prev => prev.map(t => t.id === id ? resolved : t))
    await saveTicket(resolved, userId)

    const logEntry: ExecutionLogEntry = {
      order: executionOrderRef.current++,
      ticketId: ticket.id,
      customer: ticket.customer,
      customerTier: ticket.customerTier,
      issue: ticket.issue,
      category: ticket.category,
      initialPriority: ticket.originalPriority,
      finalPriority: ticket.priority,
      resolvedAt: now,
      waitedSeconds: ticket.waitingTime,
      burstTime: ticket.burstTime,
      turnaroundTime: Math.floor((now.getTime() - ticket.arrivalTime.getTime()) / 1000),
      wasManualOverride: false,
      wasReopened: ticket.reopenCount > 0,
      slaBreached: ticket.slaBreached,
    }
    setExecutionLog(prev => [...prev, logEntry])
    await saveLogEntry(logEntry, userId)
    if (id === pinnedId) { setPinnedId(null); setPinReason('') }
  }, [tickets, pinnedId, userId])

  // ── Reopen ticket ─────────────────────────────────────────────────────────────
  const reopenTicket = useCallback(async (id: string) => {
    const ticket = tickets.find(t => t.id === id)
    if (!ticket || ticket.status !== 'resolved') return
    const now = new Date()
    const reopened: Ticket = {
      ...ticket, status: 'reopened', resolvedAt: undefined,
      arrivalTime: now, waitingTime: 0, lastAgingCheck: now,
      reopenCount: ticket.reopenCount + 1,
      priority: ticket.originalPriority, agedCount: 0,
      slaDeadline: new Date(now.getTime() + SLA_THRESHOLDS[ticket.customerTier] * 60 * 1000),
      slaBreached: false,
    }
    setTickets(prev => prev.map(t => t.id === id ? reopened : t))
    await saveTicket(reopened, userId)
  }, [tickets, userId])

  // ── Delete a single ticket ────────────────────────────────────────────────────
  const deleteTicket = useCallback(async (id: string) => {
    setTickets(prev => prev.filter(t => t.id !== id))
    await deleteTicketFromDb(id)
    if (id === pinnedId) { setPinnedId(null); setPinReason('') }
  }, [pinnedId])

  // ── Delete a single log entry ─────────────────────────────────────────────────
  const deleteLogEntryById = useCallback(async (entryId: string) => {
    setExecutionLog(prev => prev.filter(e => e.id !== entryId))
    await deleteLogEntry(entryId)
  }, [])

  // ── Clear all tickets ─────────────────────────────────────────────────────────
  const clearAllTickets = useCallback(async () => {
    setTickets([])
    setPinnedId(null)
    setPinReason('')
    await deleteAllTickets()
  }, [])

  // ── Clear entire execution log ────────────────────────────────────────────────
  const clearAllLog = useCallback(async () => {
    setExecutionLog([])
    executionOrderRef.current = 1
    await deleteAllLogEntries()
  }, [])

  // ── Pin toggle ────────────────────────────────────────────────────────────────
  const pinTicket = useCallback((id: string) => {
    setPinnedId(prev => prev === id ? null : id)
    if (pinnedId === id) setPinReason('')
  }, [pinnedId])

  // ── Load sample data ──────────────────────────────────────────────────────────
  const loadSampleData = useCallback(async () => {
    resetIdCounter(1)
    executionOrderRef.current = 1
    setPinnedId(null)
    setPinReason('')
    await deleteAllTickets()
    await deleteAllLogEntries()
    const samples = generateSampleTickets(userId)
    setTickets(samples)
    setExecutionLog([])
    setAgents(DEFAULT_AGENTS.map(a => ({ ...a, status: 'available', currentTicketId: undefined, resolvedCount: 0 })))
    await saveTickets(samples, userId)
  }, [userId])

  // ── Derived ───────────────────────────────────────────────────────────────────
  const comparator = makeComparator(pinnedId)
  const sortedPendingTickets = tickets
    .filter(t => t.status === 'pending' || t.status === 'reopened')
    .sort(comparator)

  const pending = tickets.filter(t => t.status === 'pending' || t.status === 'reopened')
  const stats = {
    totalPending: pending.length,
    highCount: pending.filter(t => t.priority === Priority.High).length,
    mediumCount: pending.filter(t => t.priority === Priority.Medium).length,
    lowCount: pending.filter(t => t.priority === Priority.Low).length,
    resolvedCount: tickets.filter(t => t.status === 'resolved').length,
    slaBreachCount: tickets.filter(t => t.slaBreached && t.status !== 'resolved').length,
    inProgressCount: tickets.filter(t => t.status === 'in-progress').length,
  }

  const metrics = computeMetrics(executionLog, tickets)

  const formatWaitTime = useCallback((ticket: Ticket): string => {
    if (ticket.waitingTime < 60) return `${ticket.waitingTime}s`
    return formatDistanceToNow(ticket.arrivalTime, { addSuffix: false })
  }, [])

  return {
    tickets, executionLog, sortedPendingTickets, recentlyAgedIds,
    pinnedId, agents, metrics, pinReason, loading,
    setPinReason, addTicket, processNextTicket,
    resolveTicket, reopenTicket, deleteTicket,
    deleteLogEntryById, clearAllTickets, clearAllLog,
    pinTicket, loadSampleData, stats, formatWaitTime,
  }
}
