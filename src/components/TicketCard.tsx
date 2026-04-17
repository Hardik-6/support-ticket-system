import { motion } from 'framer-motion'
import { Clock, CheckCircle, Trash2, ArrowUp, Zap, Pin, PinOff, RotateCcw, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'
import { type Ticket, Priority, AGING_CONFIG } from '@/types/ticket'
import { PriorityBadge } from './PriorityBadge'
import { cn } from '@/lib/utils'

interface Props {
  ticket: Ticket
  rank?: number
  isNext: boolean
  isRecentlyAged: boolean
  isPinned: boolean
  onResolve: (id: string) => void
  onDelete: (id: string) => void
  onPin: (id: string) => void
  onReopen?: (id: string) => void
  formatWaitTime: (t: Ticket) => string
}

const TIER_PILL: Record<string, string> = {
  enterprise: 'bg-purple-100 text-purple-700 border-purple-200',
  pro:        'bg-blue-100 text-blue-700 border-blue-200',
  free:       'bg-slate-100 text-slate-500 border-slate-200',
}
const L_BORDER: Record<Priority, string> = {
  [Priority.High]:   'border-l-red-400',
  [Priority.Medium]: 'border-l-amber-400',
  [Priority.Low]:    'border-l-emerald-400',
}
const BAR_COLOR: Record<Priority, string> = {
  [Priority.High]:   'bg-red-400',
  [Priority.Medium]: 'bg-amber-400',
  [Priority.Low]:    'bg-emerald-400',
}

export function TicketCard({ ticket, rank, isNext, isRecentlyAged, isPinned, onResolve, onDelete, onPin, onReopen, formatWaitTime }: Props) {
  const isResolved = ticket.status === 'resolved'
  const isReopened = ticket.status === 'reopened'

  return (
    <motion.div
      layoutId={ticket.id} layout
      initial={{ opacity: 0, y: -10 }}
      animate={{
        opacity: isResolved ? 0.5 : 1, y: 0,
        boxShadow: isPinned
          ? '0 0 0 2px #7C3AED, 0 4px 16px rgba(124,58,237,0.15)'
          : isRecentlyAged
          ? '0 0 0 2px #f59e0b, 0 4px 12px rgba(245,158,11,0.15)'
          : ticket.slaBreached
          ? '0 0 0 2px #ef4444, 0 4px 12px rgba(239,68,68,0.1)'
          : '0 1px 4px rgba(0,0,0,0.06)',
      }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.25, layout: { duration: 0.35, type: 'spring', stiffness: 220 } }}
      className={cn(
        'bg-white rounded-xl border border-slate-200 border-l-4 overflow-hidden',
        !isResolved && L_BORDER[ticket.priority],
        isResolved && 'border-l-slate-200',
        isPinned && 'ring-2 ring-purple-500 ring-offset-1',
        ticket.slaBreached && !isPinned && !isResolved && 'ring-1 ring-red-300',
        isReopened && 'border-l-orange-400',
      )}
    >
      <div className="px-4 py-3">
        {/* Top row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {rank !== undefined && (
              <span className={cn('flex-shrink-0 w-6 h-6 rounded-md text-xs font-bold flex items-center justify-center',
                isPinned ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-500')}>
                {isResolved ? '✓' : rank}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono text-slate-400">{ticket.id}</span>
                <span className="text-sm font-semibold text-slate-800">{ticket.customer}</span>
                <span className={cn('text-xs px-1.5 py-0.5 rounded border font-semibold', TIER_PILL[ticket.customerTier])}>
                  {ticket.customerTier}
                </span>
                {isPinned && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-purple-600 text-white"><Pin className="w-3 h-3" />Pinned</span>}
                {isNext && !isPinned && !isResolved && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-blue-600 text-white"><Zap className="w-3 h-3" />Up Next</span>}
                {isRecentlyAged && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200"><ArrowUp className="w-3 h-3" />Upgraded</span>}
                {ticket.slaBreached && !isResolved && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200"><AlertTriangle className="w-3 h-3" />SLA Breach</span>}
                {isReopened && <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 border border-orange-200">↺ Reopened ×{ticket.reopenCount}</span>}
              </div>
              <p className="text-xs text-slate-500 mt-0.5 truncate">{ticket.issue}</p>
              <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                <span className="text-xs text-slate-400 capitalize">{ticket.category}</span>
                <span className="text-xs text-slate-400">~{ticket.burstTime}min to resolve</span>
                {ticket.agedCount > 0 && ticket.originalPriority !== ticket.priority && (
                  <span className="text-xs text-amber-600">↑{ticket.agedCount}× aged from {ticket.originalPriority}</span>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <PriorityBadge priority={ticket.priority} />
            {!isResolved && (
              <button onClick={() => onPin(ticket.id)} title={isPinned ? 'Unpin' : 'Force to top'}
                className={cn('p-1.5 rounded-lg transition', isPinned ? 'bg-purple-100 text-purple-600 border border-purple-300' : 'text-slate-400 hover:text-purple-600 hover:bg-purple-50')}>
                {isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
              </button>
            )}
            {!isResolved && (
              <button onClick={() => onResolve(ticket.id)} title="Mark resolved"
                className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition">
                <CheckCircle className="w-4 h-4" />
              </button>
            )}
            {isResolved && onReopen && (
              <button onClick={() => onReopen(ticket.id)} title="Reopen ticket"
                className="p-1.5 rounded-lg text-slate-400 hover:text-orange-600 hover:bg-orange-50 transition">
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
            <button onClick={() => onDelete(ticket.id)} title="Delete ticket"
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Wait bar */}
        {!isResolved && (
          <div className="mt-2 flex items-center gap-2">
            <Clock className="w-3 h-3 text-slate-400 flex-shrink-0" />
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <motion.div className={cn('h-full rounded-full', BAR_COLOR[ticket.priority])}
                animate={{ width: `${Math.min((ticket.waitingTime / 60) * 100, 100)}%` }}
                transition={{ duration: 0.8 }} />
            </div>
            <span className="text-xs text-slate-500 font-mono">{formatWaitTime(ticket)}</span>
            <span className="text-xs text-slate-400">since {format(ticket.arrivalTime, 'HH:mm:ss')}</span>
          </div>
        )}

        {/* Aging countdown */}
        {!isResolved && ticket.priority !== Priority.High && (
          <div className="mt-1 text-xs text-slate-400">
            Aging in ~{Math.max(0, AGING_CONFIG.THRESHOLD_SECONDS - Math.floor((Date.now() - ticket.lastAgingCheck.getTime()) / 1000))}s
            · {ticket.priority === Priority.Low ? 'Low → Medium' : 'Medium → High'}
          </div>
        )}
      </div>
    </motion.div>
  )
}
