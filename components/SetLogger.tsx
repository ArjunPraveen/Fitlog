'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Check, Plus, Trash2 } from 'lucide-react'

export interface LoggedSet {
  id?: string
  set_number: number
  reps: number
  weight_kg: number
}

interface SetLoggerProps {
  exerciseId: string
  sets: LoggedSet[]
  overloadHint?: string
  onAddSet: (set: Omit<LoggedSet, 'id'>) => Promise<void>
  onDeleteSet: (setNumber: number) => Promise<void>
}

export function SetLogger({ exerciseId, sets, overloadHint, onAddSet, onDeleteSet }: SetLoggerProps) {
  const lastSet = sets[sets.length - 1]
  const [reps, setReps] = useState(lastSet?.reps?.toString() ?? '8')
  const [weight, setWeight] = useState(lastSet?.weight_kg?.toString() ?? '0')
  const [saving, setSaving] = useState(false)

  async function handleAdd() {
    const repsNum = parseInt(reps)
    const weightNum = parseFloat(weight)
    if (isNaN(repsNum) || isNaN(weightNum)) return

    setSaving(true)
    await onAddSet({
      set_number: sets.length + 1,
      reps: repsNum,
      weight_kg: weightNum,
    })
    setSaving(false)
  }

  return (
    <div className="space-y-3">
      {overloadHint && (
        <p className="rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">
          {overloadHint}
        </p>
      )}

      {sets.length > 0 && (
        <div className="space-y-1">
          <div className="grid grid-cols-[32px_1fr_1fr_32px] gap-2 px-1 text-xs text-muted-foreground">
            <span>#</span>
            <span>Weight (kg)</span>
            <span>Reps</span>
            <span />
          </div>
          {sets.map(set => (
            <div
              key={set.set_number}
              className="grid grid-cols-[32px_1fr_1fr_32px] items-center gap-2 rounded-md bg-muted px-2 py-1.5"
            >
              <span className="text-xs text-muted-foreground">{set.set_number}</span>
              <span className="text-sm font-medium">{set.weight_kg}kg</span>
              <span className="text-sm">{set.reps} reps</span>
              <button
                onClick={() => onDeleteSet(set.set_number)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Input
          type="number"
          placeholder="kg"
          value={weight}
          onChange={e => setWeight(e.target.value)}
          className="text-center"
          step="2.5"
          min="0"
        />
        <span className="text-muted-foreground">×</span>
        <Input
          type="number"
          placeholder="reps"
          value={reps}
          onChange={e => setReps(e.target.value)}
          className="text-center"
          min="1"
        />
        <Button size="icon" onClick={handleAdd} disabled={saving} className="shrink-0">
          {saving ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  )
}
