import { Priority } from '@/types/ticket'
import { PriorityBadge } from './PriorityBadge'

export function StatsBar({ stats }: {
  stats: {
    totalPending: number; highCount: number; mediumCount: number;
    lowCount: number; resolvedCount: number; slaBreachCount: number; inProgressCount: number
  }
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200">
        <span className="text-xs font-semibold text-slate-600">Pending:</span>
        <span className="text-sm font-bold text-slate-800">{stats.totalPending}</span>
      </div>
      {stats.inProgressCount > 0 && (
        <div className="px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200">
          <span className="text-xs font-bold text-blue-700">{stats.inProgressCount} in progress</span>
        </div>
      )}
      {stats.highCount > 0 && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 border border-red-200">
          <PriorityBadge priority={'high' as Priority} variant="dot" />
          <span className="text-xs font-bold text-red-700">{stats.highCount} High</span>
        </div>
      )}
      {stats.mediumCount > 0 && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200">
          <PriorityBadge priority={'medium' as Priority} variant="dot" />
          <span className="text-xs font-bold text-amber-700">{stats.mediumCount} Medium</span>
        </div>
      )}
      {stats.lowCount > 0 && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200">
          <PriorityBadge priority={'low' as Priority} variant="dot" />
          <span className="text-xs font-bold text-emerald-700">{stats.lowCount} Low</span>
        </div>
      )}
      {stats.slaBreachCount > 0 && (
        <div className="px-3 py-1.5 rounded-lg bg-red-100 border border-red-300">
          <span className="text-xs font-bold text-red-800">⚠ {stats.slaBreachCount} SLA breached</span>
        </div>
      )}
      {stats.resolvedCount > 0 && (
        <div className="px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200">
          <span className="text-xs font-semibold text-slate-500">✓ {stats.resolvedCount} resolved</span>
        </div>
      )}
    </div>
  )
}
