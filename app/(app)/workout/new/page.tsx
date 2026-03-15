'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search } from 'lucide-react'
import { EXERCISES, EXERCISES_BY_MUSCLE, getExerciseById } from '@/lib/exercises'
import type { MuscleGroup } from '@/types'
import { revalidateDashboard } from '@/lib/actions'
import { computeMuscleRecovery, buildSmartSuggestion, type SmartSuggestion } from '@/lib/suggestions'
import { Dumbbell, Flame } from 'lucide-react'

const MUSCLE_GROUPS: MuscleGroup[] = ['chest', 'back', 'legs', 'shoulders', 'arms', 'core']

function NewWorkoutContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const mode = searchParams.get('mode') ?? 'scratch'

  const [search, setSearch] = useState('')
  const [selectedExercises, setSelectedExercises] = useState<string[]>([])
  const [filterMuscle, setFilterMuscle] = useState<MuscleGroup | 'all'>('all')
  const [loading, setLoading] = useState(false)
  const [templates, setTemplates] = useState<{ id: string; name: string; exercise_ids: string[] }[]>([])
  const [suggestion, setSuggestion] = useState<SmartSuggestion | null>(null)
  const [suggestionLoading, setSuggestionLoading] = useState(mode === 'suggested')
  const [showSuggestionCard, setShowSuggestionCard] = useState(true)

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

  useEffect(() => {
    if (mode !== 'suggested') return
    const supabase = createClient()

    async function loadSuggestion() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setSuggestionLoading(false); return }

      const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()

      // Fetch recent sets for recovery + exercise history in parallel
      const [recoveryResult, historyResult] = await Promise.all([
        supabase
          .from('workout_sets')
          .select('exercise_id, logged_at')
          .eq('user_id', user.id)
          .gte('logged_at', fourteenDaysAgo),
        supabase
          .from('workout_sets')
          .select('exercise_id')
          .eq('user_id', user.id)
          .gte('logged_at', ninetyDaysAgo),
      ])

      // Build recovery from recent sets — need exercise_primary_muscle
      const recentSets = (recoveryResult.data ?? []).map(s => ({
        exercise_primary_muscle: getExerciseById(s.exercise_id)?.primary_muscle as MuscleGroup,
        logged_at: s.logged_at,
      })).filter(s => s.exercise_primary_muscle)

      const recovery = computeMuscleRecovery(recentSets)

      // Build per-muscle exercise history (ordered by frequency)
      const freqMap: Record<string, number> = {}
      for (const row of historyResult.data ?? []) {
        freqMap[row.exercise_id] = (freqMap[row.exercise_id] || 0) + 1
      }
      const userExerciseHistory: Partial<Record<MuscleGroup, string[]>> = {}
      const sortedExIds = Object.entries(freqMap).sort((a, b) => b[1] - a[1]).map(([id]) => id)
      for (const exId of sortedExIds) {
        const ex = getExerciseById(exId)
        if (!ex) continue
        const m = ex.primary_muscle
        if (!userExerciseHistory[m]) userExerciseHistory[m] = []
        userExerciseHistory[m]!.push(exId)
      }

      const result = buildSmartSuggestion(recovery, userExerciseHistory)
      setSuggestion(result)
      setSuggestionLoading(false)
    }

    loadSuggestion()
  }, [mode])

  const filteredExercises = (filterMuscle === 'all' ? EXERCISES : EXERCISES_BY_MUSCLE[filterMuscle])
    .filter(ex => !search || ex.name.toLowerCase().includes(search.toLowerCase()))

  function toggleExercise(id: string) {
    setSelectedExercises(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  function autoName() {
    const muscles = [...new Set(selectedExercises.map(id => getExerciseById(id)?.primary_muscle).filter(Boolean))] as string[]
    const labelled = muscles.map(m => m.charAt(0).toUpperCase() + m.slice(1))
    if (labelled.length === 0) return null
    if (labelled.length === 1) return `${labelled[0]} Day`
    if (labelled.length === 2) return `${labelled[0]} & ${labelled[1]} Day`
    return `${labelled.slice(0, -1).join(', ')} & ${labelled[labelled.length - 1]} Day`
  }

  async function startWorkoutWithExercises(exerciseIds: string[]) {
    if (exerciseIds.length === 0) return
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Build auto-name from the exercise IDs
    const muscles = [...new Set(exerciseIds.map(id => getExerciseById(id)?.primary_muscle).filter(Boolean))] as string[]
    const labelled = muscles.map(m => m.charAt(0).toUpperCase() + m.slice(1))
    let name: string | null = null
    if (labelled.length === 1) name = `${labelled[0]} Day`
    else if (labelled.length === 2) name = `${labelled[0]} & ${labelled[1]} Day`
    else if (labelled.length > 2) name = `${labelled.slice(0, -1).join(', ')} & ${labelled[labelled.length - 1]} Day`

    const { data: workout, error } = await supabase
      .from('workouts')
      .insert({
        user_id: user.id,
        name,
        exercise_ids: exerciseIds,
        started_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (error || !workout) {
      setLoading(false)
      return
    }

    await revalidateDashboard()
    router.push(`/workout/${workout.id}?exercises=${exerciseIds.join(',')}`)
  }

  async function startWorkout() {
    await startWorkoutWithExercises(selectedExercises)
  }

  function loadTemplate(template: { id: string; name: string; exercise_ids: string[] }) {
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

      {/* Smart Suggestion Card */}
      {mode === 'suggested' && showSuggestionCard && (
        <>
          {suggestionLoading ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
              <div className="animate-pulse space-y-3">
                <div className="h-4 w-40 mx-auto rounded bg-white/10" />
                <div className="h-3 w-56 mx-auto rounded bg-white/10" />
              </div>
            </div>
          ) : suggestion ? (
            <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.06] to-transparent p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-primary" />
                <h2 className="font-bold text-base">Today&apos;s Suggestion</h2>
              </div>

              <p className="text-sm text-muted-foreground">
                {suggestion.muscles.map(m => m.charAt(0).toUpperCase() + m.slice(1)).join(' & ')} &middot; {suggestion.exercises.length} exercises
              </p>

              {suggestion.muscles.map(muscle => (
                <div key={muscle} className="space-y-1">
                  <p className="text-[11px] tracking-widest uppercase text-muted-foreground">{muscle}</p>
                  <p className="text-sm text-foreground/90">
                    {suggestion.exercises
                      .filter(ex => ex.primary_muscle === muscle)
                      .map(ex => ex.name)
                      .join(', ')}
                  </p>
                </div>
              ))}

              <div className="flex gap-3 pt-1">
                <button
                  onClick={async () => {
                    setSelectedExercises(suggestion.exercises.map(ex => ex.id))
                    await startWorkoutWithExercises(suggestion.exercises.map(ex => ex.id))
                  }}
                  disabled={loading}
                  className="flex-1 rounded-xl bg-gold py-3 text-sm font-semibold text-[oklch(0.11_0.008_285)] glow-gold transition-opacity disabled:opacity-40"
                >
                  {loading ? 'Starting...' : 'Start Now'}
                </button>
                <button
                  onClick={() => {
                    setSelectedExercises(suggestion.exercises.map(ex => ex.id))
                    setShowSuggestionCard(false)
                  }}
                  className="flex-1 rounded-xl border border-white/15 py-3 text-sm font-medium hover:bg-white/5 transition-colors"
                >
                  Customize
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center space-y-2">
              <Dumbbell className="h-6 w-6 mx-auto text-muted-foreground" />
              <p className="font-semibold text-sm">All muscles are recovering</p>
              <p className="text-xs text-muted-foreground">Take a rest day or pick exercises manually below.</p>
            </div>
          )}
        </>
      )}

      {/* Normal picker UI — hidden when suggestion card is active */}
      {!(mode === 'suggested' && showSuggestionCard && (suggestionLoading || suggestion)) && (
      <>
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          placeholder="Search exercises..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
        />
      </div>

      {mode === 'template' && (
        <div className="space-y-2">
          <p className="text-xs tracking-widest uppercase text-muted-foreground">Your Templates</p>
          {templates.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center rounded-xl border border-white/8">
              No templates yet — finish a workout and save it as a template.
            </p>
          ) : (
            templates.map(t => {
              const loaded = t.exercise_ids.every(id => selectedExercises.includes(id))
              return (
                <button
                  key={t.id}
                  onClick={() => loadTemplate(t)}
                  className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors ${
                    loaded ? 'border-primary/40 bg-primary/8' : 'border-white/8 card-luxury hover:border-white/15'
                  }`}
                >
                  <div>
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t.exercise_ids.length} exercise{t.exercise_ids.length !== 1 ? 's' : ''}</p>
                  </div>
                  {loaded && <span className="text-xs text-primary font-medium">Loaded</span>}
                </button>
              )
            })
          )}
        </div>
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
      </>
      )}
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
