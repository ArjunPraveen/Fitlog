'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { EXERCISES } from '@/lib/exercises'
import { PageTransition } from '@/components/PageTransition'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

// Stub data for preview
const STUB_DATA: Record<string, { date: string; weight_kg: number }[]> = {
  'bench-press': [
    { date: 'Jan 1', weight_kg: 60 }, { date: 'Jan 8', weight_kg: 62.5 },
    { date: 'Jan 15', weight_kg: 62.5 }, { date: 'Jan 22', weight_kg: 65 },
    { date: 'Feb 1', weight_kg: 67.5 }, { date: 'Feb 10', weight_kg: 70 },
  ],
  'barbell-squat': [
    { date: 'Jan 1', weight_kg: 80 }, { date: 'Jan 8', weight_kg: 85 },
    { date: 'Jan 15', weight_kg: 87.5 }, { date: 'Jan 22', weight_kg: 90 },
    { date: 'Feb 1', weight_kg: 92.5 }, { date: 'Feb 10', weight_kg: 95 },
  ],
}

export default function ProgressPage() {
  const [selectedExercise, setSelectedExercise] = useState(EXERCISES[0].id)
  const data = STUB_DATA[selectedExercise] ?? []
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

          {data.length === 0 ? (
            <p className="text-sm text-muted-foreground py-12 text-center">No data yet for this exercise.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data}>
                <defs>
                  <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="oklch(0.88 0.14 82)" />
                    <stop offset="100%" stopColor="oklch(0.62 0.12 58)" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 6%)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'oklch(0.58 0.02 72)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'oklch(0.58 0.02 72)' }} axisLine={false} tickLine={false} unit="kg" width={36} />
                <Tooltip
                  contentStyle={{ background: 'oklch(0.16 0.01 280)', border: '1px solid oklch(1 0 0 / 10%)', borderRadius: '12px', fontSize: '12px' }}
                  labelStyle={{ color: 'oklch(0.93 0.015 72)' }}
                  itemStyle={{ color: 'oklch(0.78 0.13 72)' }}
                  formatter={(v) => [`${v}kg`, 'Weight']}
                />
                <Line
                  type="monotone"
                  dataKey="weight_kg"
                  stroke="url(#goldGrad)"
                  strokeWidth={2.5}
                  dot={{ fill: 'oklch(0.78 0.13 72)', strokeWidth: 0, r: 3 }}
                  activeDot={{ fill: 'oklch(0.88 0.14 82)', r: 5, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </div>
    </PageTransition>
  )
}
