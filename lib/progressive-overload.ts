import type { WorkoutSet } from '@/types'

interface OverloadHint {
  exercise_id: string
  last_weight_kg: number
  last_reps: number
  suggested_weight_kg: number
  note: string
}

/**
 * Looks at the last 3 sessions for each exercise and suggests the next weight.
 * Rule: if all sets in the last session hit the target reps → suggest +2.5kg
 *       otherwise → suggest same weight
 */
export function computeProgressiveOverload(
  sets: WorkoutSet[],
  exerciseIds: string[]
): Record<string, OverloadHint> {
  const result: Record<string, OverloadHint> = {}

  for (const exerciseId of exerciseIds) {
    const exerciseSets = sets
      .filter(s => s.exercise_id === exerciseId)
      .sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime())

    if (exerciseSets.length === 0) continue

    // Group by workout_id to find last 3 sessions
    const byWorkout = new Map<string, WorkoutSet[]>()
    for (const s of exerciseSets) {
      const existing = byWorkout.get(s.workout_id) ?? []
      existing.push(s)
      byWorkout.set(s.workout_id, existing)
    }

    const workoutIds = [...byWorkout.keys()].slice(0, 3)
    const lastWorkoutSets = byWorkout.get(workoutIds[0]) ?? []

    if (lastWorkoutSets.length === 0) continue

    const lastWeight = lastWorkoutSets[0].weight_kg
    const lastReps = lastWorkoutSets[0].reps

    // Find the target reps for this exercise (assume first set of last session is the target)
    const targetReps = lastReps
    const allHitTarget = lastWorkoutSets.every(s => s.reps >= targetReps)

    const suggestedWeight = allHitTarget ? lastWeight + 2.5 : lastWeight
    const note = allHitTarget
      ? `Great job last time (${lastWeight}kg × ${lastReps}). Try ${suggestedWeight}kg today!`
      : `Last time: ${lastWeight}kg × ${lastReps}. Stick with ${suggestedWeight}kg.`

    result[exerciseId] = {
      exercise_id: exerciseId,
      last_weight_kg: lastWeight,
      last_reps: lastReps,
      suggested_weight_kg: suggestedWeight,
      note,
    }
  }

  return result
}
