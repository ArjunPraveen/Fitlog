import { getExerciseById } from './exercises'
import type { WorkoutSet } from '@/types'

interface ExerciseData {
  exerciseId: string
  sets: { set_number: number; weight_kg: number; reps: number }[]
}

interface PreviousSession {
  sets: { weight_kg: number; reps: number }[]
}

export function buildWorkoutReviewPrompt(params: {
  workoutName: string
  date: string
  startedAt: string
  finishedAt: string
  exercises: ExerciseData[]
  historicalSets: Pick<WorkoutSet, 'exercise_id' | 'workout_id' | 'weight_kg' | 'reps' | 'logged_at'>[]
}): string {
  const { workoutName, date, startedAt, finishedAt, exercises, historicalSets } = params

  const durationMs = new Date(finishedAt).getTime() - new Date(startedAt).getTime()
  const durationMin = Math.round(durationMs / 60000)

  const totalSets = exercises.reduce((sum, e) => sum + e.sets.length, 0)
  const totalVolume = exercises.reduce(
    (sum, e) => sum + e.sets.reduce((s, set) => s + set.weight_kg * set.reps, 0),
    0
  )

  // Build previous session lookup per exercise
  const previousSessions = buildPreviousSessions(historicalSets)

  let prompt = `I just finished a workout and I'd like your analysis and rating. Here are the details:\n\n`
  prompt += `**Workout:** ${workoutName}\n`
  prompt += `**Date:** ${date}\n`
  prompt += `**Duration:** ${durationMin} minutes\n`
  prompt += `**Total Sets:** ${totalSets}\n`
  prompt += `**Total Volume:** ${totalVolume.toLocaleString()} kg\n\n`
  prompt += `---\n\n`
  prompt += `## Exercises\n\n`

  for (let i = 0; i < exercises.length; i++) {
    const { exerciseId, sets } = exercises[i]
    const ex = getExerciseById(exerciseId)
    const name = ex?.name ?? exerciseId
    const muscle = ex?.primary_muscle ?? 'unknown'

    prompt += `### ${i + 1}. ${name} (${muscle})\n\n`

    if (sets.length > 0) {
      prompt += `| Set | Weight (kg) | Reps |\n`
      prompt += `|-----|-------------|------|\n`
      for (const s of sets) {
        prompt += `| ${s.set_number} | ${s.weight_kg} | ${s.reps} |\n`
      }
    } else {
      prompt += `_No sets logged for this exercise._\n`
    }

    // Previous session comparison
    const prev = previousSessions.get(exerciseId)
    if (prev && prev.sets.length > 0) {
      const prevMaxWeight = Math.max(...prev.sets.map(s => s.weight_kg))
      const currMaxWeight = sets.length > 0 ? Math.max(...sets.map(s => s.weight_kg)) : 0
      const weightDiff = currMaxWeight - prevMaxWeight

      const prevTotalVol = prev.sets.reduce((s, set) => s + set.weight_kg * set.reps, 0)
      const currTotalVol = sets.reduce((s, set) => s + set.weight_kg * set.reps, 0)

      prompt += `\n**Previous session:** ${prev.sets.map(s => `${s.weight_kg}kg × ${s.reps}`).join(', ')}\n`
      if (weightDiff > 0) {
        prompt += `**Progress:** +${weightDiff}kg max weight increase\n`
      } else if (weightDiff < 0) {
        prompt += `**Progress:** ${weightDiff}kg max weight decrease\n`
      } else if (sets.length > 0) {
        prompt += `**Progress:** Same max weight as last session\n`
      }
    }

    prompt += `\n`
  }

  prompt += `---\n\n`
  prompt += `## What I'd like from you:\n\n`
  prompt += `1. **Rate this workout (1-10)** and explain your rating\n`
  prompt += `2. **What went well** — highlight any progressive overload, good volume, or balance\n`
  prompt += `3. **Concerns** — flag any muscle imbalances, too much/too little volume, or form risks\n`
  prompt += `4. **Next session tips** — suggest 1-2 specific improvements for next time\n`
  prompt += `5. **Recovery** — any recovery or nutrition tips based on what I trained today\n`

  return prompt
}

/**
 * Groups historical sets by exercise, then picks the most recent workout's sets
 * for each exercise as the "previous session".
 */
function buildPreviousSessions(
  historicalSets: Pick<WorkoutSet, 'exercise_id' | 'workout_id' | 'weight_kg' | 'reps' | 'logged_at'>[]
): Map<string, PreviousSession> {
  const result = new Map<string, PreviousSession>()

  // Group by exercise_id
  const byExercise = new Map<string, typeof historicalSets>()
  for (const s of historicalSets) {
    const arr = byExercise.get(s.exercise_id) ?? []
    arr.push(s)
    byExercise.set(s.exercise_id, arr)
  }

  for (const [exerciseId, sets] of byExercise) {
    // Sort by date descending to find the most recent workout
    const sorted = [...sets].sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime())
    const latestWorkoutId = sorted[0]?.workout_id
    if (!latestWorkoutId) continue

    const latestSets = sorted
      .filter(s => s.workout_id === latestWorkoutId)
      .map(s => ({ weight_kg: s.weight_kg, reps: s.reps }))

    result.set(exerciseId, { sets: latestSets })
  }

  return result
}
