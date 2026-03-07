'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { EXERCISES, EXERCISES_BY_MUSCLE } from '@/lib/exercises'
import type { MuscleGroup } from '@/types'

const MUSCLE_GROUPS: MuscleGroup[] = ['chest', 'back', 'legs', 'shoulders', 'arms', 'core']

function NewWorkoutContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const mode = searchParams.get('mode') ?? 'scratch'

  const [workoutName, setWorkoutName] = useState('')
  const [selectedExercises, setSelectedExercises] = useState<string[]>([])
  const [filterMuscle, setFilterMuscle] = useState<MuscleGroup | 'all'>('all')
  const [loading, setLoading] = useState(false)
  const [templates, setTemplates] = useState<{ id: string; name: string; exercise_ids: string[] }[]>([])

  useEffect(() => {
    if (mode === 'template') {
      const supabase = createClient()
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (!user) return
        supabase
          .from('workout_templates')
          .select('id, name, exercise_ids')
          .eq('user_id', user.id)
          .then(({ data }) => setTemplates(data ?? []))
      })
    }
  }, [mode])

  const filteredExercises =
    filterMuscle === 'all' ? EXERCISES : EXERCISES_BY_MUSCLE[filterMuscle]

  function toggleExercise(id: string) {
    setSelectedExercises(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  async function startWorkout() {
    if (selectedExercises.length === 0) return
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: workout, error } = await supabase
      .from('workouts')
      .insert({
        user_id: user.id,
        name: workoutName || null,
        started_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (error || !workout) {
      setLoading(false)
      return
    }

    router.push(`/workout/${workout.id}?exercises=${selectedExercises.join(',')}`)
  }

  function loadTemplate(template: { id: string; name: string; exercise_ids: string[] }) {
    setWorkoutName(template.name)
    setSelectedExercises(template.exercise_ids)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">New Workout</h1>
        <p className="text-muted-foreground text-sm">
          {mode === 'suggested' && 'Exercises suggested based on recovery'}
          {mode === 'template' && 'Pick a saved template or choose exercises'}
          {mode === 'scratch' && 'Pick your exercises'}
        </p>
      </div>

      <div>
        <Input
          placeholder="Workout name (optional, e.g. Push Day)"
          value={workoutName}
          onChange={e => setWorkoutName(e.target.value)}
        />
      </div>

      {mode === 'template' && templates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your Templates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {templates.map(t => (
              <button
                key={t.id}
                onClick={() => loadTemplate(t)}
                className="flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm hover:bg-muted"
              >
                <span>{t.name}</span>
                <span className="text-muted-foreground">{t.exercise_ids.length} exercises</span>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterMuscle('all')}
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
              filterMuscle === 'all' ? 'bg-foreground text-background' : 'hover:bg-muted'
            }`}
          >
            All
          </button>
          {MUSCLE_GROUPS.map(m => (
            <button
              key={m}
              onClick={() => setFilterMuscle(m)}
              className={`rounded-full border px-3 py-1 text-xs capitalize transition-colors ${
                filterMuscle === m ? 'bg-foreground text-background' : 'hover:bg-muted'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {filteredExercises.map(ex => {
            const selected = selectedExercises.includes(ex.id)
            return (
              <button
                key={ex.id}
                onClick={() => toggleExercise(ex.id)}
                className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors ${
                  selected ? 'border-foreground bg-muted' : 'hover:bg-muted/50'
                }`}
              >
                <div>
                  <p className="font-medium text-sm">{ex.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{ex.primary_muscle}</p>
                </div>
                {selected && (
                  <Badge variant="default" className="text-xs">Added</Badge>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Sticky CTA — clears the bottom nav (5rem) + gap */}
      <div className="sticky bottom-[5.5rem]">
        <button
          onClick={startWorkout}
          disabled={selectedExercises.length === 0 || loading}
          className="w-full rounded-2xl bg-gold py-4 text-sm font-semibold text-[oklch(0.11_0.008_285)] glow-gold shadow-xl transition-opacity disabled:opacity-40"
        >
          {loading
            ? 'Starting...'
            : selectedExercises.length > 0
              ? `Start Workout · ${selectedExercises.length} exercise${selectedExercises.length > 1 ? 's' : ''}`
              : 'Select exercises to begin'}
        </button>
      </div>
    </div>
  )
}

export default function NewWorkoutPage() {
  return (
    <Suspense fallback={<div className="p-4 text-muted-foreground">Loading...</div>}>
      <NewWorkoutContent />
    </Suspense>
  )
}
