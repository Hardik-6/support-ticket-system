import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { ListOrdered, CheckCircle2, Pin, AlertTriangle, RotateCcw, Trash2 } from 'lucide-react'
import { type ExecutionLogEntry } from '@/types/ticket'
import { PriorityBadge } from './PriorityBadge'

const TIER_PILL: Record<string, string> = {
  enterprise: 'bg-purple-100 text-purple-700',
  pro:        'bg-blue-100 text-blue-700',
  free:       'bg-slate-100 text-slate-600',
}

interface Props {
  entries: ExecutionLogEntry[]
  onDeleteEntry: (id: string) => void
  onClearAll: () => void
}

export function ExecutionLog({ entries, onDeleteEntry, onClearAll }: Props) {
  const sorted = [...entries].reverse()

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
            <ListOrdered className="w-4 h-4 text-slate-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-800">Execution Log</h2>
              {entries.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">{entries.length}</span>
              )}
            </div>
            <p className="text-xs text-slate-500">All records saved permanently — visible after page refresh.</p>
          </div>
        </div>
        {entries.length > 0 && (
          <button onClick={onClearAll}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition">
            <Trash2 className="w-3.5 h-3.5" /> Clear Log
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 gap-2 text-slate-400">
          <CheckCircle2 className="w-8 h-8 text-slate-200" />
          <p className="text-xs">No tickets resolved yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['#', 'ID', 'Customer', 'Category', 'Initial', 'Final', 'BT', 'WT', 'TAT', 'Agent', 'Override', 'SLA', 'Resolved At', ''].map(h => (
                  <th key={h} className="px-3 py-2.5 text-left text-slate-400 font-semibold uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {sorted.map(entry => {
                  const wasAged = entry.initialPriority !== entry.finalPriority
                  return (
                    <motion.tr key={entry.id ?? entry.order}
                      initial={{ opacity: 0, backgroundColor: entry.slaBreached ? '#fef2f2' : entry.wasManualOverride ? '#faf5ff' : '#f0fdf4' }}
                      animate={{ opacity: 1, backgroundColor: '#ffffff' }}
                      transition={{ duration: 0.5 }}
                      className="border-b border-slate-50 hover:bg-slate-50 transition-colors group">
                      <td className="px-3 py-2.5 font-bold text-slate-500">#{entry.order}</td>
                      <td className="px-3 py-2.5 font-mono text-slate-400 whitespace-nowrap">{entry.ticketId}</td>
                      <td className="px-3 py-2.5">
                        <div className="font-semibold text-slate-700 whitespace-nowrap">{entry.customer}</div>
                        <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${TIER_PILL[entry.customerTier]}`}>{entry.customerTier}</span>
                      </td>
                      <td className="px-3 py-2.5 capitalize text-slate-500 whitespace-nowrap">{entry.category}</td>
                      <td className="px-3 py-2.5"><PriorityBadge priority={entry.initialPriority} /></td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1">
                          <PriorityBadge priority={entry.finalPriority} />
                          {wasAged && <span className="text-amber-600 font-semibold">↑aged</span>}
                          {entry.wasReopened && <RotateCcw className="w-3 h-3 text-orange-500" />}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-slate-500 whitespace-nowrap">{entry.burstTime}m</td>
                      <td className="px-3 py-2.5 font-mono text-slate-500 whitespace-nowrap">{entry.waitedSeconds}s</td>
                      <td className="px-3 py-2.5 font-mono text-slate-500 whitespace-nowrap">{entry.turnaroundTime}s</td>
                      <td className="px-3 py-2.5 text-slate-400 whitespace-nowrap">{entry.agentId ?? '—'}</td>
                      <td className="px-3 py-2.5">
                        {entry.wasManualOverride ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-200">
                              <Pin className="w-3 h-3" />Manual
                            </span>
                            {entry.overrideReason && <div className="text-xs text-purple-500 mt-0.5 max-w-[100px] truncate">{entry.overrideReason}</div>}
                          </div>
                        ) : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-3 py-2.5">
                        {entry.slaBreached
                          ? <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200"><AlertTriangle className="w-3 h-3" />Breached</span>
                          : <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">✓ Met</span>
                        }
                      </td>
                      <td className="px-3 py-2.5 text-slate-400 font-mono whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          {format(entry.resolvedAt, 'HH:mm:ss')}
                        </div>
                      </td>
                      {/* Delete single entry */}
                      <td className="px-3 py-2.5">
                        {entry.id && (
                          <button onClick={() => onDeleteEntry(entry.id!)}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </motion.tr>
                  )
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
