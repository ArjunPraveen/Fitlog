'use client'

import { useState, useEffect } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { Sparkles, Check, Copy } from 'lucide-react'
import { AI_APPS, getSavedAIApp, saveAIApp, getAIApp, type AIAppId } from '@/lib/ai-preference'
import { buildWorkoutReviewPrompt } from '@/lib/ai-review-prompt'
import type { WorkoutSet } from '@/types'

interface AIReviewButtonProps {
  workoutName: string
  startedAt: string
  finishedAt: string
  exerciseSessions: { exerciseId: string; sets: { set_number: number; reps: number; weight_kg: number }[] }[]
  historicalSets: Pick<WorkoutSet, 'exercise_id' | 'workout_id' | 'weight_kg' | 'reps' | 'logged_at'>[]
}

export function AIReviewButton({
  workoutName, startedAt, finishedAt, exerciseSessions, historicalSets,
}: AIReviewButtonProps) {
  const [aiApp, setAiApp] = useState<AIAppId>('chatgpt')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setAiApp(getSavedAIApp())
  }, [])

  function handleSelectApp(id: AIAppId) {
    setAiApp(id)
    saveAIApp(id)
  }

  function handleCopyAndOpen() {
    const prompt = buildWorkoutReviewPrompt({
      workoutName,
      date: new Date(finishedAt).toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
      }),
      startedAt,
      finishedAt,
      exercises: exerciseSessions.map(s => ({
        exerciseId: s.exerciseId,
        sets: s.sets,
      })),
      historicalSets,
    })

    const app = getAIApp(aiApp)

    // Open app first (sync, avoids popup blocker)
    window.open(app.url, '_blank')

    // Copy to clipboard
    navigator.clipboard.writeText(prompt).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {
      // Fallback: clipboard failed, app still opened
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const selectedApp = getAIApp(aiApp)

  return (
    <div className="rounded-2xl border border-white/8 card-luxury p-5 space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center h-8 w-8 rounded-xl bg-primary/15">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">AI Workout Review</p>
          <p className="text-[11px] text-muted-foreground">Get AI feedback on your session</p>
        </div>
      </div>

      {/* AI App Selector */}
      <div className="flex gap-2">
        {AI_APPS.map(app => (
          <button
            key={app.id}
            onClick={() => handleSelectApp(app.id)}
            className={`flex-1 rounded-xl border py-2.5 text-xs font-medium transition-all ${
              aiApp === app.id
                ? 'bg-primary border-transparent text-primary-foreground'
                : 'border-white/10 text-muted-foreground hover:border-white/20 hover:text-foreground'
            }`}
          >
            {app.name}
          </button>
        ))}
      </div>

      {/* Copy & Open Button */}
      <m.button
        whileTap={{ scale: 0.98 }}
        onClick={handleCopyAndOpen}
        disabled={copied}
        className="w-full rounded-xl bg-white/8 border border-white/10 py-3 text-sm font-medium text-foreground transition-all hover:bg-white/12 disabled:opacity-70"
      >
        <AnimatePresence mode="wait" initial={false}>
          {copied ? (
            <m.span
              key="copied"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="flex items-center justify-center gap-2 text-primary"
            >
              <Check className="h-4 w-4" /> Copied! Opening {selectedApp.name}...
            </m.span>
          ) : (
            <m.span
              key="default"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="flex items-center justify-center gap-2"
            >
              <Copy className="h-4 w-4" /> Copy & Open {selectedApp.name}
            </m.span>
          )}
        </AnimatePresence>
      </m.button>

      <p className="text-[10px] text-muted-foreground/60 text-center">
        Copies your workout summary to clipboard and opens {selectedApp.name}. Just paste!
      </p>
    </div>
  )
}
