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
    <div className={`flex items-center gap-2 rounded-xl px-3 py-2 border ${
      warning
        ? 'bg-amber-500/10 border-amber-500/25'
        : 'bg-white/5 border-white/8'
    }`}>
      <Timer className={`h-4 w-4 shrink-0 ${warning ? 'text-amber-400' : 'text-primary'}`} />
      <span className={`font-mono text-sm font-semibold tabular-nums ${warning ? 'text-amber-400' : 'text-foreground'}`}>
        {fmt(elapsed)}
      </span>
      {warning && <span className="text-[11px] text-amber-400/70">ending soon</span>}
    </div>
  )
}
