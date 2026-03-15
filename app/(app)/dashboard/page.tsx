export const revalidate = 60

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getExerciseById } from '@/lib/exercises'
import { computeMuscleRecovery, buildSuggestion } from '@/lib/suggestions'
import { MuscleRecoveryBar } from '@/components/MuscleRecoveryBar'
import { DashboardCards } from '@/components/DashboardCards'
import { StreakTracker } from '@/components/StreakTracker'
import { PageTransition } from '@/components/PageTransition'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Dumbbell, ChevronRight } from 'lucide-react'
import type { MuscleGroup } from '@/types'

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()

  const [{ data: recentSets }, { data: activeWorkout }, { data: recentWorkouts }, { data: streakWorkouts }] = await Promise.all([
    supabase
      .from('workout_sets')
      .select('logged_at, exercise_id, workouts!inner(user_id)')
      .eq('workouts.user_id', user!.id)
      .gte('logged_at', since)
      .order('logged_at', { ascending: false })
      .limit(150),
    supabase
      .from('workouts')
      .select('id, name, started_at')
      .eq('user_id', user!.id)
      .is('finished_at', null)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('workouts')
      .select('id, name, finished_at')
      .eq('user_id', user!.id)
      .not('finished_at', 'is', null)
      .order('finished_at', { ascending: false })
      .limit(1),
    // Fetch finished workouts for streak calculation (last 90 days)
    supabase
      .from('workouts')
      .select('finished_at')
      .eq('user_id', user!.id)
      .not('finished_at', 'is', null)
      .gte('finished_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
      .order('finished_at', { ascending: false }),
  ])

  const setsForRecovery = (recentSets ?? []).map((s: any) => ({
    exercise_primary_muscle: (getExerciseById(s.exercise_id)?.primary_muscle ?? 'core') as MuscleGroup,
    logged_at: s.logged_at,
  }))

  const recovery = computeMuscleRecovery(setsForRecovery)
  const { readyMuscles } = buildSuggestion(recovery)
  const userName = user?.user_metadata?.name ?? 'there'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  // Compute streak from finished workout dates
  const workoutDates = new Set(
    (streakWorkouts ?? []).map((w: any) =>
      new Date(w.finished_at).toLocaleDateString('en-CA') // YYYY-MM-DD
    )
  )

  // Current streak: count consecutive days backward from today
  let currentStreak = 0
  const checkDate = new Date()
  // If user hasn't worked out today, start checking from yesterday
  if (!workoutDates.has(checkDate.toLocaleDateString('en-CA'))) {
    checkDate.setDate(checkDate.getDate() - 1)
  }
  while (workoutDates.has(checkDate.toLocaleDateString('en-CA'))) {
    currentStreak++
    checkDate.setDate(checkDate.getDate() - 1)
  }

  // Best streak within fetched data
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

  // Week dots: last 7 days, most recent first
  const weekDots: boolean[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    weekDots.push(workoutDates.has(d.toLocaleDateString('en-CA')))
  }

  return (
    <PageTransition>
      <div className="space-y-8">
        <div className="pt-2">
          <p className="text-sm text-muted-foreground mb-1 tracking-widest uppercase">{greeting}</p>
          <h1 className="text-4xl font-bold text-gold leading-tight">{userName}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {readyMuscles.length > 0
              ? `${readyMuscles.slice(0, 2).map(m => m.charAt(0).toUpperCase() + m.slice(1)).join(' & ')} are ready to train.`
              : 'Still recovering — rest well today.'}
          </p>
        </div>

        <StreakTracker currentStreak={currentStreak} bestStreak={bestStreak} weekDots={weekDots} />

        {activeWorkout && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm text-emerald-300">Workout in progress</p>
              <p className="text-xs text-emerald-400/70 mt-0.5">{activeWorkout.name ?? 'Untitled workout'}</p>
            </div>
            <Button size="sm" nativeButton={false} render={<Link href={`/workout/${activeWorkout.id}`} />}>
              Resume
            </Button>
          </div>
        )}

        <DashboardCards />

        {/* Recent workouts */}
        {recentWorkouts && recentWorkouts.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs tracking-widest uppercase text-muted-foreground">Recent Workouts</h2>
              <Link href="/history" className="text-xs text-primary hover:text-primary/80 transition-colors">
                See all
              </Link>
            </div>
            <div className="space-y-2">
              {recentWorkouts.map((w: any) => (
                <Link key={w.id} href={`/workout/${w.id}`}>
                  <div className="flex items-center justify-between rounded-xl border border-white/8 card-luxury px-4 py-3 cursor-pointer hover:border-white/15 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/6">
                        <Dumbbell className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{w.name ?? 'Workout'}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {new Date(w.finished_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 className="text-xs tracking-widest uppercase text-muted-foreground mb-4">Muscle Recovery</h2>
          <div className="rounded-2xl border border-white/8 card-luxury p-5">
            <MuscleRecoveryBar recovery={recovery} />
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
