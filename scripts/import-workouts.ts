/**
 * Import workout data from CSV export into Supabase.
 *
 * Usage: npx tsx scripts/import-workouts.ts
 *
 * Excludes: Running, Walking, Cycling, Rowing and their variants.
 * Groups sets by date into workout sessions.
 * Uses exact exercise IDs from lib/exercises.ts (matched by name).
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'

// ── Config ──────────────────────────────────────────────────────────────────
const SUPABASE_URL = 'https://kdudhawzisxisqykhrgr.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_1OHe03kUzg6P6SzY3RwlAw_YjFvTQ-P'
const CSV_PATH = 'C:\\Users\\arjunku\\Downloads\\WorkoutExport.csv'
const USER_EMAIL = 'arjunpraveen2000@gmail.com'
const USER_PASSWORD = '12345678'

// Exercises to exclude (non-gym cardio)
const EXCLUDED_EXERCISES = new Set([
  'running',
  'running - treadmill',
  'walking',
  'walking - treadmill',
  'cycling',
  'rowing',
])

// CSV exercise name (lowercase) → exercise ID in lib/exercises.ts
// Each exercise now has its own dedicated entry in the hardcoded list
const NAME_TO_ID: Record<string, string> = {
  // Chest
  'barbell bench press': 'bench-press',
  'dumbbell bench press': 'dumbbell-bench-press',
  'dumbbell decline bench press': 'dumbbell-decline-bench-press',
  'dumbbell floor press': 'dumbbell-floor-press',
  'dumbbell squeeze press': 'dumbbell-squeeze-press',
  'dumbbell incline bench press': 'dumbbell-incline-bench-press',
  'dumbbell fly': 'dumbbell-fly',
  'cable crossover fly': 'cable-crossover-fly',
  'machine fly': 'machine-fly',
  'machine bench press': 'machine-bench-press',
  'smith machine bench press': 'smith-machine-bench-press',
  'smith machine incline bench press': 'smith-machine-incline-bench-press',
  'hammerstrength incline chest press': 'hammerstrength-incline-chest-press',
  'push up': 'push-up',
  'decline push up': 'decline-push-up',
  'dip': 'dip',
  'bench dip': 'bench-dip',

  // Back
  'pull up': 'pull-up',
  'assisted pull up': 'assisted-pull-up',
  'australian chin up': 'australian-chin-up',
  'bent over barbell row': 'bent-over-barbell-row',
  'dumbbell row': 'dumbbell-row',
  'incline dumbbell row': 'incline-dumbbell-row',
  'landmine row': 'landmine-row',
  'pendlay row': 'pendlay-row',
  'reverse grip barbell bent over row': 'reverse-grip-barbell-bent-over-row',
  'smith machine bent over row': 'smith-machine-bent-over-row',
  'shotgun row': 'shotgun-row',
  'inverted row': 'inverted-row',
  'lat pulldown': 'lat-pulldown',
  'wide grip lat pulldown': 'wide-grip-lat-pulldown',
  'reverse grip pull down': 'reverse-grip-pull-down',
  'cable row': 'cable-row',
  'cable row wide': 'cable-row-wide',
  'deadlift': 'deadlift',
  'barbell shrug': 'barbell-shrug',
  'dumbbell shrug': 'dumbbell-shrug',
  'cable face pull': 'cable-face-pull',
  'dumbbell back fly': 'dumbbell-back-fly',
  'dumbbell rear delt raise': 'dumbbell-rear-delt-raise',
  'machine rear delt fly': 'machine-rear-delt-fly',
  'cable shoulder external rotation': 'cable-shoulder-external-rotation',

  // Legs
  'barbell squat': 'barbell-squat',
  'air squats': 'air-squats',
  'bodyweight squat hold': 'bodyweight-squat-hold',
  'dumbbell squat': 'dumbbell-squat',
  'dumbbell sumo squat': 'dumbbell-sumo-squat',
  'dumbbell bulgarian split squat': 'dumbbell-bulgarian-split-squat',
  'dumbbell lunge': 'dumbbell-lunge',
  'dumbbell walking lunge': 'dumbbell-walking-lunge',
  'lateral lunge stretch': 'lateral-lunge-stretch',
  'heels up goblet squat (pregnancy)': 'heels-up-goblet-squat-pregnancy',
  'smith machine squat': 'smith-machine-squat',
  'leg press': 'leg-press',
  'machine leg press': 'machine-leg-press',
  'leg extension': 'leg-extension',
  'lying hamstrings curl': 'lying-hamstrings-curl',
  'romanian deadlift': 'romanian-deadlift',
  'dumbbell romanian deadlift': 'dumbbell-romanian-deadlift',
  'smith machine stiff-legged deadlift': 'smith-machine-stiff-legged-deadlift',
  'barbell hip thrust': 'barbell-hip-thrust',
  'smith machine glute bridge': 'smith-machine-glute-bridge',
  'cable hip adduction': 'cable-hip-adduction',
  'cable hip extension': 'cable-hip-extension',
  'cable pull through': 'cable-pull-through',
  'single leg kickback': 'single-leg-kickback',
  'clam': 'clam',
  'seated dumbbell calf raise': 'seated-dumbbell-calf-raise',
  'seated machine calf press': 'seated-machine-calf-press',
  'smith machine calf raise': 'smith-machine-calf-raise',
  'single leg standing calf raise': 'single-leg-standing-calf-raise',
  'wall sit': 'wall-sit',
  'sumo deadlift': 'sumo-deadlift',
  'stair stepper': 'stair-stepper',

  // Shoulders
  'dumbbell shoulder press': 'dumbbell-shoulder-press',
  'machine shoulder press': 'machine-shoulder-press',
  'dumbbell lateral raise': 'dumbbell-lateral-raise',
  'cable lateral raise': 'cable-lateral-raise',
  'dumbbell hanging lateral raise': 'dumbbell-hanging-lateral-raise',
  'dumbbell front raise': 'dumbbell-front-raise',
  'barbell front raise': 'barbell-front-raise',
  'front plate raise': 'front-plate-raise',
  'arnold press': 'arnold-press',

  // Arms
  'dumbbell bicep curl': 'dumbbell-bicep-curl',
  'concentration curl': 'concentration-curl',
  'ez-bar curl': 'ez-bar-curl',
  'ez-bar reverse grip curl': 'ez-bar-reverse-grip-curl',
  'reverse barbell curl': 'reverse-barbell-curl',
  'incline dumbbell curl': 'incline-dumbbell-curl',
  'incline ez-bar curl': 'incline-ez-bar-curl',
  'machine bicep curl': 'machine-bicep-curl',
  'handle band bicep curl': 'handle-band-bicep-curl',
  'cable rope hammer curls': 'cable-rope-hammer-curls',
  'cross body hammer curls': 'cross-body-hammer-curls',
  'hammer curls': 'hammer-curls',
  'cable tricep pushdown': 'cable-tricep-pushdown',
  'cable rope tricep extension': 'cable-rope-tricep-extension',
  'cable one arm tricep side extension': 'cable-one-arm-tricep-side-extension',
  'dumbbell tricep extension': 'dumbbell-tricep-extension',
  'dumbbell kickbacks': 'dumbbell-kickbacks',
  'dumbbell skullcrusher': 'dumbbell-skullcrusher',
  'cable wrist curl': 'cable-wrist-curl',
  'palms-down dumbbell wrist curl': 'palms-down-dumbbell-wrist-curl',
  'palms-up barbell wrist curl': 'palms-up-barbell-wrist-curl',
  'palms-up dumbbell wrist curl': 'palms-up-dumbbell-wrist-curl',

  // Core
  'plank': 'plank',
  'copenhagen plank': 'copenhagen-plank',
  'plank shoulder taps': 'plank-shoulder-taps',
  'side bridge': 'side-bridge',
  'leg raise': 'leg-raise',
  'leg pull-in': 'leg-pull-in',
  'scissor kick': 'scissor-kick',
  'scissor crossover kick': 'scissor-crossover-kick',
  'ab crunch machine': 'ab-crunch-machine',
  'crunches': 'crunches',
  'oblique crunch': 'oblique-crunch',
  'tuck crunch': 'tuck-crunch',
  'reverse crunch': 'reverse-crunch',
  'bicycle crunch': 'bicycle-crunch',
  'russian twist': 'russian-twist',
  'sit up': 'sit-up',
  'alternating heel touch': 'alternating-heel-touch',
  'mountain climber': 'mountain-climber',
  'dead bug': 'dead-bug',
  'hollow body hold': 'hollow-body-hold',
  'superman': 'superman',
  'superman hold': 'superman-hold',
  'windmill': 'windmill',
  'jump rope': 'jump-rope',
  'kettlebell swing american': 'kettlebell-swing-american',
  "farmer's walk": 'farmers-walk',
}

// Muscle group for each exercise ID (for auto-naming workouts)
const EXERCISE_MUSCLES: Record<string, string> = {}
// Chest
for (const id of ['bench-press','dumbbell-bench-press','dumbbell-decline-bench-press','dumbbell-floor-press','dumbbell-squeeze-press','dumbbell-incline-bench-press','dumbbell-fly','cable-crossover-fly','machine-fly','machine-bench-press','smith-machine-bench-press','smith-machine-incline-bench-press','hammerstrength-incline-chest-press','push-up','decline-push-up','dip','bench-dip','incline-db-press','cable-fly','dips'])
  EXERCISE_MUSCLES[id] = 'Chest'
// Back
for (const id of ['pull-up','assisted-pull-up','australian-chin-up','bent-over-barbell-row','dumbbell-row','incline-dumbbell-row','landmine-row','pendlay-row','reverse-grip-barbell-bent-over-row','smith-machine-bent-over-row','shotgun-row','inverted-row','lat-pulldown','wide-grip-lat-pulldown','reverse-grip-pull-down','cable-row','cable-row-wide','deadlift','barbell-shrug','dumbbell-shrug','cable-face-pull','dumbbell-back-fly','dumbbell-rear-delt-raise','machine-rear-delt-fly','cable-shoulder-external-rotation','barbell-row','seated-cable-row'])
  EXERCISE_MUSCLES[id] = 'Back'
// Legs
for (const id of ['barbell-squat','air-squats','bodyweight-squat-hold','dumbbell-squat','dumbbell-sumo-squat','dumbbell-bulgarian-split-squat','dumbbell-lunge','dumbbell-walking-lunge','lateral-lunge-stretch','heels-up-goblet-squat-pregnancy','smith-machine-squat','leg-press','machine-leg-press','leg-extension','lying-hamstrings-curl','romanian-deadlift','dumbbell-romanian-deadlift','smith-machine-stiff-legged-deadlift','barbell-hip-thrust','smith-machine-glute-bridge','cable-hip-adduction','cable-hip-extension','cable-pull-through','single-leg-kickback','clam','seated-dumbbell-calf-raise','seated-machine-calf-press','smith-machine-calf-raise','single-leg-standing-calf-raise','wall-sit','sumo-deadlift','stair-stepper','lunges','leg-curl'])
  EXERCISE_MUSCLES[id] = 'Legs'
// Shoulders
for (const id of ['dumbbell-shoulder-press','machine-shoulder-press','dumbbell-lateral-raise','cable-lateral-raise','dumbbell-hanging-lateral-raise','dumbbell-front-raise','barbell-front-raise','front-plate-raise','arnold-press','overhead-press','lateral-raise','face-pull'])
  EXERCISE_MUSCLES[id] = 'Shoulders'
// Arms
for (const id of ['dumbbell-bicep-curl','concentration-curl','ez-bar-curl','ez-bar-reverse-grip-curl','reverse-barbell-curl','incline-dumbbell-curl','incline-ez-bar-curl','machine-bicep-curl','handle-band-bicep-curl','cable-rope-hammer-curls','cross-body-hammer-curls','hammer-curls','cable-tricep-pushdown','cable-rope-tricep-extension','cable-one-arm-tricep-side-extension','dumbbell-tricep-extension','dumbbell-kickbacks','dumbbell-skullcrusher','cable-wrist-curl','palms-down-dumbbell-wrist-curl','palms-up-barbell-wrist-curl','palms-up-dumbbell-wrist-curl','bicep-curl','tricep-pushdown','hammer-curl','skull-crushers'])
  EXERCISE_MUSCLES[id] = 'Arms'
// Core
for (const id of ['plank','copenhagen-plank','plank-shoulder-taps','side-bridge','leg-raise','leg-pull-in','scissor-kick','scissor-crossover-kick','ab-crunch-machine','crunches','oblique-crunch','tuck-crunch','reverse-crunch','bicycle-crunch','russian-twist','sit-up','alternating-heel-touch','mountain-climber','dead-bug','hollow-body-hold','superman','superman-hold','windmill','jump-rope','kettlebell-swing-american','farmers-walk','hanging-leg-raise','cable-crunch','ab-wheel'])
  EXERCISE_MUSCLES[id] = 'Core'

// ── Parse CSV ───────────────────────────────────────────────────────────────
interface CsvRow {
  date: string
  exercise: string
  reps: number
  weightKg: number
}

function parseCsv(path: string): CsvRow[] {
  const raw = fs.readFileSync(path, 'utf-8')
  const lines = raw.split('\n').slice(1) // skip header
  const rows: CsvRow[] = []

  for (const line of lines) {
    if (!line.trim()) continue
    const parts = line.split(',')
    const date = parts[0].trim()
    const exercise = parts[1].trim()
    const reps = parseInt(parts[2].trim(), 10) || 0
    const weightKg = parseFloat(parts[3].trim()) || 0

    if (EXCLUDED_EXERCISES.has(exercise.toLowerCase())) continue
    if (!exercise || exercise === 'Exercise') continue

    rows.push({ date, exercise, reps, weightKg })
  }

  return rows
}

// ── Group into workout sessions by date ─────────────────────────────────────
interface WorkoutSession {
  date: string
  startedAt: string
  finishedAt: string
  exercises: { exerciseId: string; sets: { reps: number; weightKg: number; loggedAt: string }[] }[]
}

function groupIntoSessions(rows: CsvRow[]): WorkoutSession[] {
  const byDate = new Map<string, CsvRow[]>()
  for (const row of rows) {
    const dateKey = row.date.substring(0, 10)
    if (!byDate.has(dateKey)) byDate.set(dateKey, [])
    byDate.get(dateKey)!.push(row)
  }

  const sessions: WorkoutSession[] = []
  for (const [dateKey, dateRows] of byDate) {
    const exerciseOrder: string[] = []
    const exerciseSets = new Map<string, { reps: number; weightKg: number; loggedAt: string }[]>()

    for (const row of dateRows) {
      const exerciseId = NAME_TO_ID[row.exercise.toLowerCase()]
      if (!exerciseId) {
        console.warn(`  Unmapped exercise: "${row.exercise}" — skipping`)
        continue
      }

      if (!exerciseSets.has(exerciseId)) {
        exerciseSets.set(exerciseId, [])
        exerciseOrder.push(exerciseId)
      }
      exerciseSets.get(exerciseId)!.push({
        reps: row.reps || 1,
        weightKg: row.weightKg,
        loggedAt: row.date,
      })
    }

    if (exerciseOrder.length === 0) continue

    const timestamps = dateRows.map(r => new Date(r.date).getTime())
    const earliest = new Date(Math.min(...timestamps)).toISOString()
    const latest = new Date(Math.max(...timestamps) + 60_000).toISOString()

    sessions.push({
      date: dateKey,
      startedAt: earliest,
      finishedAt: latest,
      exercises: exerciseOrder.map(id => ({ exerciseId: id, sets: exerciseSets.get(id)! })),
    })
  }

  return sessions.sort((a, b) => a.date.localeCompare(b.date))
}

function autoName(exercises: { exerciseId: string }[]): string {
  const muscles = [...new Set(exercises.map(e => EXERCISE_MUSCLES[e.exerciseId] ?? 'Workout'))]
  if (muscles.length <= 3) return muscles.join(' & ')
  return muscles.slice(0, 2).join(' & ') + ' + More'
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('Parsing CSV...')
  const rows = parseCsv(CSV_PATH)
  console.log(`  ${rows.length} gym sets found (after excluding cardio)`)

  const sessions = groupIntoSessions(rows)
  console.log(`  ${sessions.length} workout sessions grouped`)

  console.log('\nAuthenticating...')
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: USER_EMAIL,
    password: USER_PASSWORD,
  })
  if (authError) { console.error('Auth failed:', authError.message); process.exit(1) }
  const userId = authData.user!.id
  console.log(`  Logged in as ${userId}`)

  // Check for existing workouts to avoid duplicates
  const { data: existingWorkouts } = await supabase
    .from('workouts')
    .select('started_at')
    .eq('user_id', userId)
  const existingDates = new Set(
    (existingWorkouts ?? []).map((w: any) => new Date(w.started_at).toISOString().substring(0, 10))
  )

  let imported = 0
  let skipped = 0

  for (const session of sessions) {
    if (existingDates.has(session.date)) {
      skipped++
      continue
    }

    const workoutName = autoName(session.exercises)

    const { data: workout, error: wErr } = await supabase
      .from('workouts')
      .insert({
        user_id: userId,
        name: workoutName,
        started_at: session.startedAt,
        finished_at: session.finishedAt,
      })
      .select('id')
      .single()

    if (wErr) {
      console.error(`  Failed to insert workout ${session.date}:`, wErr.message)
      continue
    }

    const setsToInsert: any[] = []
    for (const exercise of session.exercises) {
      exercise.sets.forEach((set, idx) => {
        setsToInsert.push({
          workout_id: workout.id,
          exercise_id: exercise.exerciseId,
          set_number: idx + 1,
          reps: set.reps,
          weight_kg: set.weightKg,
          logged_at: set.loggedAt,
        })
      })
    }

    const { error: sErr } = await supabase.from('workout_sets').insert(setsToInsert)
    if (sErr) {
      console.error(`  Failed to insert sets for ${session.date}:`, sErr.message)
    } else {
      imported++
      console.log(`  ✓ ${session.date} — ${workoutName} (${setsToInsert.length} sets)`)
    }
  }

  console.log(`\nDone! Imported: ${imported}, Skipped (already exist): ${skipped}`)
}

main().catch(console.error)
