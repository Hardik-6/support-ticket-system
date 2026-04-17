import { type Priority } from '@/types/ticket'
import { cn } from '@/lib/utils'

const STYLES: Record<string, string> = {
  high:   'bg-red-100 text-red-700 border-red-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  low:    'bg-emerald-100 text-emerald-700 border-emerald-200',
}
const DOTS: Record<string, string> = {
  high: 'bg-red-500', medium: 'bg-amber-500', low: 'bg-emerald-500',
}
const LABELS: Record<string, string> = { high: 'High', medium: 'Medium', low: 'Low' }

export function PriorityBadge({ priority, variant = 'default', className }: {
  priority: Priority; variant?: 'default' | 'dot'; className?: string
}) {
  if (variant === 'dot') return <span className={cn('inline-block w-2.5 h-2.5 rounded-full flex-shrink-0', DOTS[priority], className)} />
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border', STYLES[priority], className)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', DOTS[priority])} />
      {LABELS[priority]}
    </span>
  )
}
