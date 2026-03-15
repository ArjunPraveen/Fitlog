'use client'

import { m } from 'framer-motion'
import { Flame, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface StreakTrackerProps {
  currentStreak: number
  bestStreak: number
  /** Last 7 days, most recent first. true = worked out that day */
  weekDots: boolean[]
}

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

export function StreakTracker({ currentStreak, bestStreak, weekDots }: StreakTrackerProps) {
  // weekDots comes most-recent-first; reverse so Monday is left
  const today = new Date().getDay() // 0=Sun
  // Build labels for last 7 days ending today
  const dayLabels: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    dayLabels.push(['S', 'M', 'T', 'W', 'T', 'F', 'S'][d.getDay()])
  }
  // weekDots is most-recent-first, reverse to oldest-first for display
  const dots = [...weekDots].reverse()

  return (
    <Link href="/streak">
      <div className="rounded-2xl border border-white/8 card-luxury p-4 cursor-pointer hover:border-white/15 transition-colors">
        <div className="flex items-center justify-between">
          {/* Current streak */}
          <div className="flex items-center gap-3">
            <m.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15"
            >
              <Flame className={`h-5 w-5 ${currentStreak > 0 ? 'text-primary' : 'text-muted-foreground'}`} />
            </m.div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold font-display text-gold">{currentStreak}</span>
                <span className="text-xs text-muted-foreground">day{currentStreak !== 1 ? 's' : ''}</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Best: {bestStreak} day{bestStreak !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Week dots + chevron */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              {dots.map((active, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <m.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.05, type: 'spring', stiffness: 300, damping: 20 }}
                    className={`h-3 w-3 rounded-full ${
                      active
                        ? 'bg-primary shadow-[0_0_6px_oklch(0.88_0.26_130/40%)]'
                        : 'bg-white/8'
                    }`}
                  />
                  <span className="text-[9px] text-muted-foreground">{dayLabels[i]}</span>
                </div>
              ))}
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </div>
    </Link>
  )
}
