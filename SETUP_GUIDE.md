# Setup Guide — Support Ticket System with Supabase

Follow these steps in order. Takes about 10 minutes.

---

## Step 1 — Install Dependencies

Open VS Code terminal in the project folder and run:

```bash
npm install
```

---

## Step 2 — Create Supabase Account

1. Go to https://supabase.com
2. Click **Start your project** and sign up free
3. Click **New Project**
4. Name it: `support-ticket-system`
5. Set a database password (save it somewhere)
6. Choose your region
7. Click **Create new project**
8. Wait ~2 minutes for it to set up

---

## Step 3 — Create Database Tables

1. In Supabase dashboard, click **SQL Editor** in the left sidebar
2. Click **New Query**
3. Open the file `SUPABASE_SETUP.sql` from this project
4. Copy the entire contents and paste into the SQL editor
5. Click **Run**
6. You should see "Success" — tables are now created

---

## Step 4 — Get Your Supabase Keys

1. In Supabase dashboard, click **Settings** (gear icon) in the left sidebar
2. Click **API**
3. You need two values:
   - **Project URL** — looks like `https://xyzabc.supabase.co`
   - **anon public** key — a long string starting with `eyJ...`

---

## Step 5 — Create Your .env File

1. In your project folder, find the file `.env.example`
2. Make a copy of it and rename the copy to `.env`
3. Open `.env` and fill in your values:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Replace the placeholder values with your actual keys from Step 4.

---

## Step 6 — Run the App

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

---

## Step 7 — Create Your Account

1. Click **Create Account** tab
2. Enter your name, email, and password (min 6 characters)
3. Check your email for a confirmation link and click it
4. Come back and sign in

---

## What Happens Now

- Every ticket you add is saved to the database instantly
- Every resolved ticket appears in the execution log permanently
- Refresh the page — all your data is still there
- Sign out and sign back in — all your data is still there
- Each user account has their own private data

---

## Features

| Feature | Description |
|---|---|
| Login / Signup | Secure auth via Supabase |
| Persistent Queue | Tickets survive page refresh |
| Persistent Log | Execution log never resets |
| Delete Ticket | Delete any single ticket from queue |
| Clear All Tickets | Remove all pending tickets at once |
| Delete Log Entry | Hover a row in the log and click trash icon |
| Clear Entire Log | Clear all log entries at once |
| Reopen Ticket | Reopen a resolved ticket — it re-enters the queue |
| Manual Override | Pin any ticket to force it to position #1 |
| SLA Tracking | Enterprise/Pro/Free tiers with different SLA deadlines |
| Aging Algorithm | Priority auto-upgrades every ~10s to prevent starvation |
| Multiple Agents | 3 agents process tickets in parallel |
| Sign Out | Clears session, returns to login page |

---

## Troubleshooting

**"Missing Supabase environment variables" error**
→ Make sure `.env` file exists (not `.env.example`) and has your actual keys

**"Invalid login credentials" on sign in**
→ Check your email and confirm your account first, then try again

**Tickets not saving**
→ Check the browser console for errors. Make sure you ran the SQL setup correctly.

**Page refresh loses data**
→ This should NOT happen with Supabase. If it does, check that `.env` keys are correct.
