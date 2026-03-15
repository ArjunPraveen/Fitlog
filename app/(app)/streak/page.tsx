export const revalidate = 60

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { StreakPageClient } from '@/components/StreakPage'

interface MonthData {
  label: string
  grid: { day: number; worked: boolean; future: boolean }[]
}

function buildMonthGrid(year: number, month: number, workoutDates: Set<string>, today: Date): MonthData {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const todayDate = today.getDate()
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth()
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7 // Mon=0

  const grid: { day: number; worked: boolean; future: boolean }[] = []
  for (let i = 0; i < firstDow; i++) {
    grid.push({ day: 0, worked: false, future: false })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    grid.push({
      day: d,
      worked: workoutDates.has(dateStr),
      future: isCurrentMonth ? d > todayDate : false,
    })
  }

  const label = new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  return { label, grid }
}

export default async function StreakPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: streakWorkouts }, { count: totalWorkouts }] = await Promise.all([
    supabase
      .from('workouts')
      .select('finished_at')
      .eq('user_id', user!.id)
      .not('finished_at', 'is', null)
      .gte('finished_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())
      .order('finished_at', { ascending: false }),
    supabase
      .from('workouts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user!.id)
      .not('finished_at', 'is', null),
  ])

  const workoutDates = new Set(
    (streakWorkouts ?? []).map((w: any) =>
      new Date(w.finished_at).toLocaleDateString('en-CA')
    )
  )

  // Current streak
  let currentStreak = 0
  const checkDate = new Date()
  if (!workoutDates.has(checkDate.toLocaleDateString('en-CA'))) {
    checkDate.setDate(checkDate.getDate() - 1)
  }
  while (workoutDates.has(checkDate.toLocaleDateString('en-CA'))) {
    currentStreak++
    checkDate.setDate(checkDate.getDate() - 1)
  }

  // Best streak
  let bestStreak = 0
  let tempStreak = 0
  const sortedDates = [...workoutDates].sort().reverse()
  for (let i = 0; i < sortedDates.length; i++) {
    if (i === 0) { tempStreak = 1; continue }
    const prev = new Date(sortedDates[i - 1])
    const curr = new Date(sortedDates[i])
    const diffDays = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24)
    if (Math.round(diffDays) === 1) {
      tempStreak++
    } else {
      bestStreak = Math.max(bestStreak, tempStreak)
      tempStreak = 1
    }
  }
  bestStreak = Math.max(bestStreak, tempStreak, currentStreak)

  // Week dots (most recent first)
  const weekDots: boolean[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    weekDots.push(workoutDates.has(d.toLocaleDateString('en-CA')))
  }

  // Build 12 months of calendar grids (current month + 11 previous)
  const now = new Date()
  const months: MonthData[] = []
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(buildMonthGrid(d.getFullYear(), d.getMonth(), workoutDates, now))
  }

  // This month workout count
  const thisMonthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  let thisMonthCount = 0
  for (const dateStr of workoutDates) {
    if (dateStr >= thisMonthStart) thisMonthCount++
  }

  return (
    <StreakPageClient
      currentStreak={currentStreak}
      bestStreak={bestStreak}
      weekDots={weekDots}
      months={months}
      totalWorkouts={totalWorkouts ?? 0}
      thisMonthCount={thisMonthCount}
    />
  )
}
