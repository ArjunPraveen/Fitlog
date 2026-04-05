'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, X, ChevronDown } from 'lucide-react'
import { EXERCISES, EXERCISES_BY_MUSCLE, type ExerciseEntry } from '@/lib/exercises'
import type { MuscleGroup } from '@/types'

const MUSCLE_GROUPS: { key: MuscleGroup; label: string }[] = [
  { key: 'chest', label: 'Chest' },
  { key: 'back', label: 'Back' },
  { key: 'legs', label: 'Legs' },
  { key: 'shoulders', label: 'Shoulders' },
  { key: 'arms', label: 'Arms' },
  { key: 'core', label: 'Core' },
]

interface ExercisePickerProps {
  value: string
  onChange: (exerciseId: string) => void
  /** Only show exercises the user has data for */
  exerciseIdsWithData?: string[]
}

export function ExercisePicker({ value, onChange, exerciseIdsWithData }: ExercisePickerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [muscleFilter, setMuscleFilter] = useState<MuscleGroup | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selectedExercise = EXERCISES.find(e => e.id === value)

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  // Filter exercises
  let filtered = muscleFilter ? EXERCISES_BY_MUSCLE[muscleFilter] : EXERCISES
  if (search.trim()) {
    const q = search.toLowerCase()
    filtered = filtered.filter(e =>
      e.name.toLowerCase().includes(q) ||
      e.primary_muscle.toLowerCase().includes(q)
    )
  }

  // If we have data info, sort exercises with data first
  if (exerciseIdsWithData) {
    const dataSet = new Set(exerciseIdsWithData)
    filtered = [...filtered].sort((a, b) => {
      const aHas = dataSet.has(a.id) ? 0 : 1
      const bHas = dataSet.has(b.id) ? 0 : 1
      return aHas - bHas
    })
  }

  function handleSelect(ex: ExerciseEntry) {
    onChange(ex.id)
    setOpen(false)
    setSearch('')
    setMuscleFilter(null)
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button */}
      <button
        onClick={() => {
          setOpen(!open)
          if (!open) setTimeout(() => inputRef.current?.focus(), 50)
        }}
        className="w-full flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-left transition-colors hover:bg-white/8 focus:border-primary/50 focus:outline-none"
      >
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-0.5">Exercise</p>
          <p className="text-sm font-medium text-foreground truncate">
            {selectedExercise?.name ?? 'Select exercise'}
          </p>
        </div>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-2 w-full rounded-2xl border border-white/10 bg-[oklch(0.10_0_0)] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Search bar */}
          <div className="flex items-center gap-2 border-b border-white/8 px-4 py-3">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search exercises..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Muscle group filter chips */}
          <div className="flex gap-1.5 px-4 py-2.5 overflow-x-auto scrollbar-hide border-b border-white/8">
            <button
              onClick={() => setMuscleFilter(null)}
              className={`shrink-0 rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                !muscleFilter
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-white/5 text-muted-foreground hover:text-foreground'
              }`}
            >
              All
            </button>
            {MUSCLE_GROUPS.map(mg => (
              <button
                key={mg.key}
                onClick={() => setMuscleFilter(muscleFilter === mg.key ? null : mg.key)}
                className={`shrink-0 rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                  muscleFilter === mg.key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-white/5 text-muted-foreground hover:text-foreground'
                }`}
              >
                {mg.label}
              </button>
            ))}
          </div>

          {/* Exercise list */}
          <div className="max-h-64 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No exercises found</p>
            ) : (
              filtered.map(ex => {
                const isSelected = ex.id === value
                const hasData = exerciseIdsWithData ? new Set(exerciseIdsWithData).has(ex.id) : true
                return (
                  <button
                    key={ex.id}
                    onClick={() => handleSelect(ex)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-white/5 ${
                      isSelected ? 'bg-primary/10' : ''
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm truncate ${isSelected ? 'text-primary font-medium' : 'text-foreground'}`}>
                        {ex.name}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">{ex.primary_muscle}</p>
                    </div>
                    {!hasData && (
                      <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">No data</span>
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
