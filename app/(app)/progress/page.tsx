'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase'
import { EXERCISES } from '@/lib/exercises'
import { PageTransition } from '@/components/PageTransition'

const ProgressChart = dynamic(
  () => import('@/components/ProgressChart').then(m => ({ default: m.ProgressChart })),
  { ssr: false, loading: () => <p className="text-sm text-muted-foreground py-12 text-center">Loading chart...</p> }
)

interface SetPoint {
  date: string
  weight_kg: number
}

export default function ProgressPage() {
  const [selectedExercise, setSelectedExercise] = useState(EXERCISES[0].id)
  const [data, setData] = useState<SetPoint[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function fetchProgress() {
      setLoading(true)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: sets } = await supabase
        .from('workout_sets')
        .select('weight_kg, reps, logged_at, workouts!inner(user_id, finished_at)')
        .eq('workouts.user_id', user.id)
        .not('workouts.finished_at', 'is', null)
        .eq('exercise_id', selectedExercise)
        .order('logged_at', { ascending: true })
        .limit(200)

      setData(
        (sets ?? []).map((s: any) => ({
          date: new Date(s.logged_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          weight_kg: s.weight_kg,
        }))
      )
      setLoading(false)
    }
    fetchProgress()
  }, [selectedExercise])

  const selectedEx = EXERCISES.find(e => e.id === selectedExercise)

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <p className="text-xs tracking-widest uppercase text-muted-foreground mb-1">Tracking</p>
          <h1 className="text-3xl font-bold text-gold">Progress</h1>
        </div>

        <select
          value={selectedExercise}
          onChange={e => setSelectedExercise(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-foreground focus:border-primary/50 focus:outline-none"
        >
          {EXERCISES.map(ex => (
            <option key={ex.id} value={ex.id} className="bg-[oklch(0.16_0.01_280)]">
              {ex.name}
            </option>
          ))}
        </select>

        <div key={selectedExercise} className="page-transition rounded-2xl border border-white/8 card-luxury p-5">
          <p className="text-xs tracking-widest uppercase text-muted-foreground mb-1">Weight over time</p>
          <p className="font-semibold text-foreground mb-5">{selectedEx?.name}</p>

          {loading ? (
            <p className="text-sm text-muted-foreground py-12 text-center">Loading...</p>
          ) : data.length === 0 ? (
            <p className="text-sm text-muted-foreground py-12 text-center">No data yet — log this exercise to see progress.</p>
          ) : (
            <ProgressChart data={data} />
          )}
        </div>
      </div>
    </PageTransition>
  )
}
