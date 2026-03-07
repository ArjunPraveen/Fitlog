'use client'

import { useState } from 'react'
import { BookmarkPlus, Check, X } from 'lucide-react'
import { createClient } from '@/lib/supabase'

export function SaveTemplateButton({ workoutId, defaultName }: { workoutId: string; defaultName: string }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(defaultName)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function save() {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: sets } = await supabase
      .from('workout_sets')
      .select('exercise_id')
      .eq('workout_id', workoutId)

    const exerciseIds = [...new Set((sets ?? []).map((s: any) => s.exercise_id))]

    await supabase.from('workout_templates').insert({
      user_id: user.id,
      name: name.trim() || defaultName,
      exercise_ids: exerciseIds,
    })

    setSaving(false)
    setOpen(false)
    setSaved(true)
  }

  if (saved) {
    return (
      <span className="flex items-center gap-1 text-xs text-primary font-medium">
        <Check className="h-3.5 w-3.5" /> Saved as template
      </span>
    )
  }

  return (
    <div className="mt-2">
      {!open ? (
        <button
          onClick={e => { e.preventDefault(); e.stopPropagation(); setOpen(true) }}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <BookmarkPlus className="h-3.5 w-3.5" />
          Save as template
        </button>
      ) : (
        <div
          className="flex items-center gap-2"
          onClick={e => { e.preventDefault(); e.stopPropagation() }}
        >
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-foreground focus:outline-none focus:border-primary/50"
            placeholder="Template name"
            onKeyDown={e => e.key === 'Enter' && save()}
          />
          <button
            onClick={save}
            disabled={saving}
            className="text-xs font-semibold text-primary hover:text-primary/80 disabled:opacity-50"
          >
            {saving ? '...' : 'Save'}
          </button>
          <button
            onClick={() => setOpen(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}
