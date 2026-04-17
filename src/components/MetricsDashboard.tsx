import { type QueueMetrics } from '@/types/ticket'
import { TrendingUp, Clock, AlertTriangle, RefreshCw, CheckCircle2, Zap } from 'lucide-react'

export function MetricsDashboard({ metrics }: { metrics: QueueMetrics }) {
  const cards = [
    { icon: Clock,         label: 'Avg Wait',    value: `${metrics.averageWaitTime}s`,          sub: 'avg queue time',         color: 'blue'   },
    { icon: TrendingUp,    label: 'Max Wait',     value: `${metrics.maxWaitTime}s`,              sub: 'worst case wait',        color: 'amber'  },
    { icon: RefreshCw,     label: 'Avg TAT',      value: `${metrics.averageTurnaroundTime}s`,    sub: 'turnaround time',        color: 'indigo' },
    { icon: Zap,           label: 'Starvation',   value: metrics.stavedTickets,                  sub: 'tickets aged up',        color: 'purple' },
    { icon: AlertTriangle, label: 'SLA Breaches', value: metrics.slaBreachCount,                 sub: 'SLA violations',         color: 'red'    },
    { icon: CheckCircle2,  label: 'Processed',    value: metrics.totalProcessed,                 sub: 'total resolved',         color: 'green'  },
  ]

  const bg: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-100', amber: 'bg-amber-50 border-amber-100',
    indigo: 'bg-indigo-50 border-indigo-100', purple: 'bg-purple-50 border-purple-100',
    red: 'bg-red-50 border-red-100', green: 'bg-emerald-50 border-emerald-100',
  }
  const txt: Record<string, string> = {
    blue: 'text-blue-700', amber: 'text-amber-700', indigo: 'text-indigo-700',
    purple: 'text-purple-700', red: 'text-red-700', green: 'text-emerald-700',
  }
  const ic: Record<string, string> = {
    blue: 'text-blue-500', amber: 'text-amber-500', indigo: 'text-indigo-500',
    purple: 'text-purple-500', red: 'text-red-500', green: 'text-emerald-500',
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-3 border-b border-slate-100">
        <h2 className="text-sm font-semibold text-slate-800">Live Queue Metrics</h2>
        <p className="text-xs text-slate-500">Real-time statistics — updates as tickets are processed</p>
      </div>
      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {cards.map(({ icon: Icon, label, value, sub, color }) => (
          <div key={label} className={`rounded-xl border p-3 flex flex-col gap-1.5 ${bg[color]}`}>
            <Icon className={`w-4 h-4 ${ic[color]}`} />
            <div className={`text-xl font-bold ${txt[color]}`}>{value}</div>
            <div className={`text-xs font-semibold ${txt[color]}`}>{label}</div>
            <div className="text-xs text-slate-400">{sub}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
