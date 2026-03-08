'use client'

import { useEffect, useState, use, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { getExerciseById, EXERCISES } from '@/lib/exercises'
import { computeProgressiveOverload } from '@/lib/progressive-overload'
import { SetLogger } from '@/components/SetLogger'
import { WorkoutStopwatch } from '@/components/WorkoutStopwatch'
import type { LoggedSet } from '@/components/SetLogger'
import { Button } from '@/components/ui/button'
import { CheckCircle, Youtube, BookmarkPlus, Check, Trash2 } from 'lucide-react'
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
  const [workout, setWorkout] = useState<{ name: string | null; finished_at: string | null; started_at: string; exercise_ids?: string[] } | null>(null)
  const [overloadHints, setOverloadHints] = useState<Record<string, string>>({})
  const [finishing, setFinishing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [confirmEmpty, setConfirmEmpty] = useState(false)
  const [savingTemplate, setSavingTemplate] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [showTemplateSave, setShowTemplateSave] = useState(false)
  const [templateSaved, setTemplateSaved] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch workout metadata + existing sets in parallel
      const [{ data: w }, { data: existingSets }] = await Promise.all([
        supabase.from('workouts').select('name, finished_at, started_at, exercise_ids').eq('id', workoutId).single(),
        supabase.from('workout_sets').select('*').eq('workout_id', workoutId).order('set_number'),
      ])

      setWorkout(w)
      setTemplateName(w?.name ?? '')

      const exerciseIdsFromUrl = searchParams.get('exercises')?.split(',').filter(Boolean) ?? []
      const exerciseIdsFromSets = [...new Set((existingSets ?? []).map((s: WorkoutSet) => s.exercise_id))]
      const exerciseIdsFromWorkout: string[] = (w as any)?.exercise_ids ?? []
      const exerciseIds = exerciseIdsFromUrl.length > 0
        ? exerciseIdsFromUrl
        : exerciseIdsFromSets.length > 0
          ? exerciseIdsFromSets
          : exerciseIdsFromWorkout

      setExerciseSessions(exerciseIds.map(eid => ({
        exerciseId: eid,
        sets: (existingSets ?? [])
          .filter((s: WorkoutSet) => s.exercise_id === eid)
          .map((s: WorkoutSet) => ({ id: s.id, set_number: s.set_number, reps: s.reps, weight_kg: s.weight_kg })),
      })))

      // Show the page immediately — don't wait for overload hints
      setLoading(false)

      // Load overload hints in the background (non-blocking)
      if (exerciseIds.length > 0) {
        supabase
          .from('workout_sets')
          .select('exercise_id, set_number, reps, weight_kg, logged_at, workout_id')
          .in('exercise_id', exerciseIds)
          .neq('workout_id', workoutId)
          .order('logged_at', { ascending: false })
          .limit(60)
          .then(({ data: historicalSets }) => {
            const hints = computeProgressiveOverload((historicalSets ?? []) as any[], exerciseIds)
            const msgs: Record<string, string> = {}
            for (const [eid, hint] of Object.entries(hints)) msgs[eid] = hint.note
            setOverloadHints(msgs)
          })
      }
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

  async function cancelWorkout() {
    const supabase = createClient()
    await supabase.from('workouts').delete().eq('id', workoutId)
    router.push('/dashboard')
  }

  const finishWorkout = useCallback(async (force = false) => {
    if (finishing) return
    const setCount = exerciseSessions.reduce((acc, s) => acc + s.sets.length, 0)
    if (!force && setCount === 0) {
      setConfirmEmpty(true)
      return
    }
    setFinishing(true)
    setConfirmEmpty(false)
    const supabase = createClient()
    await supabase
      .from('workouts')
      .update({ finished_at: new Date().toISOString() })
      .eq('id', workoutId)
    router.push('/history')
  }, [finishing, exerciseSessions, workoutId, router])

  async function saveAsTemplate() {
    setSavingTemplate(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const exerciseIds = exerciseSessions.map(s => s.exerciseId)
    await supabase.from('workout_templates').insert({
      user_id: user.id,
      name: templateName || workout?.name || 'My Template',
      exercise_ids: exerciseIds,
    })
    setSavingTemplate(false)
    setShowTemplateSave(false)
    setTemplateSaved(true)
  }

  const isFinished = workout?.finished_at != null
  const totalSets = exerciseSessions.reduce((acc, s) => acc + s.sets.length, 0)

  if (loading) {
    return <div className="p-4 text-muted-foreground text-sm">Loading workout...</div>
  }

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold truncate">{workout?.name ?? 'Workout'}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isFinished ? 'Completed' : `${totalSets} set${totalSets !== 1 ? 's' : ''} logged`}
          </p>
        </div>
        {!isFinished ? (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setConfirmCancel(v => !v)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors"
              aria-label="Cancel workout"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <Button onClick={() => finishWorkout()} disabled={finishing} size="sm" className="gap-1.5">
              <CheckCircle className="h-4 w-4" />
              {finishing ? 'Saving...' : 'Finish'}
            </Button>
          </div>
        ) : (
          <Button
            onClick={() => setShowTemplateSave(v => !v)}
            size="sm"
            className="gap-1.5 shrink-0"
            disabled={templateSaved}
          >
            {templateSaved ? <Check className="h-4 w-4" /> : <BookmarkPlus className="h-4 w-4" />}
            {templateSaved ? 'Saved!' : 'Save template'}
          </Button>
        )}
      </div>

      {/* Cancel confirmation */}
      {confirmCancel && !isFinished && (
        <div className="flex items-center justify-between rounded-xl border border-red-500/30 bg-red-500/8 px-4 py-3">
          <p className="text-sm text-red-400">Delete this workout?</p>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmCancel(false)}
              className="rounded-lg px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Keep it
            </button>
            <button
              onClick={cancelWorkout}
              className="rounded-lg bg-red-500/20 border border-red-500/30 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/30 transition-colors"
            >
              Yes, delete
            </button>
          </div>
        </div>
      )}

      {/* Empty finish confirmation */}
      {confirmEmpty && (
        <div className="flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/8 px-4 py-3">
          <p className="text-sm text-amber-400">No sets logged — finish anyway?<br /><span className="text-xs text-amber-400/60">This workout will be deleted.</span></p>
          <div className="flex gap-2 shrink-0 ml-3">
            <button
              onClick={() => setConfirmEmpty(false)}
              className="rounded-lg px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Keep going
            </button>
            <button
              onClick={cancelWorkout}
              className="rounded-lg bg-amber-500/20 border border-amber-500/30 px-3 py-1.5 text-xs font-semibold text-amber-400 hover:bg-amber-500/30 transition-colors"
            >
              Delete it
            </button>
          </div>
        </div>
      )}

      {/* Stopwatch — only shown during active workout */}
      {!isFinished && workout?.started_at && (
        <WorkoutStopwatch startedAt={workout.started_at} onAutoFinish={finishWorkout} />
      )}

      {/* Inline template name input */}
      {isFinished && showTemplateSave && !templateSaved && (
        <div className="flex gap-2">
          <input
            value={templateName}
            onChange={e => setTemplateName(e.target.value)}
            placeholder="Template name"
            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground focus:border-primary/50 focus:outline-none"
          />
          <Button onClick={saveAsTemplate} disabled={savingTemplate} size="sm">
            {savingTemplate ? 'Saving...' : 'Save'}
          </Button>
        </div>
      )}

      {/* Exercise cards */}
      {exerciseSessions.map(({ exerciseId, sets }) => {
        const ex = getExerciseById(exerciseId) ?? EXERCISES.find(e => e.id === exerciseId)
        if (!ex) return null
        return (
          <div key={exerciseId} className="rounded-2xl border border-white/8 card-luxury overflow-hidden">
            <div className="px-4 py-3 flex items-start justify-between border-b border-white/6">
              <div>
                <p className="font-semibold text-sm">{ex.name}</p>
                <span className="mt-1 inline-block rounded-full bg-white/8 px-2 py-0.5 text-[11px] font-medium text-muted-foreground capitalize">
                  {ex.primary_muscle}
                </span>
              </div>
              {ex.youtube_url && (
                <a
                  href={ex.youtube_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-red-500 transition-colors mt-0.5"
                >
                  <Youtube className="h-4 w-4" />
                </a>
              )}
            </div>
            <div className="p-4">
              {isFinished ? (
                <div className="space-y-1.5">
                  {sets.map(s => (
                    <div key={s.set_number} className="flex gap-4 text-sm">
                      <span className="text-muted-foreground w-6 tabular-nums">#{s.set_number}</span>
                      <span>{s.weight_kg}kg × {s.reps} reps</span>
                    </div>
                  ))}
                  {sets.length === 0 && <p className="text-xs text-muted-foreground">No sets logged</p>}
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
            </div>
          </div>
        )
      })}
    </div>
  )
}
