import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PlusCircle, Database } from 'lucide-react'
import { Priority, type TicketFormData } from '@/types/ticket'

const schema = z.object({
  customer:     z.string().min(2, 'At least 2 characters').max(60).trim(),
  customerTier: z.enum(['enterprise', 'pro', 'free']),
  issue:        z.string().min(10, 'At least 10 characters').max(300).trim(),
  category:     z.enum(['billing', 'technical', 'account', 'feature', 'general']),
  priority:     z.nativeEnum(Priority),
  burstTime:    z.coerce.number().min(1, 'Min 1 min').max(480, 'Max 480 min'),
})

export function TicketForm({ onSubmit, onLoadSamples }: {
  onSubmit: (d: TicketFormData) => void; onLoadSamples: () => void
}) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<TicketFormData>({
    resolver: zodResolver(schema),
    defaultValues: { priority: Priority.Low, customerTier: 'free', category: 'general', burstTime: 10 },
  })
  const onValid = (d: TicketFormData) => { onSubmit(d); reset() }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center">
          <PlusCircle className="w-4 h-4 text-blue-600" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-800">Create New Ticket</h2>
          <p className="text-xs text-slate-500">Saved to database instantly — survives page refresh.</p>
        </div>
        <Database className="w-4 h-4 text-emerald-500 ml-auto" />
      </div>

      <form onSubmit={handleSubmit(onValid)} noValidate className="p-5 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Customer Name</label>
            <input {...register('customer')} placeholder="John Doe"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            {errors.customer && <p className="text-xs text-red-500 mt-0.5">{errors.customer.message}</p>}
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Customer Tier</label>
            <select {...register('customerTier')}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="enterprise">Enterprise — SLA 1hr</option>
              <option value="pro">Pro — SLA 4hrs</option>
              <option value="free">Free — SLA 24hrs</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Category</label>
            <select {...register('category')}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="billing">Billing</option>
              <option value="technical">Technical</option>
              <option value="account">Account</option>
              <option value="feature">Feature Request</option>
              <option value="general">General</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Priority</label>
            <select {...register('priority')}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Issue Description</label>
          <textarea {...register('issue')} rows={3} placeholder="Describe the issue..."
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          {errors.issue && <p className="text-xs text-red-500 mt-0.5">{errors.issue.message}</p>}
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Est. Resolution Time (minutes)</label>
          <input {...register('burstTime')} type="number" min={1} max={480} placeholder="10"
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          {errors.burstTime && <p className="text-xs text-red-500 mt-0.5">{errors.burstTime.message}</p>}
        </div>

        <div className="flex gap-2 pt-1">
          <button type="submit"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition">
            <PlusCircle className="w-4 h-4" /> Add to Queue
          </button>
          <button type="button" onClick={onLoadSamples}
            className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition">
            Sample Data
          </button>
        </div>
      </form>
    </div>
  )
}
