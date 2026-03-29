'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X, Check } from 'lucide-react'
import { EXERCISES, EXERCISES_BY_MUSCLE, type ExerciseEntry } from '@/lib/exercises'
import type { MuscleGroup } from '@/types'

const MUSCLE_GROUPS: MuscleGroup[] = ['chest', 'back', 'legs', 'shoulders', 'arms', 'core']

interface ExercisePickerModalProps {
  open: boolean
  onClose: () => void
  onAdd: (exerciseIds: string[]) => void
  /** Exercise IDs already in the workout (shown as disabled) */
  existingExerciseIds: string[]
}

export function ExercisePickerModal({ open, onClose, onAdd, existingExerciseIds }: ExercisePickerModalProps) {
  const [search, setSearch] = useState('')
  const [filterMuscle, setFilterMuscle] = useState<MuscleGroup | 'all'>('all')
  const [selected, setSelected] = useState<string[]>([])
  const listRef = useRef<HTMLDivElement>(null)

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setSearch('')
      setFilterMuscle('all')
      setSelected([])
    }
  }, [open])

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [open])

  if (!open) return null

  const filteredExercises = (filterMuscle === 'all' ? EXERCISES : EXERCISES_BY_MUSCLE[filterMuscle])
    .filter(ex => !search || ex.name.toLowerCase().includes(search.toLowerCase()))

  function toggleExercise(id: string) {
    if (existingExerciseIds.includes(id)) return
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function handleAdd() {
    if (selected.length > 0) onAdd(selected)
    onClose()
  }

  // Close and save: if exercises are selected, add them before closing
  function handleClose() {
    if (selected.length > 0) {
      onAdd(selected)
    }
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Sheet */}
      <div className="fixed inset-x-0 bottom-0 top-14 z-50 flex flex-col rounded-t-3xl border-t border-white/12 bg-background page-transition">
        {/* Handle */}
        <div className="flex justify-center pt-2.5 pb-1">
          <div className="h-1 w-9 rounded-full bg-white/15" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3">
          <h2 className="text-xl font-bold font-[family-name:var(--font-display)]">Add Exercises</h2>
          <button
            onClick={handleClose}
            className={`flex h-8 items-center justify-center rounded-lg border transition-colors ${
              selected.length > 0
                ? 'gap-1.5 px-3 border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 font-semibold text-xs'
                : 'w-8 border-white/10 bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10'
            }`}
          >
            {selected.length > 0 ? (
              <>
                <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                Done
              </>
            ) : (
              <X className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Scrollable body */}
        <div ref={listRef} className="flex-1 overflow-y-auto px-5 pb-4" style={{ scrollbarWidth: 'none' }}>
          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              placeholder="Search exercises..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
              autoFocus
            />
          </div>

          {/* Muscle group filters */}
          <div className="flex flex-wrap gap-2 mb-4">
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

          {/* Exercise list */}
          <div className="space-y-2">
            {filteredExercises.map(ex => {
              const inWorkout = existingExerciseIds.includes(ex.id)
              const isSelected = selected.includes(ex.id)

              return (
                <button
                  key={ex.id}
                  onClick={() => toggleExercise(ex.id)}
                  disabled={inWorkout}
                  className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors ${
                    inWorkout
                      ? 'opacity-35 cursor-default'
                      : isSelected
                        ? 'border-foreground bg-muted'
                        : 'hover:bg-muted/50'
                  }`}
                >
                  <div>
                    <p className="font-medium text-sm">{ex.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{ex.primary_muscle}</p>
                  </div>
                  {inWorkout && (
                    <span className="rounded-full bg-white/6 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                      In workout
                    </span>
                  )}
                  {isSelected && (
                    <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                      ✓ Added
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Sticky CTA */}
        <div className="px-5 pb-6 pt-3" style={{ background: 'linear-gradient(to top, var(--background) 70%, transparent)' }}>
          <button
            onClick={handleAdd}
            disabled={selected.length === 0}
            className="w-full rounded-2xl bg-gold py-4 text-sm font-semibold text-[oklch(0.11_0.008_285)] glow-gold shadow-xl transition-opacity disabled:opacity-40"
          >
            {selected.length > 0
              ? `Add ${selected.length} Exercise${selected.length > 1 ? 's' : ''}`
              : 'Select exercises to add'}
          </button>
        </div>
      </div>
    </>
  )
}
