-- ============================================================
-- SUPABASE SETUP SQL
-- Run this entire file in your Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → Paste → Run
-- ============================================================

-- 1. TICKETS TABLE
create table if not exists public.tickets (
  id            text primary key,
  user_id       uuid references auth.users(id) on delete cascade not null,
  customer      text not null,
  customer_tier text not null default 'free',
  issue         text not null,
  category      text not null default 'general',
  priority      text not null,
  original_priority text not null,
  status        text not null default 'pending',
  arrival_time  timestamptz not null default now(),
  waiting_time  integer not null default 0,
  burst_time    integer not null default 10,
  aged_count    integer not null default 0,
  reopen_count  integer not null default 0,
  sla_breached  boolean not null default false,
  sla_deadline  timestamptz not null default now(),
  last_aging_check timestamptz not null default now(),
  resolved_at   timestamptz,
  agent_id      text,
  pin_reason    text,
  created_at    timestamptz not null default now()
);

-- 2. EXECUTION LOG TABLE
create table if not exists public.execution_log (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete cascade not null,
  order_num       integer not null,
  ticket_id       text not null,
  customer        text not null,
  customer_tier   text not null default 'free',
  issue           text not null,
  category        text not null default 'general',
  initial_priority text not null,
  final_priority  text not null,
  resolved_at     timestamptz not null,
  waited_seconds  integer not null default 0,
  burst_time      integer not null default 10,
  turnaround_time integer not null default 0,
  agent_id        text,
  was_manual_override boolean not null default false,
  override_reason text,
  was_reopened    boolean not null default false,
  sla_breached    boolean not null default false,
  created_at      timestamptz not null default now()
);

-- 3. ROW LEVEL SECURITY
alter table public.tickets enable row level security;
alter table public.execution_log enable row level security;

-- Each user only sees their own tickets
create policy "Users manage own tickets"
  on public.tickets for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Each user only sees their own execution log
create policy "Users manage own log"
  on public.execution_log for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 4. INDEXES for performance
create index if not exists tickets_user_id_idx on public.tickets(user_id);
create index if not exists tickets_status_idx on public.tickets(status);
create index if not exists execution_log_user_id_idx on public.execution_log(user_id);
create index if not exists execution_log_order_idx on public.execution_log(user_id, order_num);
