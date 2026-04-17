import { useState, useEffect } from 'react'
import { type Session } from '@supabase/supabase-js'
import { Activity, LogOut, User, Database, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { AuthPage } from '@/pages/AuthPage'
import { useTicketSystem } from '@/hooks/use-ticket-system'
import { TicketForm } from '@/components/TicketForm'
import { TicketQueue } from '@/components/TicketQueue'
import { ExecutionLog } from '@/components/ExecutionLog'
import { AlgorithmExplainer } from '@/components/AlgorithmExplainer'
import { StatsBar } from '@/components/StatsBar'
import { MetricsDashboard } from '@/components/MetricsDashboard'

// ── Loading spinner ───────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center animate-pulse">
        <Activity className="w-7 h-7 text-white" />
      </div>
      <div className="flex items-center gap-2 text-slate-500 text-sm">
        <RefreshCw className="w-4 h-4 animate-spin" />
        <span>Loading your tickets...</span>
      </div>
    </div>
  )
}

// ── Main dashboard (shown after login) ───────────────────────────────────────
function Dashboard({ session }: { session: Session }) {
  const userName = session.user.user_metadata?.full_name ?? session.user.email ?? 'User'
  const userId = session.user.id

  const {
    sortedPendingTickets, executionLog, recentlyAgedIds,
    pinnedId, agents, metrics, pinReason, loading,
    setPinReason, addTicket, processNextTicket,
    resolveTicket, reopenTicket, deleteTicket,
    deleteLogEntryById, clearAllTickets, clearAllLog,
    pinTicket, loadSampleData, stats, formatWaitTime,
  } = useTicketSystem({ userId })

  const handleSignOut = async () => { await supabase.auth.signOut() }

  if (loading) return <LoadingScreen />

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3.5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* Logo + title */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold text-slate-900">Support Ticket System</h1>
                <p className="text-xs text-slate-500">Priority Scheduling · Aging · Multi-Agent · SLA · Database</p>
              </div>
            </div>

            {/* Right side: stats + user */}
            <div className="flex items-center gap-3 flex-wrap">
              <StatsBar stats={stats} />
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200">
                <Database className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-xs font-semibold text-emerald-700">Live DB</span>
              </div>
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-xs font-medium text-slate-700 max-w-[140px] truncate">{userName}</span>
                </div>
                <button onClick={handleSignOut}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-red-600 bg-slate-100 hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-lg transition">
                  <LogOut className="w-3.5 h-3.5" /> Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">

        {/* Metrics */}
        <MetricsDashboard metrics={metrics} />

        {/* Two column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6">
          {/* Left: form + explainer */}
          <div className="space-y-5">
            <TicketForm onSubmit={addTicket} onLoadSamples={loadSampleData} />
            <AlgorithmExplainer />
          </div>

          {/* Right: live queue */}
          <TicketQueue
            tickets={sortedPendingTickets}
            recentlyAgedIds={recentlyAgedIds}
            pinnedId={pinnedId}
            agents={agents}
            pinReason={pinReason}
            setPinReason={setPinReason}
            onProcessNext={processNextTicket}
            onResolve={resolveTicket}
            onDelete={deleteTicket}
            onPin={pinTicket}
            onReopen={reopenTicket}
            onClearAll={clearAllTickets}
            formatWaitTime={formatWaitTime}
          />
        </div>

        {/* Execution log */}
        <ExecutionLog
          entries={executionLog}
          onDeleteEntry={deleteLogEntryById}
          onClearAll={clearAllLog}
        />
      </main>
    </div>
  )
}

// ── Root App — handles auth state ─────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    // Get current session on mount
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setAuthLoading(false)
    })

    // Listen for auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setAuthLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (authLoading) return <LoadingScreen />
  if (!session) return <AuthPage />
  return <Dashboard session={session} />
}
