import { ArrowRight, Shield, TrendingUp, Clock, Users, Star, Database, Pin } from 'lucide-react'

export function AlgorithmExplainer() {
  const items = [
    { icon: TrendingUp, bg: 'bg-blue-50',   bd: 'border-blue-100',   ic: 'text-blue-600',   title: 'Priority Scheduling',     desc: 'High → Medium → Low. Same priority uses FIFO. Aged tickets rank slightly below natural High.' },
    { icon: Clock,      bg: 'bg-amber-50',  bd: 'border-amber-100',  ic: 'text-amber-600',  title: 'Aging Algorithm',          desc: 'Tickets auto-upgrade priority based on category. Billing ages fastest (~8s), features slowest (~15s).' },
    { icon: Shield,     bg: 'bg-emerald-50',bd: 'border-emerald-100',ic: 'text-emerald-600',title: 'Starvation Prevention',    desc: 'Every ticket is guaranteed to reach High within 20 seconds — no customer waits forever.' },
    { icon: Users,      bg: 'bg-indigo-50', bd: 'border-indigo-100', ic: 'text-indigo-600', title: 'Multiple Agents',          desc: '3 agents work in parallel. Each processed ticket is auto-assigned to an available agent.' },
    { icon: Pin,        bg: 'bg-purple-50', bd: 'border-purple-100', ic: 'text-purple-600', title: 'Manual Override',          desc: 'Pin any ticket to force it to #1. Add a reason — it is recorded in the execution log.' },
    { icon: Star,       bg: 'bg-rose-50',   bd: 'border-rose-100',   ic: 'text-rose-600',   title: 'SLA Rules',                desc: 'Enterprise = 1hr · Pro = 4hr · Free = 24hr. Breaches shown with red ring and warning badge.' },
    { icon: Database,   bg: 'bg-slate-50',  bd: 'border-slate-200',  ic: 'text-slate-600',  title: 'Database Persistence',     desc: 'Every ticket and log entry is saved to Supabase. Refresh the page and all records are restored.' },
  ]

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="text-sm font-semibold text-slate-800">How The System Works</h2>
      </div>
      <div className="p-5 space-y-3">
        {items.map(({ icon: Icon, bg, bd, ic, title, desc }) => (
          <div key={title} className="flex gap-3">
            <div className={`w-8 h-8 rounded-lg ${bg} border ${bd} flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-4 h-4 ${ic}`} />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-slate-700 mb-0.5">{title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
