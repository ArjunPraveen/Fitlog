import { createServerSupabaseClient } from '@/lib/supabase-server'
import { computeMuscleRecovery, buildSuggestion } from '@/lib/suggestions'
import { MuscleRecoveryBar } from '@/components/MuscleRecoveryBar'
import { DashboardCards } from '@/components/DashboardCards'
import { PageTransition } from '@/components/PageTransition'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import type { MuscleGroup } from '@/types'

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()

  const [{ data: recentSets }, { data: activeWorkout }] = await Promise.all([
    supabase
      .from('workout_sets')
      .select('logged_at, exercise_id, workouts!inner(user_id)')
      .eq('workouts.user_id', user!.id)
      .gte('logged_at', since)
      .order('logged_at', { ascending: false }),
    supabase
      .from('workouts')
      .select('id, name, started_at')
      .eq('user_id', user!.id)
      .is('finished_at', null)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  // Map exercise_id to primary_muscle using hardcoded library
  const { getExerciseById } = await import('@/lib/exercises')
  const setsForRecovery = (recentSets ?? []).map((s: any) => ({
    exercise_primary_muscle: (getExerciseById(s.exercise_id)?.primary_muscle ?? 'core') as MuscleGroup,
    logged_at: s.logged_at,
  }))

  const recovery = computeMuscleRecovery(setsForRecovery)
  const { readyMuscles } = buildSuggestion(recovery)
  const userName = user?.user_metadata?.name ?? 'there'

  return (
    <PageTransition>
      <div className="space-y-7">
        <div className="pt-2">
          <p className="text-sm text-muted-foreground mb-1 tracking-widest uppercase">Good morning</p>
          <h1 className="text-4xl font-bold text-gold leading-tight">{userName}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {readyMuscles.length > 0
              ? `${readyMuscles.slice(0, 2).map(m => m.charAt(0).toUpperCase() + m.slice(1)).join(' & ')} are ready to train.`
              : 'Still recovering — rest well today.'}
          </p>
        </div>

        {activeWorkout && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm text-emerald-300">Workout in progress</p>
              <p className="text-xs text-emerald-400/70 mt-0.5">{activeWorkout.name ?? 'Untitled workout'}</p>
            </div>
            <Button size="sm" render={<Link href={`/workout/${activeWorkout.id}`} />}>
              Resume
            </Button>
          </div>
        )}

        <DashboardCards />

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
