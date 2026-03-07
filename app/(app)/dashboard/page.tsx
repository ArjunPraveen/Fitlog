// PREVIEW MODE: stub data — restore Supabase queries after setup
import { computeMuscleRecovery, buildSuggestion } from '@/lib/suggestions'
import { MuscleRecoveryBar } from '@/components/MuscleRecoveryBar'
import { DashboardCards } from '@/components/DashboardCards'
import { PageTransition } from '@/components/PageTransition'
import type { MuscleGroup } from '@/types'

export default async function DashboardPage() {
  const now = new Date()
  const setsForRecovery = [
    { exercise_primary_muscle: 'chest' as MuscleGroup, logged_at: new Date(now.getTime() - 20 * 3600000).toISOString() },
    { exercise_primary_muscle: 'back' as MuscleGroup, logged_at: new Date(now.getTime() - 20 * 3600000).toISOString() },
    { exercise_primary_muscle: 'arms' as MuscleGroup, logged_at: new Date(now.getTime() - 25 * 3600000).toISOString() },
    { exercise_primary_muscle: 'legs' as MuscleGroup, logged_at: new Date(now.getTime() - 80 * 3600000).toISOString() },
  ]

  const recovery = computeMuscleRecovery(setsForRecovery)
  const { readyMuscles } = buildSuggestion(recovery)
  const userName = 'Alex'

  return (
    <PageTransition>
      <div className="space-y-7">
        {/* Hero greeting */}
        <div className="pt-2">
          <p className="text-sm text-muted-foreground mb-1 tracking-widest uppercase">Good morning</p>
          <h1 className="text-4xl font-bold text-gold leading-tight">{userName}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {readyMuscles.length > 0
              ? `${readyMuscles.slice(0, 2).map(m => m.charAt(0).toUpperCase() + m.slice(1)).join(' & ')} are ready to train.`
              : 'Still recovering — rest well today.'}
          </p>
        </div>

        {/* Workout start cards */}
        <DashboardCards />

        {/* Recovery section */}
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
