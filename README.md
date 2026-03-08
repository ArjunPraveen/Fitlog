# FitLog

A Fitbod-inspired workout tracking app for a small group of users. Track exercises, log sets in real time, see muscle recovery, and follow friends' progress.

---

## Iterations

<details>
<summary>View all iterations</summary>

| # | Date | What changed |
|---|---|---|
| 13 | 2026-03-09 | **Nav speed fixes** — `loading.tsx` skeletons on dashboard/history/progress so skeleton appears instantly on tab click; switched proxy.ts from `getUser()` (Supabase network call) to `getSession()` (local cookie decode) eliminating ~200ms auth roundtrip per navigation |
| 12 | 2026-03-09 | **Performance fixes** — static import for exercises (was dynamic `await import()` on every dashboard render); parallelised workout + sets fetches (`Promise.all`); overload hints now load non-blocking after page renders; reduced historical sets query from 200 → 60 rows; added limit to dashboard sets query |
| 11 | 2026-03-08 | **Athletic Dark redesign** — replaced Elegant Luxury theme with Athletic Dark: pure black bg, electric lime accent (`oklch(0.88 0.26 130)`), `Barlow Condensed` for display/headings + `DM Sans` for body, lime active states throughout, sharper cards with subtle lime top border, stopwatch uses Barlow Condensed 8xl |
| 10 | 2026-03-08 | **Cancel workout** — trash icon in active workout header triggers an inline confirmation banner; confirms before deleting the workout and returning to dashboard |
| 9 | 2026-03-08 | **Stopwatch UI + button fix** — stopwatch enlarged to 6xl centred display; fixed base-ui `nativeButton` warning on Resume button in dashboard |
| 8 | 2026-03-08 | **Stopwatch + history by day + template from history + dashboard recents** — live 2.5h auto-finishing stopwatch; history grouped by day with in-progress workouts surfaced; save-as-template on each history card; last 3 workouts on dashboard; DB migration: `exercise_ids` `UUID[]` → `TEXT[]` |
| 7 | 2026-03-08 | **Save as template (from workout)** — "Save template" button on completed workout pages with inline name input, saves to `workout_templates` |
| 6 | 2026-03-08 | **Supabase connection** — ran schema SQL, added `.env.local`, restored all real queries, renamed `middleware.ts` → `proxy.ts` for Next.js 16 |
| 5 | 2026-03-07 | **Docs + GitHub** — wrote README, pushed to `ArjunPraveen/Fitlog` via correct GitHub account |
| 4 | 2026-03-07 | **Layout fixes** — equalised workout-entry card heights; fixed sticky CTA appearing behind bottom nav |
| 3 | 2026-03-07 | **Font + colour tweaks** — tried Space Grotesk → settled on Figtree; toned down gold to a more muted warm tone |
| 2 | 2026-03-07 | **Elegant Luxury UI** — dark theme with muted gold accent, floating bottom nav (4 icons), Framer Motion transitions + stagger + recovery bar animations, Figtree font, fixed CSS variable scoping for Next.js font |
| 1 | 2026-03-07 | **Initial scaffold** — Next.js + Supabase monolith, DB schema + RLS, 28-exercise hardcoded library, muscle recovery engine, progressive overload hints, Strava-style social follow system |

</details>

---

## Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend + API | Next.js 16 (App Router) | Fullstack monolith, free on Vercel |
| Database | Supabase (PostgreSQL) | Free tier, managed auth + storage built in |
| Auth | Supabase Auth | JWT via httpOnly cookies, no extra service |
| UI Components | shadcn/ui v4 (base-ui) | No runtime dependency, fully customizable |
| Styling | Tailwind CSS v4 | Utility-first, co-located with components |
| Animations | Framer Motion | Page transitions, stagger effects, bar fills |
| Charts | Recharts | Lightweight, composable line charts |
| Font | Figtree (next/font/google) | Clean, modern, self-hosted by Next.js |
| Hosting | Vercel (free hobby tier) | Deploy from GitHub, zero config |

---

## Key Design Decisions

### Architecture
- **Monolith over microservices** — 4-5 users max, no need for distributed complexity
- **Next.js API routes** as the backend — co-located with frontend, runs as Vercel serverless functions
- **No ORM** — Supabase client is type-safe and auto-generates types from the schema

### Workout Logging
- **Session-first** — you open the app at the gym and log each set live as you complete it, not after
- Three entry points: **Suggested** (recovery-based), **Template** (saved routines), **From Scratch**

### Exercise Data
- **Hardcoded in `lib/exercises.ts`** — 28 exercises across 6 muscle groups, no DB query needed
- Each exercise has a description, YouTube link, and muscle group tags
- Easy to add more by editing the file

### Recommendation Engine
- **Rule-based, no ML** — transparent, debuggable, sufficient for a small dataset
- Computes a **recovery score** (0–1) per muscle group based on hours since last trained
- Recovery thresholds: legs/back = 72h, everything else = 48h
- Muscles at ≥80% recovery are flagged as "Ready"

### Progressive Overload
- Looks at the last 3 sessions per exercise
- If all sets hit target reps → suggest +2.5kg next session
- Otherwise → suggest same weight
- Shown as a subtle hint during the active workout session

### Social / Privacy (Strava-style)
- **No admin role** — all users are peers
- User A sends a follow request to User B → B accepts → A can see B's workouts
- `workouts_public` toggle controls whether followers can see workout details
- `profile_searchable` toggle controls whether others can find you by name

### Auth & Security
- JWT issued by Supabase Auth, stored in httpOnly cookies (XSS-safe)
- Row Level Security (RLS) enforced at the database level as a safety net
- API routes validate the JWT and check follow relationships for social queries

### UI
- **Elegant Luxury** dark theme — near-black background, muted warm gold accent, cream text
- **Bottom navigation bar** with 4 icons: Home, Workout, Progress, Profile
- Framer Motion for page transitions (fade + slide up), card stagger, recovery bar fill animations
- `layoutId` shared pill in the bottom nav for a smooth active indicator slide

---

## Project Structure

```
app/
  (app)/                   # Auth-gated app routes
    dashboard/             # Recovery widget + workout entry points
    workout/
      new/                 # Exercise picker (suggested / template / scratch)
      [id]/                # Active session — live set logger
    history/               # Past completed workouts
    exercises/
      page                 # Searchable exercise library
      [id]/                # Exercise detail (description + YouTube link)
    progress/              # Line chart — weight over time per exercise
    social/
      page                 # Follow requests, followers, following
      [userId]/            # Another user's activity feed
    settings/              # Privacy toggles + training preferences
  login/
  signup/

components/
  BottomNav.tsx            # Fixed floating pill nav with Framer Motion active indicator
  DashboardCards.tsx       # Animated start-workout cards (suggested / template / scratch)
  MuscleRecoveryBar.tsx    # Animated recovery bars per muscle group
  SetLogger.tsx            # Inline set/rep/weight logger used in active workout
  PageTransition.tsx       # Framer Motion fade+slide wrapper for all pages

lib/
  exercises.ts             # Hardcoded exercise library (28 exercises, 6 muscle groups)
  suggestions.ts           # Muscle recovery score computation + suggestion builder
  progressive-overload.ts  # Per-exercise weight hint based on last 3 sessions
  supabase.ts              # Browser Supabase client
  supabase-server.ts       # Server-side Supabase client (uses cookies)

types/
  index.ts                 # TypeScript interfaces matching DB schema

supabase-schema.sql        # Full DB schema + RLS policies — run in Supabase SQL Editor
```

---

## Database Schema (summary)

```
users               — extends Supabase Auth (id, name, avatar_url)
exercises           — exercise library (seeded)
workout_templates   — user-saved routines (name + ordered exercise list)
workouts            — a session (started_at, finished_at, template_id)
workout_sets        — individual sets (exercise_id, reps, weight_kg, logged_at)
user_preferences    — fitness goal, equipment, days/week
follow_requests     — from_user, to_user, status (pending/accepted/rejected)
privacy_settings    — workouts_public, profile_searchable
```

All tables have Row Level Security enabled. Users can only access their own data by default; social data is gated by accepted follow relationships.

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `supabase-schema.sql`
3. Copy your project URL and anon key from **Project Settings → API**

### 3. Configure environment variables

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deployment (Vercel)

1. Push the repo to GitHub
2. Import the project at [vercel.com](https://vercel.com)
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel project settings → Environment Variables
4. Deploy — Vercel auto-deploys on every push to `main`

---

## Pending (before going live)

- [x] Auth proxy (`proxy.ts`) connected to Supabase
- [x] Real Supabase queries restored across all pages
- [ ] Run DB migration: `ALTER TABLE public.workout_templates ALTER COLUMN exercise_ids TYPE TEXT[] USING exercise_ids::TEXT[];`
- [ ] Seed exercise images into Supabase Storage or `public/exercises/`
- [ ] Test social follow flow end-to-end with two accounts
- [ ] Initialize `privacy_settings` and `user_preferences` rows on signup (via Supabase trigger or API)
- [ ] Deploy to Vercel with env vars
