import { createServerSupabaseClient } from '@/lib/supabase-server'
import { PageTransition } from '@/components/PageTransition'
import { SaveTemplateButton } from '@/components/SaveTemplateButton'
import Link from 'next/link'
import { ChevronRight, Dumbbell } from 'lucide-react'

function dayLabel(dateStr: string) {
  const date = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  if (date.toDateString() === today.toDateString()) return 'Today'
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
}

function timeLabel(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export default async function HistoryPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: allWorkouts } = await supabase
    .from('workouts')
    .select('id, name, finished_at, started_at')
    .eq('user_id', user!.id)
    .order('started_at', { ascending: false })
    .limit(60)

  const inProgress = (allWorkouts ?? []).filter(w => !w.finished_at)
  const finished = (allWorkouts ?? []).filter(w => w.finished_at)

  // Group finished workouts by day
  const byDay = new Map<string, typeof finished>()
  for (const w of finished) {
    const key = new Date(w.finished_at!).toDateString()
    if (!byDay.has(key)) byDay.set(key, [])
    byDay.get(key)!.push(w)
  }

  return (
    <PageTransition>
      <div className="space-y-5">
        <div>
          <p className="text-xs tracking-widest uppercase text-muted-foreground mb-1">Your Journey</p>
          <h1 className="text-3xl font-bold text-gold">History</h1>
        </div>

        {/* In-progress workouts */}
        {inProgress.map(w => (
          <Link key={w.id} href={`/workout/${w.id}`}>
            <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/8 px-4 py-4 cursor-pointer hover:border-emerald-500/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15">
                  <Dumbbell className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-emerald-300">{w.name ?? 'Workout'}</p>
                  <p className="text-xs text-emerald-400/60 mt-0.5">In progress — tap to resume</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-emerald-400/60" />
            </div>
          </Link>
        ))}

        {/* Finished workouts grouped by day */}
        {byDay.size === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <Dumbbell className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-muted-foreground text-sm">No completed workouts yet.<br />Start your first one!</p>
          </div>
        ) : (
          Array.from(byDay.entries()).map(([dayKey, workouts]) => (
            <div key={dayKey} className="space-y-2">
              <p className="text-xs tracking-widest uppercase text-muted-foreground px-1">
                {dayLabel(workouts[0].finished_at!)}
              </p>
              {workouts.map(w => (
                <div key={w.id} className="rounded-xl border border-white/8 card-luxury px-4 py-4">
                  <Link href={`/workout/${w.id}`} className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15">
                        <Dumbbell className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{w.name ?? 'Workout'}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {timeLabel(w.finished_at!)}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                  <SaveTemplateButton workoutId={w.id} defaultName={w.name ?? 'My Workout'} />
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </PageTransition>
  )
}
