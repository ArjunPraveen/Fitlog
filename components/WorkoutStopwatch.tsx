'use client'

import { useEffect, useState, useCallback } from 'react'

const MAX_MS = 2.5 * 60 * 60 * 1000

function fmt(ms: number) {
  const totalSecs = Math.floor(ms / 1000)
  const h = Math.floor(totalSecs / 3600)
  const m = Math.floor((totalSecs % 3600) / 60)
  const s = totalSecs % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function WorkoutStopwatch({ startedAt, onAutoFinish }: { startedAt: string; onAutoFinish: (force?: boolean) => void }) {
  const [elapsed, setElapsed] = useState(() => Date.now() - new Date(startedAt).getTime())
  const finish = useCallback(onAutoFinish, [])

  useEffect(() => {
    const interval = setInterval(() => {
      const ms = Date.now() - new Date(startedAt).getTime()
      setElapsed(ms)
      if (ms >= MAX_MS) {
        clearInterval(interval)
        finish(true)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [startedAt, finish])

  const warning = elapsed > MAX_MS * 0.8

  return (
    <div className={`flex flex-col items-center justify-center rounded-2xl py-10 gap-1 border ${
      warning ? 'bg-amber-500/6 border-amber-500/20' : 'bg-white/3 border-white/8'
    }`}>
      <span className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground font-sans">
        {warning ? 'Ending Soon' : 'Workout Time'}
      </span>
      <span className={`font-display text-8xl font-black tabular-nums leading-none tracking-tight ${
        warning ? 'text-amber-400' : 'text-foreground'
      }`}>
        {fmt(elapsed)}
      </span>
      {warning && (
        <span className="text-xs text-amber-400/60 mt-1 font-sans">auto-finishing in {Math.ceil((MAX_MS - elapsed) / 60000)}m</span>
      )}
    </div>
  )
}
