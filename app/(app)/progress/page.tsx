'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase'
import { EXERCISES } from '@/lib/exercises'
import { PageTransition } from '@/components/PageTransition'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

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

        <motion.div
          key={selectedExercise}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-2xl border border-white/8 card-luxury p-5"
        >
          <p className="text-xs tracking-widest uppercase text-muted-foreground mb-1">Weight over time</p>
          <p className="font-semibold text-foreground mb-5">{selectedEx?.name}</p>

          {loading ? (
            <p className="text-sm text-muted-foreground py-12 text-center">Loading...</p>
          ) : data.length === 0 ? (
            <p className="text-sm text-muted-foreground py-12 text-center">No data yet — log this exercise to see progress.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data}>
                <defs>
                  <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="oklch(0.80 0.10 82)" />
                    <stop offset="100%" stopColor="oklch(0.58 0.08 58)" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 6%)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'oklch(0.58 0.02 72)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'oklch(0.58 0.02 72)' }} axisLine={false} tickLine={false} unit="kg" width={36} />
                <Tooltip
                  contentStyle={{ background: 'oklch(0.16 0.01 280)', border: '1px solid oklch(1 0 0 / 10%)', borderRadius: '12px', fontSize: '12px' }}
                  labelStyle={{ color: 'oklch(0.93 0.015 72)' }}
                  itemStyle={{ color: 'oklch(0.72 0.09 72)' }}
                  formatter={(v) => [`${v}kg`, 'Weight']}
                />
                <Line type="monotone" dataKey="weight_kg" stroke="url(#goldGrad)" strokeWidth={2.5} dot={{ fill: 'oklch(0.72 0.09 72)', strokeWidth: 0, r: 3 }} activeDot={{ fill: 'oklch(0.80 0.10 82)', r: 5, strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </div>
    </PageTransition>
  )
}
