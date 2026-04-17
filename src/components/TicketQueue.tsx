import { AnimatePresence } from 'framer-motion'
import { Clock, ChevronRight, Inbox, RefreshCw, Pin, Users, Trash2 } from 'lucide-react'
import { type Ticket, type Agent } from '@/types/ticket'
import { TicketCard } from './TicketCard'

interface Props {
  tickets: Ticket[]
  recentlyAgedIds: Set<string>
  pinnedId: string | null
  agents: Agent[]
  pinReason: string
  setPinReason: (r: string) => void
  onProcessNext: () => void
  onResolve: (id: string) => void
  onDelete: (id: string) => void
  onPin: (id: string) => void
  onReopen: (id: string) => void
  onClearAll: () => void
  formatWaitTime: (t: Ticket) => string
}

export function TicketQueue({
  tickets, recentlyAgedIds, pinnedId, agents, pinReason, setPinReason,
  onProcessNext, onResolve, onDelete, onPin, onReopen, onClearAll, formatWaitTime,
}: Props) {
  const nextTicket = tickets[0]
  const freeAgents = agents.filter(a => a.status === 'available').length

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0">
            <Clock className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-semibold text-slate-800">Live Ticket Queue</h2>
              {tickets.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">{tickets.length}</span>
              )}
              {pinnedId && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-200">
                  <Pin className="w-3 h-3" />Override active
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-0.5">
              <p className="text-xs text-slate-500">All tickets saved to database automatically</p>
              <div className="flex items-center gap-1 text-xs text-emerald-600">
                <Users className="w-3 h-3" />{freeAgents}/{agents.length} agents free
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {tickets.length > 0 && (
            <button onClick={onClearAll} title="Clear all pending tickets"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition">
              <Trash2 className="w-3.5 h-3.5" /> Clear All
            </button>
          )}
          <button onClick={onProcessNext} disabled={tickets.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed">
            <RefreshCw className="w-3.5 h-3.5" /> Process Next
          </button>
        </div>
      </div>

      {/* Agents status */}
      <div className="px-5 py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-4 flex-wrap">
        {agents.map(agent => (
          <div key={agent.id} className="flex items-center gap-1.5 text-xs">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${agent.status === 'available' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span className="text-slate-600 font-medium">{agent.name}</span>
            <span className="text-slate-400">{agent.status === 'busy' ? `→ ${agent.currentTicketId}` : 'free'}</span>
            <span className="text-slate-300">·</span>
            <span className="text-slate-400">{agent.resolvedCount} done</span>
          </div>
        ))}
      </div>

      {/* Pin reason input */}
      {pinnedId && (
        <div className="px-5 py-2 bg-purple-50 border-b border-purple-100 flex items-center gap-2">
          <Pin className="w-3 h-3 text-purple-500 flex-shrink-0" />
          <input type="text" value={pinReason} onChange={e => setPinReason(e.target.value)}
            placeholder="Enter reason for override (saved to execution log)..."
            className="flex-1 text-xs bg-transparent border-none outline-none text-purple-700 placeholder-purple-400" />
        </div>
      )}

      {/* Tip bar */}
      <div className="px-5 py-1.5 bg-blue-50 border-b border-blue-100">
        <span className="text-xs text-blue-600">
          <Pin className="w-3 h-3 inline mr-1" />
          Pin any ticket to force it next. Red ring = SLA breached. Orange = reopened ticket.
        </span>
      </div>

      {/* Queue list */}
      <div className="p-4 space-y-2.5 min-h-[180px]">
        {tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 gap-3 text-slate-400">
            <Inbox className="w-10 h-10 text-slate-300" />
            <p className="text-sm font-medium">Queue is empty</p>
            <p className="text-xs text-slate-400">Add a ticket or load sample data.</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {tickets.map((ticket, i) => (
              <TicketCard key={ticket.id} ticket={ticket} rank={i + 1}
                isNext={i === 0} isRecentlyAged={recentlyAgedIds.has(ticket.id)}
                isPinned={ticket.id === pinnedId}
                onResolve={onResolve} onDelete={onDelete} onPin={onPin} onReopen={onReopen}
                formatWaitTime={formatWaitTime} />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Next hint */}
      {nextTicket && (
        <div className="px-5 py-2.5 border-t flex items-center gap-2"
          style={{ background: pinnedId ? '#faf5ff' : '#eff6ff', borderColor: pinnedId ? '#e9d5ff' : '#dbeafe' }}>
          <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: pinnedId ? '#7c3aed' : '#3b82f6' }} />
          <span className="text-xs truncate" style={{ color: pinnedId ? '#5b21b6' : '#1d4ed8' }}>
            {pinnedId ? 'Pinned — next: ' : 'Next: '}
            <strong>{nextTicket.customer}</strong> — {nextTicket.issue}
          </span>
        </div>
      )}
    </div>
  )
}
