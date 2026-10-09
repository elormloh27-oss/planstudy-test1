# PlanStudy Test1 — AI study planner

Rebuild of PlanStudy with the same core flow (AI day-by-day plans from subject, topics, deadline, hours per day, plus PDF outline auto-fill, focus timer, and breakdowns) with a responsive UI, offline fallback, Today view, streaks, and stats.

## Setup

1. Copy env and fill in (all free tiers):
   ```bash
   cp .env.example .env
   ```
   - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`: from a free Supabase project. Without these the app runs in demo mode with localStorage.
   - `GEMINI_API_KEY`: free Gemini key, set in the Vercel dashboard only (never in Vite). Without it, plan generation uses the offline builder.
2. Install and run:
   ```bash
   npm install
   npm run dev      # local dev
   npm run test -- --run   # unit + smoke tests
   npm run build    # production build
   npm run preview  # serve the build
   ```

## Supabase table

```sql
create table study_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  subject text not null,
  topics text not null,
  deadline date not null,
  hours_per_day int not null,
  plan_json jsonb not null default '[]',
  created_at timestamptz default now()
);
alter table study_plans enable row level security;
create policy "own rows" on study_plans for all using (auth.uid() = user_id);
```

## Deploy (Vercel, free)

- Import the repo, set root to `planstudy-test1`, add `GEMINI_API_KEY` in the dashboard.
- `vercel.json` handles `/api/*` and the SPA fallback.

## Notes

- Demo mode (no keys): plans save to localStorage, AI steps fall back to the offline builder, PDF auto-fill notes that extraction needs the live site.
- Copy follows the repo `de-ai-writing` skill: plain sentences, no AI tells.
