'use client'

import { useEffect, useState, use } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { getExerciseById, EXERCISES } from '@/lib/exercises'
import { computeProgressiveOverload } from '@/lib/progressive-overload'
import { SetLogger } from '@/components/SetLogger'
import type { LoggedSet } from '@/components/SetLogger'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { CheckCircle, ExternalLink } from 'lucide-react'
import type { WorkoutSet } from '@/types'

interface ExerciseSession {
  exerciseId: string
  sets: LoggedSet[]
}

export default function WorkoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: workoutId } = use(params)
  const searchParams = useSearchParams()
  const router = useRouter()

  const [exerciseSessions, setExerciseSessions] = useState<ExerciseSession[]>([])
  const [workout, setWorkout] = useState<{ name: string | null; finished_at: string | null } | null>(null)
  const [overloadHints, setOverloadHints] = useState<Record<string, string>>({})
  const [finishing, setFinishing] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Load workout metadata
      const { data: w } = await supabase
        .from('workouts')
        .select('name, finished_at')
        .eq('id', workoutId)
        .single()
      setWorkout(w)

      // Load existing sets for this workout
      const { data: existingSets } = await supabase
        .from('workout_sets')
        .select('*')
        .eq('workout_id', workoutId)
        .order('set_number')

      // Build exercise sessions from URL param or existing sets
      const exerciseIdsFromUrl = searchParams.get('exercises')?.split(',').filter(Boolean) ?? []
      const exerciseIdsFromSets = [...new Set((existingSets ?? []).map((s: WorkoutSet) => s.exercise_id))]
      const exerciseIds = exerciseIdsFromUrl.length > 0 ? exerciseIdsFromUrl : exerciseIdsFromSets

      const sessions: ExerciseSession[] = exerciseIds.map(eid => ({
        exerciseId: eid,
        sets: (existingSets ?? [])
          .filter((s: WorkoutSet) => s.exercise_id === eid)
          .map((s: WorkoutSet) => ({ id: s.id, set_number: s.set_number, reps: s.reps, weight_kg: s.weight_kg })),
      }))
      setExerciseSessions(sessions)

      // Compute progressive overload hints from historical data
      const { data: historicalSets } = await supabase
        .from('workout_sets')
        .select('*')
        .in('exercise_id', exerciseIds)
        .neq('workout_id', workoutId)
        .order('logged_at', { ascending: false })
        .limit(200)

      const hints = computeProgressiveOverload(historicalSets ?? [], exerciseIds)
      const hintMessages: Record<string, string> = {}
      for (const [eid, hint] of Object.entries(hints)) {
        hintMessages[eid] = hint.note
      }
      setOverloadHints(hintMessages)
      setLoading(false)
    }
    load()
  }, [workoutId, searchParams])

  async function handleAddSet(exerciseId: string, set: Omit<LoggedSet, 'id'>) {
    const supabase = createClient()
    const { data } = await supabase
      .from('workout_sets')
      .insert({ workout_id: workoutId, exercise_id: exerciseId, ...set })
      .select('id, set_number, reps, weight_kg')
      .single()

    if (data) {
      setExerciseSessions(prev =>
        prev.map(s =>
          s.exerciseId === exerciseId
            ? { ...s, sets: [...s.sets, { id: data.id, set_number: data.set_number, reps: data.reps, weight_kg: data.weight_kg }] }
            : s
        )
      )
    }
  }

  async function handleDeleteSet(exerciseId: string, setNumber: number) {
    const supabase = createClient()
    const session = exerciseSessions.find(s => s.exerciseId === exerciseId)
    const target = session?.sets.find(s => s.set_number === setNumber)
    if (target?.id) {
      await supabase.from('workout_sets').delete().eq('id', target.id)
    }
    setExerciseSessions(prev =>
      prev.map(s =>
        s.exerciseId === exerciseId
          ? { ...s, sets: s.sets.filter(set => set.set_number !== setNumber) }
          : s
      )
    )
  }

  async function finishWorkout() {
    setFinishing(true)
    const supabase = createClient()
    await supabase
      .from('workouts')
      .update({ finished_at: new Date().toISOString() })
      .eq('id', workoutId)
    router.push('/history')
  }

  const isFinished = workout?.finished_at != null
  const totalSets = exerciseSessions.reduce((acc, s) => acc + s.sets.length, 0)

  if (loading) {
    return <div className="p-4 text-muted-foreground text-sm">Loading workout...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{workout?.name ?? 'Workout'}</h1>
          <p className="text-sm text-muted-foreground">
            {isFinished ? 'Completed' : `${totalSets} sets logged`}
          </p>
        </div>
        {!isFinished && (
          <Button onClick={finishWorkout} disabled={finishing} size="sm" className="gap-1.5">
            <CheckCircle className="h-4 w-4" />
            {finishing ? 'Saving...' : 'Finish'}
          </Button>
        )}
      </div>

      {exerciseSessions.map(({ exerciseId, sets }) => {
        const ex = getExerciseById(exerciseId) ?? EXERCISES.find(e => e.id === exerciseId)
        if (!ex) return null
        return (
          <Card key={exerciseId}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{ex.name}</CardTitle>
                  <Badge variant="secondary" className="mt-1 capitalize text-xs">
                    {ex.primary_muscle}
                  </Badge>
                </div>
                {ex.youtube_url && (
                  <a
                    href={ex.youtube_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4">
              {isFinished ? (
                <div className="space-y-1">
                  {sets.map(s => (
                    <div key={s.set_number} className="flex gap-4 text-sm">
                      <span className="text-muted-foreground w-6">#{s.set_number}</span>
                      <span>{s.weight_kg}kg × {s.reps} reps</span>
                    </div>
                  ))}
                </div>
              ) : (
                <SetLogger
                  exerciseId={exerciseId}
                  sets={sets}
                  overloadHint={overloadHints[exerciseId]}
                  onAddSet={(set) => handleAddSet(exerciseId, set)}
                  onDeleteSet={(n) => handleDeleteSet(exerciseId, n)}
                />
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
