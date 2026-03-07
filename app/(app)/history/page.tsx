import { createServerSupabaseClient } from '@/lib/supabase-server'
import { PageTransition } from '@/components/PageTransition'
import Link from 'next/link'
import { ChevronRight, Dumbbell } from 'lucide-react'

export default async function HistoryPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: workouts } = await supabase
    .from('workouts')
    .select('id, name, finished_at, workout_sets(count)')
    .eq('user_id', user!.id)
    .not('finished_at', 'is', null)
    .order('finished_at', { ascending: false })
    .limit(30)

  return (
    <PageTransition>
      <div className="space-y-5">
        <div>
          <p className="text-xs tracking-widest uppercase text-muted-foreground mb-1">Your Journey</p>
          <h1 className="text-3xl font-bold text-gold">History</h1>
        </div>

        {(!workouts || workouts.length === 0) ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <Dumbbell className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-muted-foreground text-sm">No completed workouts yet.<br />Start your first one!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {workouts.map((w: any) => {
              const date = new Date(w.finished_at)
              const setCount = w.workout_sets?.[0]?.count ?? 0
              return (
                <Link key={w.id} href={`/workout/${w.id}`}>
                  <div className="flex items-center justify-between rounded-xl border border-white/8 card-luxury px-4 py-4 cursor-pointer hover:border-white/15 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15">
                        <Dumbbell className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{w.name ?? 'Workout'}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          {' · '}{setCount} sets
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </PageTransition>
  )
}
