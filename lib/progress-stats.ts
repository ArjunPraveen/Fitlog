import type { WorkoutSet, MuscleGroup } from '@/types'
import { getExerciseById } from './exercises'

// ── Volume Stats ──────────────────────────────────────────────────────────

export interface VolumeStats {
  totalWorkouts: number
  totalSets: number
  totalTonnage: number          // sum of weight_kg * reps across all sets
  totalExercises: number        // unique exercise count
}

export function computeVolumeStats(
  sets: Pick<WorkoutSet, 'weight_kg' | 'reps' | 'exercise_id' | 'workout_id'>[]
): VolumeStats {
  const workoutIds = new Set<string>()
  const exerciseIds = new Set<string>()
  let totalTonnage = 0

  for (const s of sets) {
    workoutIds.add(s.workout_id)
    exerciseIds.add(s.exercise_id)
    totalTonnage += s.weight_kg * s.reps
  }

  return {
    totalWorkouts: workoutIds.size,
    totalSets: sets.length,
    totalTonnage: Math.round(totalTonnage),
    totalExercises: exerciseIds.size,
  }
}

// ── Personal Records ──────────────────────────────────────────────────────

export interface PersonalRecord {
  type: 'weight' | 'volume'
  value: number
  reps: number
  weight_kg: number
  date: string
}

export interface ExercisePRs {
  bestWeight: PersonalRecord | null   // heaviest single set
  bestVolume: PersonalRecord | null   // highest weight × reps in one set
  isNewWeightPR: boolean              // did latest session set a new weight PR?
  isNewVolumePR: boolean
}

export function detectPRs(
  sets: Pick<WorkoutSet, 'weight_kg' | 'reps' | 'logged_at' | 'workout_id'>[]
): ExercisePRs {
  if (sets.length === 0) {
    return { bestWeight: null, bestVolume: null, isNewWeightPR: false, isNewVolumePR: false }
  }

  let bestWeight: PersonalRecord | null = null
  let bestVolume: PersonalRecord | null = null

  for (const s of sets) {
    const volume = s.weight_kg * s.reps

    if (!bestWeight || s.weight_kg > bestWeight.value) {
      bestWeight = { type: 'weight', value: s.weight_kg, reps: s.reps, weight_kg: s.weight_kg, date: s.logged_at }
    }
    if (!bestVolume || volume > bestVolume.value) {
      bestVolume = { type: 'volume', value: volume, reps: s.reps, weight_kg: s.weight_kg, date: s.logged_at }
    }
  }

  // Check if PRs are from the most recent workout
  const sorted = [...sets].sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime())
  const latestWorkoutId = sorted[0]?.workout_id
  const latestSets = sorted.filter(s => s.workout_id === latestWorkoutId)

  const isNewWeightPR = bestWeight !== null && latestSets.some(s => s.weight_kg === bestWeight!.value)
  const isNewVolumePR = bestVolume !== null && latestSets.some(s => s.weight_kg * s.reps === bestVolume!.value)

  return { bestWeight, bestVolume, isNewWeightPR, isNewVolumePR }
}

// ── Session Aggregates (for charts) ───────────────────────────────────────

export interface SessionAggregate {
  date: string
  workoutId: string
  sets: number
  maxWeight: number
  totalVolume: number   // sum of weight × reps for the session
  avgReps: number
}

export function aggregateSessions(
  sets: Pick<WorkoutSet, 'weight_kg' | 'reps' | 'logged_at' | 'workout_id'>[]
): SessionAggregate[] {
  const byWorkout = new Map<string, typeof sets>()
  for (const s of sets) {
    const arr = byWorkout.get(s.workout_id) ?? []
    arr.push(s)
    byWorkout.set(s.workout_id, arr)
  }

  const sessions: SessionAggregate[] = []
  for (const [workoutId, wSets] of byWorkout) {
    const earliest = wSets.reduce((min, s) =>
      new Date(s.logged_at) < new Date(min.logged_at) ? s : min
    )
    const maxWeight = Math.max(...wSets.map(s => s.weight_kg))
    const totalVolume = wSets.reduce((sum, s) => sum + s.weight_kg * s.reps, 0)
    const avgReps = Math.round(wSets.reduce((sum, s) => sum + s.reps, 0) / wSets.length)

    sessions.push({
      date: new Date(earliest.logged_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      workoutId,
      sets: wSets.length,
      maxWeight,
      totalVolume: Math.round(totalVolume),
      avgReps,
    })
  }

  // Sort chronologically
  return sessions.sort((a, b) => {
    const aDate = sets.find(s => s.workout_id === a.workoutId)!.logged_at
    const bDate = sets.find(s => s.workout_id === b.workoutId)!.logged_at
    return new Date(aDate).getTime() - new Date(bDate).getTime()
  })
}

// ── Workout Analysis ──────────────────────────────────────────────────────

export interface WorkoutAnalysis {
  message: string
  trend: 'up' | 'down' | 'stable' | 'new'
  details: string[]
}

export function analyzeProgress(
  sessions: SessionAggregate[],
  exerciseName: string
): WorkoutAnalysis {
  if (sessions.length === 0) {
    return {
      message: `No data yet for ${exerciseName}. Start logging to track your progress!`,
      trend: 'new',
      details: [],
    }
  }

  if (sessions.length === 1) {
    const s = sessions[0]
    return {
      message: `First session logged! You hit ${s.maxWeight}kg for ${s.sets} sets.`,
      trend: 'new',
      details: ['Keep logging to see trends over time.'],
    }
  }

  const recent = sessions.slice(-5)
  const details: string[] = []

  // Weight trend
  const firstWeight = recent[0].maxWeight
  const lastWeight = recent[recent.length - 1].maxWeight
  const weightDiff = lastWeight - firstWeight
  const weightPct = firstWeight > 0 ? Math.round((weightDiff / firstWeight) * 100) : 0

  // Volume trend
  const firstVol = recent[0].totalVolume
  const lastVol = recent[recent.length - 1].totalVolume
  const volDiff = lastVol - firstVol
  const volPct = firstVol > 0 ? Math.round((volDiff / firstVol) * 100) : 0

  let trend: 'up' | 'down' | 'stable'
  let message: string

  if (weightDiff > 0) {
    trend = 'up'
    message = `Trending up! Your ${exerciseName} weight increased ${Math.abs(weightPct)}% over your last ${recent.length} sessions.`
  } else if (weightDiff < 0) {
    trend = 'down'
    message = `Your ${exerciseName} weight dipped ${Math.abs(weightPct)}% recently. Deload or recovery phase?`
  } else {
    trend = 'stable'
    message = `Steady at ${lastWeight}kg for ${exerciseName}. Time to push for a new PR?`
  }

  if (weightDiff > 0) {
    details.push(`Weight: ${firstWeight}kg → ${lastWeight}kg (+${weightDiff}kg)`)
  } else if (weightDiff < 0) {
    details.push(`Weight: ${firstWeight}kg → ${lastWeight}kg (${weightDiff}kg)`)
  }

  if (volPct > 0) {
    details.push(`Volume up ${volPct}% (${firstVol.toLocaleString()} → ${lastVol.toLocaleString()}kg total)`)
  } else if (volPct < 0) {
    details.push(`Volume down ${Math.abs(volPct)}%`)
  }

  // Consistency
  if (recent.length >= 3) {
    details.push(`${recent.length} sessions tracked — great consistency!`)
  }

  return { message, trend, details }
}

// ── Progressive Overload Suggestion (for Progress page) ───────────────────

export interface OverloadSuggestion {
  currentWeight: number
  suggestedWeight: number
  reason: string
}

export function getOverloadSuggestion(
  sessions: SessionAggregate[]
): OverloadSuggestion | null {
  if (sessions.length === 0) return null

  const last = sessions[sessions.length - 1]
  const prev = sessions.length >= 2 ? sessions[sessions.length - 2] : null

  // If volume went up or stayed same with good reps, suggest weight increase
  if (last.avgReps >= 8) {
    return {
      currentWeight: last.maxWeight,
      suggestedWeight: last.maxWeight + 2.5,
      reason: `You hit ${last.avgReps} avg reps at ${last.maxWeight}kg — ready for ${last.maxWeight + 2.5}kg next session.`,
    }
  }

  if (prev && last.maxWeight >= prev.maxWeight && last.avgReps >= prev.avgReps) {
    return {
      currentWeight: last.maxWeight,
      suggestedWeight: last.maxWeight + 2.5,
      reason: `Reps and weight both held steady or improved — bump to ${last.maxWeight + 2.5}kg.`,
    }
  }

  return {
    currentWeight: last.maxWeight,
    suggestedWeight: last.maxWeight,
    reason: `Stick with ${last.maxWeight}kg and focus on hitting higher reps before adding weight.`,
  }
}
