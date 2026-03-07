'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { EXERCISES, EXERCISES_BY_MUSCLE } from '@/lib/exercises'
import { PageTransition } from '@/components/PageTransition'
import { Input } from '@/components/ui/input'
import { Search, ExternalLink, ChevronRight } from 'lucide-react'
import type { MuscleGroup } from '@/types'

const MUSCLE_GROUPS: MuscleGroup[] = ['chest', 'back', 'legs', 'shoulders', 'arms', 'core']

const MUSCLE_COLORS: Record<MuscleGroup, string> = {
  chest:     'bg-rose-500/20 text-rose-300 border-rose-500/30',
  back:      'bg-blue-500/20 text-blue-300 border-blue-500/30',
  legs:      'bg-violet-500/20 text-violet-300 border-violet-500/30',
  shoulders: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  arms:      'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  core:      'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
}
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

export default function ExercisesPage() {
  const [filterMuscle, setFilterMuscle] = useState<MuscleGroup | 'all'>('all')
  const [search, setSearch] = useState('')

  const base = filterMuscle === 'all' ? EXERCISES : EXERCISES_BY_MUSCLE[filterMuscle]
  const filtered = search
    ? base.filter(e => e.name.toLowerCase().includes(search.toLowerCase()))
    : base

  return (
    <PageTransition>
      <div className="space-y-5">
        <div>
          <p className="text-xs tracking-widest uppercase text-muted-foreground mb-1">Library</p>
          <h1 className="text-3xl font-bold text-gold">Exercises</h1>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search exercises..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-white/5 border-white/10 focus:border-primary/50"
          />
        </div>

        {/* Muscle filter chips */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterMuscle('all')}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
              filterMuscle === 'all'
                ? 'bg-gold border-transparent text-[oklch(0.11_0.008_285)]'
                : 'border-white/10 text-muted-foreground hover:border-white/20'
            }`}
          >
            All
          </button>
          {MUSCLE_GROUPS.map(m => (
            <button
              key={m}
              onClick={() => setFilterMuscle(m)}
              className={`rounded-full border px-3 py-1 text-xs font-medium capitalize transition-all ${
                filterMuscle === m
                  ? 'bg-gold border-transparent text-[oklch(0.11_0.008_285)]'
                  : 'border-white/10 text-muted-foreground hover:border-white/20'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Exercise list */}
        <motion.div
          key={`${filterMuscle}-${search}`}
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-2"
        >
          {filtered.map(ex => (
            <motion.div key={ex.id} variants={item}>
              <Link href={`/exercises/${ex.id}`}>
                <motion.div
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  className="flex items-center justify-between rounded-xl border border-white/8 card-luxury px-4 py-3.5 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className={`rounded-lg border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${MUSCLE_COLORS[ex.primary_muscle]}`}>
                      {ex.primary_muscle}
                    </span>
                    <span className="font-medium text-sm">{ex.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    {ex.youtube_url && <ExternalLink className="h-3.5 w-3.5" />}
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground py-8 text-center">No exercises found.</p>
          )}
        </motion.div>
      </div>
    </PageTransition>
  )
}
