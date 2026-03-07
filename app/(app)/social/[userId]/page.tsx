import { createServerSupabaseClient } from '@/lib/supabase-server'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ChevronRight, Lock } from 'lucide-react'

export default async function UserActivityPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Check follow relationship
  const { data: followRow } = await supabase
    .from('follow_requests')
    .select('status')
    .eq('from_user', user.id)
    .eq('to_user', userId)
    .maybeSingle()

  const isFollowing = followRow?.status === 'accepted'

  // Get target user profile
  const { data: profile } = await supabase
    .from('users')
    .select('name, privacy_settings(workouts_public)')
    .eq('id', userId)
    .single()

  if (!profile) notFound()

  const workoutsPublic = (profile as any).privacy_settings?.workouts_public ?? false

  if (!isFollowing || !workoutsPublic) {
    return (
      <div className="space-y-4">
        <Link href="/social">
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        </Link>
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Lock className="h-10 w-10 text-muted-foreground" />
          <p className="font-medium">{(profile as any).name}'s workouts are private</p>
          <p className="text-sm text-muted-foreground">
            {!isFollowing ? 'You need to follow this user first.' : 'This user hasn\'t made their workouts public.'}
          </p>
        </div>
      </div>
    )
  }

  // Fetch their completed workouts
  const { data: workouts } = await supabase
    .from('workouts')
    .select('id, name, finished_at, workout_sets(count)')
    .eq('user_id', userId)
    .not('finished_at', 'is', null)
    .order('finished_at', { ascending: false })
    .limit(20)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/social">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">{(profile as any).name}'s Workouts</h1>
      </div>

      {(!workouts || workouts.length === 0) ? (
        <p className="text-sm text-muted-foreground">No workouts yet.</p>
      ) : (
        <div className="space-y-2">
          {workouts.map((w: any) => {
            const date = new Date(w.finished_at)
            const setCount = w.workout_sets?.[0]?.count ?? 0
            return (
              <Card key={w.id}>
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <p className="font-medium text-sm">{w.name ?? 'Workout'}</p>
                    <p className="text-xs text-muted-foreground">
                      {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      {' · '}{setCount} sets
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
