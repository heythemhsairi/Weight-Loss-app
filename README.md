# Steady — coach-guided weight-loss companion

A private, single-user app to track weight, meals, workouts, rest days, and daily
mood/energy **alongside your real coach** — and to surface honest, health-safe
warnings (too-fast loss, missed workouts, frequent cheat meals, prolonged low
energy) that always point you back to your coach.

> ⚠️ This is a personal tracking tool, **not medical or nutritional advice**. It
> does not replace your coach, doctor, or dietitian.

## Quick start (Supabase-backed)

Data lives in **Supabase** (Postgres) so it syncs across devices. Single-user mode:
no login; all rows are owned by one fixed record.

1. **Create a Supabase project** → https://supabase.com/dashboard (free tier is fine).
2. **Apply the schema:** open the project → **SQL Editor → New query**, paste the
   contents of [`supabase/schema.sql`](supabase/schema.sql), and **Run**.
3. **Add credentials:** project → **Settings → API**, copy the **Project URL** and
   **anon public** key into `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR-REF.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
4. **Run it:**
   ```bash
   npm install
   npm run seed     # optional: loads ~5 weeks of demo data into Supabase
   npm run dev      # http://localhost:3100
   ```

To start empty, skip `npm run seed` — you'll land on the onboarding flow.
To wipe and re-seed, just run `npm run seed` again (it clears first).

## What's built (MVP)

- **Onboarding + health disclaimer** (required accept)
- **Dashboard** — today snapshot, weekly rate, warnings, quick actions, trend chart
- **Weight** — log + 7-day moving-average chart + too-fast/plateau guardrails
- **Meals** — per-day log, calories vs. target, followed/partial/cheated + notes
- **Workouts** — training/rest, completed/missed/partial, coach's exercise checklist
- **Daily check-in** — mood/energy/motivation/sleep/stress + "can I train today?"
- **Calendar** — month view with ✅ ❌ 😴 🍔 ⚖️ 📝 indicators
- **Insights** — adherence stats + problem-detection flags routed to your coach

## Architecture

- **Next.js 15 (App Router) + React 19 + TypeScript + Tailwind**
- **Data:** Supabase (Postgres). All access is isolated in `src/lib/supabase.ts` +
  `src/lib/queries.ts` — pages never touch Supabase directly. Queries are async
  server-side calls; mutations run through server actions in `src/app/actions.ts`.
- **Single-user / auth:** no login. Tables use permissive RLS for the `anon` key.
  To go multi-user later, swap `supabase.ts` for a per-request authed client and
  replace the `*_anon_all` policies in `schema.sql` with per-user RLS.
- **Logic:** `src/lib/logic.ts` holds progress math (moving average, weekly rate,
  projection) and the tunable problem-detection thresholds.
- **Mutations:** server actions in `src/app/actions.ts`.

## Health guardrails (tunable in `src/lib/logic.ts`)

| Flag | Default trigger |
|---|---|
| Too-fast loss | > 1% body weight / week |
| Plateau | < 0.1% / week for 2+ weeks of data |
| Missed workouts | ≥ 3 missed in rolling 7 days |
| Frequent cheating | ≥ 4 cheat meals in 7 days |
| Low energy/mood | mood or energy ≤ 2 for 4+ consecutive days |
| Overtraining | trained on ≥ 2 days flagged "can't train" |

Every flag links the user back to their coach — never to a crash diet.

## Next steps (not yet built)

Coach plan templates (weekly repeat) + plan-vs-actual reports, push notifications
(Vercel Cron), photo progress, wearable sync, PDF export, multi-user + Supabase.
