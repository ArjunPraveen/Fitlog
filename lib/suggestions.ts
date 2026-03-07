import type { MuscleGroup, MuscleRecovery, WorkoutSet } from '@/types'
import { EXERCISES_BY_MUSCLE, type ExerciseEntry } from './exercises'

// Hours needed for full recovery per muscle group
const RECOVERY_HOURS: Record<MuscleGroup, number> = {
  legs: 72,
  back: 72,
  chest: 48,
  shoulders: 48,
  arms: 48,
  core: 48,
}

export function computeMuscleRecovery(
  recentSets: { exercise_primary_muscle: MuscleGroup; logged_at: string }[]
): MuscleRecovery[] {
  const now = Date.now()
  const muscles: MuscleGroup[] = ['chest', 'back', 'legs', 'shoulders', 'arms', 'core']

  return muscles.map(muscle => {
    // Find the most recent set for this muscle
    const setsForMuscle = recentSets
      .filter(s => s.exercise_primary_muscle === muscle)
      .sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime())

    const lastSet = setsForMuscle[0]
    if (!lastSet) {
      return { muscle, recovery_score: 1.0, hours_since: Infinity, last_trained_at: null }
    }

    const hoursSince = (now - new Date(lastSet.logged_at).getTime()) / (1000 * 60 * 60)
    const threshold = RECOVERY_HOURS[muscle]
    const recovery_score = Math.min(1.0, hoursSince / threshold)

    return {
      muscle,
      recovery_score,
      hours_since: Math.round(hoursSince),
      last_trained_at: lastSet.logged_at,
    }
  })
}

export interface WorkoutSuggestion {
  recovery: MuscleRecovery[]
  readyMuscles: MuscleGroup[]
  suggestedExercises: ExerciseEntry[]
}

export function buildSuggestion(recovery: MuscleRecovery[]): WorkoutSuggestion {
  const sorted = [...recovery].sort((a, b) => b.recovery_score - a.recovery_score)
  // Muscles at ≥80% recovery are "ready"
  const readyMuscles = sorted.filter(r => r.recovery_score >= 0.8).map(r => r.muscle)
  const targetMuscles = readyMuscles.slice(0, 3)

  const suggestedExercises: ExerciseEntry[] = []
  for (const muscle of targetMuscles) {
    const exercises = EXERCISES_BY_MUSCLE[muscle].slice(0, 4)
    suggestedExercises.push(...exercises)
  }

  return { recovery: sorted, readyMuscles, suggestedExercises }
}
