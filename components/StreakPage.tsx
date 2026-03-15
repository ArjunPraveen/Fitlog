'use client'

import { m } from 'framer-motion'
import { useRef, useEffect } from 'react'
import { Flame, ChevronRight, Trophy, Calendar, Dumbbell } from 'lucide-react'
import Link from 'next/link'

interface MonthData {
  label: string
  grid: { day: number; worked: boolean; future: boolean }[]
}

interface StreakPageProps {
  currentStreak: number
  bestStreak: number
  weekDots: boolean[]
  months: MonthData[]
  totalWorkouts: number
  thisMonthCount: number
}

function getMotivation(streak: number) {
  if (streak === 0) return 'Start your streak today'
  if (streak <= 2) return 'Getting started!'
  if (streak <= 6) return 'Building momentum!'
  if (streak <= 13) return "You're on fire!"
  if (streak <= 29) return 'Unstoppable!'
  return 'Legend status!'
}

function MonthCalendar({ month, index }: { month: MonthData; index: number }) {
  return (
    <div className="min-w-[280px] w-[280px] shrink-0">
      <p className="text-[11px] tracking-[0.15em] uppercase text-muted-foreground text-center mb-3 font-medium">
        {month.label}
      </p>
      <div className="rounded-2xl border border-white/8 card-luxury p-4">
        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 gap-1 mb-1.5">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
            <div key={i} className="text-center text-[9px] text-muted-foreground font-medium">{d}</div>
          ))}
        </div>
        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {month.grid.map((cell, i) => {
            if (cell.day === 0) return <div key={`pad-${i}`} />
            if (cell.future) {
              return (
                <div key={cell.day} className="aspect-square rounded-md flex items-center justify-center">
                  <span className="text-[11px] text-white/10">{cell.day}</span>
                </div>
              )
            }
            return (
              <div
                key={cell.day}
                className={`aspect-square rounded-md flex items-center justify-center ${
                  cell.worked
                    ? 'bg-primary/25'
                    : 'bg-white/[0.04]'
                }`}
              >
                <span className={`text-[11px] font-medium ${
                  cell.worked ? 'text-primary' : 'text-white/40'
                }`}>
                  {cell.day}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function StreakPageClient({
  currentStreak,
  bestStreak,
  weekDots,
  months,
  totalWorkouts,
  thisMonthCount,
}: StreakPageProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Scroll to leftmost position (current month) on mount
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = 0
    }
  }, [])

  // Build day labels for last 7 days
  const dayLabels: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    dayLabels.push(['S', 'M', 'T', 'W', 'T', 'F', 'S'][d.getDay()])
  }
  const dots = [...weekDots].reverse()

  const motivation = getMotivation(currentStreak)
  const isActive = currentStreak > 0

  return (
    <div className="page-transition">
      <div className="flex flex-col items-center pt-2 pb-8">

        {/* ── Hero: Flame + Number (compact) ──────────────────── */}
        <m.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 0.1 }}
          className="flex flex-col items-center"
        >
          {/* Flame circle */}
          <div className="relative">
            {isActive && (
              <div
                className="absolute inset-0 -m-6 rounded-full"
                style={{ background: 'radial-gradient(circle, oklch(0.88 0.26 130 / 10%) 0%, transparent 70%)' }}
              />
            )}
            <div className={`relative flex h-16 w-16 items-center justify-center rounded-full ${
              isActive
                ? 'bg-primary/15 shadow-[0_0_30px_oklch(0.88_0.26_130/20%)]'
                : 'bg-white/5'
            }`}>
              <m.div
                animate={isActive ? { scale: [1, 1.08, 1] } : {}}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
              >
                <Flame className={`h-8 w-8 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
              </m.div>
            </div>
          </div>

          {/* Number + label */}
          <m.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="mt-3 text-center"
          >
            <span className="text-6xl font-black font-display text-gold leading-none tracking-tight">
              {currentStreak}
            </span>
            <p className="text-sm text-muted-foreground mt-0.5">
              day{currentStreak !== 1 ? 's' : ''} streak
            </p>
          </m.div>

          {/* Motivation */}
          <m.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.4 }}
            className={`mt-1.5 text-xs font-medium tracking-wide ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
          >
            {motivation}
          </m.p>
        </m.div>

        {/* ── Week View ────────────────────────────────────────── */}
        <m.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.35 }}
          className="mt-7 w-full max-w-xs"
        >
          <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground text-center mb-3">This Week</p>
          <div className="flex items-center justify-center gap-3">
            {dots.map((active, i) => (
              <m.div
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.45 + i * 0.05, type: 'spring', stiffness: 300, damping: 20 }}
                className="flex flex-col items-center gap-1.5"
              >
                <div className={`h-5 w-5 rounded-full transition-all ${
                  active
                    ? 'bg-primary shadow-[0_0_10px_oklch(0.88_0.26_130/50%)]'
                    : 'bg-white/8'
                }`} />
                <span className={`text-[10px] font-medium ${active ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {dayLabels[i]}
                </span>
              </m.div>
            ))}
          </div>
        </m.div>

        {/* ── Monthly Calendars (horizontal scroll) ───────────── */}
        <m.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.35 }}
          className="mt-8 w-full"
        >
          <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground text-center mb-3">Activity</p>
          <div
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {months.map((month, i) => (
              <div key={month.label} className="snap-start">
                <MonthCalendar month={month} index={i} />
              </div>
            ))}
          </div>
        </m.div>

        {/* ── Stats Row ────────────────────────────────────────── */}
        <m.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75, duration: 0.35 }}
          className="mt-7 w-full grid grid-cols-3 gap-3"
        >
          {[
            { icon: Dumbbell, value: totalWorkouts, label: 'Total' },
            { icon: Trophy, value: bestStreak, label: 'Best Streak' },
            { icon: Calendar, value: thisMonthCount, label: 'This Month' },
          ].map(({ icon: Icon, value, label }, i) => (
            <m.div
              key={label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + i * 0.07, duration: 0.3 }}
              className="rounded-2xl border border-white/8 card-luxury p-3.5 flex flex-col items-center gap-1.5"
            >
              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xl font-bold font-display text-gold">{value}</span>
              <span className="text-[9px] tracking-wider uppercase text-muted-foreground">{label}</span>
            </m.div>
          ))}
        </m.div>

        {/* ── View History Button ──────────────────────────────── */}
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0, duration: 0.35 }}
          className="mt-7 w-full"
        >
          <Link href="/history">
            <div className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] py-3.5 hover:bg-white/[0.06] transition-colors cursor-pointer">
              <span className="text-sm font-medium text-muted-foreground">View Full History</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </Link>
        </m.div>

      </div>
    </div>
  )
}
