'use client'

import { useEffect, useState, useCallback } from 'react'
import { Timer } from 'lucide-react'

const MAX_MS = 2.5 * 60 * 60 * 1000 // 150 minutes

function fmt(ms: number) {
  const totalSecs = Math.floor(ms / 1000)
  const h = Math.floor(totalSecs / 3600)
  const m = Math.floor((totalSecs % 3600) / 60)
  const s = totalSecs % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function WorkoutStopwatch({ startedAt, onAutoFinish }: { startedAt: string; onAutoFinish: () => void }) {
  const [elapsed, setElapsed] = useState(() => Date.now() - new Date(startedAt).getTime())
  const finish = useCallback(onAutoFinish, [])

  useEffect(() => {
    const interval = setInterval(() => {
      const ms = Date.now() - new Date(startedAt).getTime()
      setElapsed(ms)
      if (ms >= MAX_MS) {
        clearInterval(interval)
        finish()
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [startedAt, finish])

  const warning = elapsed > MAX_MS * 0.8

  return (
    <div className={`flex flex-col items-center justify-center rounded-2xl border py-8 gap-2 ${
      warning ? 'bg-amber-500/8 border-amber-500/25' : 'bg-white/3 border-white/8'
    }`}>
      <div className="flex items-center gap-2">
        <Timer className={`h-5 w-5 ${warning ? 'text-amber-400' : 'text-muted-foreground'}`} />
        <span className="text-xs tracking-widest uppercase text-muted-foreground">
          {warning ? 'Ending soon' : 'Workout time'}
        </span>
      </div>
      <span className={`font-mono text-6xl font-bold tabular-nums tracking-tight ${
        warning ? 'text-amber-400' : 'text-foreground'
      }`}>
        {fmt(elapsed)}
      </span>
    </div>
  )
}
