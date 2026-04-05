'use client'

import { useEffect, useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase'
import { EXERCISES } from '@/lib/exercises'
import { PageTransition } from '@/components/PageTransition'
import { ExercisePicker } from '@/components/ExercisePicker'
import {
  computeVolumeStats, detectPRs, aggregateSessions,
  analyzeProgress, getOverloadSuggestion,
  type VolumeStats, type ExercisePRs, type SessionAggregate,
  type WorkoutAnalysis, type OverloadSuggestion,
} from '@/lib/progress-stats'
import {
  Trophy, TrendingUp, TrendingDown, Minus, Dumbbell, Flame,
  Weight, BarChart3, Zap, Users,
} from 'lucide-react'

const WeightChart = dynamic(
  () => import('@/components/ProgressChart').then(m => ({ default: m.WeightChart })),
  { ssr: false, loading: () => <ChartSkeleton /> }
)
const VolumeChart = dynamic(
  () => import('@/components/ProgressChart').then(m => ({ default: m.VolumeChart })),
  { ssr: false, loading: () => <ChartSkeleton /> }
)
const SetsRepsChart = dynamic(
  () => import('@/components/ProgressChart').then(m => ({ default: m.SetsRepsChart })),
  { ssr: false, loading: () => <ChartSkeleton /> }
)

function ChartSkeleton() {
  return <div className="h-[200px] rounded-xl bg-white/5 animate-pulse" />
}

type ChartTab = 'weight' | 'volume' | 'sets'

interface FriendWorkout {
  id: string
  name: string | null
  finished_at: string
  userName: string
  setCount: number
}

export default function ProgressPage() {
  const [selectedExercise, setSelectedExercise] = useState(EXERCISES[0].id)
  const [allSets, setAllSets] = useState<any[]>([])
  const [exerciseSets, setExerciseSets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [exerciseLoading, setExerciseLoading] = useState(false)
  const [chartTab, setChartTab] = useState<ChartTab>('weight')
  const [friendWorkouts, setFriendWorkouts] = useState<FriendWorkout[]>([])
  const [friendsLoading, setFriendsLoading] = useState(true)
  const [exerciseIdsWithData, setExerciseIdsWithData] = useState<string[]>([])

  // Fetch all user sets (for global volume stats) + friends' workouts on mount
  useEffect(() => {
    async function fetchGlobal() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // All user's sets from completed workouts
      const { data: sets } = await supabase
        .from('workout_sets')
        .select('weight_kg, reps, exercise_id, workout_id, logged_at, workouts!inner(user_id, finished_at)')
        .eq('workouts.user_id', user.id)
        .not('workouts.finished_at', 'is', null)
        .order('logged_at', { ascending: true })
        .limit(2000)

      const allData = sets ?? []
      setAllSets(allData)
      setExerciseIdsWithData([...new Set(allData.map((s: any) => s.exercise_id))])
      setLoading(false)

      // Friends' recent workouts
      const { data: following } = await supabase
        .from('follow_requests')
        .select('to_user')
        .eq('from_user', user.id)
        .eq('status', 'accepted')

      if (following && following.length > 0) {
        const friendIds = following.map((f: any) => f.to_user)

        // Check which friends have public workouts
        const { data: privacyData } = await supabase
          .from('privacy_settings')
          .select('user_id, workouts_public')
          .in('user_id', friendIds)

        const publicFriendIds = (privacyData ?? [])
          .filter((p: any) => p.workouts_public)
          .map((p: any) => p.user_id)

        if (publicFriendIds.length > 0) {
          const { data: fWorkouts } = await supabase
            .from('workouts')
            .select('id, name, finished_at, user_id, workout_sets(count)')
            .in('user_id', publicFriendIds)
            .not('finished_at', 'is', null)
            .order('finished_at', { ascending: false })
            .limit(10)

          if (fWorkouts && fWorkouts.length > 0) {
            // Get friend names
            const { data: friendProfiles } = await supabase
              .from('users')
              .select('id, name')
              .in('id', publicFriendIds)

            const nameMap = new Map((friendProfiles ?? []).map((p: any) => [p.id, p.name]))

            setFriendWorkouts(
              fWorkouts.map((w: any) => ({
                id: w.id,
                name: w.name,
                finished_at: w.finished_at,
                userName: nameMap.get(w.user_id) ?? 'Friend',
                setCount: w.workout_sets?.[0]?.count ?? 0,
              }))
            )
          }
        }
      }
      setFriendsLoading(false)
    }
    fetchGlobal()
  }, [])

  // Fetch exercise-specific sets when selection changes
  useEffect(() => {
    async function fetchExercise() {
      setExerciseLoading(true)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: sets } = await supabase
        .from('workout_sets')
        .select('weight_kg, reps, logged_at, workout_id, workouts!inner(user_id, finished_at)')
        .eq('workouts.user_id', user.id)
        .not('workouts.finished_at', 'is', null)
        .eq('exercise_id', selectedExercise)
        .order('logged_at', { ascending: true })
        .limit(500)

      setExerciseSets(sets ?? [])
      setExerciseLoading(false)
    }
    fetchExercise()
  }, [selectedExercise])

  // Computed stats
  const volumeStats = useMemo(() => computeVolumeStats(allSets), [allSets])
  const prs = useMemo(() => detectPRs(exerciseSets), [exerciseSets])
  const sessions = useMemo(() => aggregateSessions(exerciseSets), [exerciseSets])
  const selectedEx = EXERCISES.find(e => e.id === selectedExercise)
  const analysis = useMemo(
    () => analyzeProgress(sessions, selectedEx?.name ?? ''),
    [sessions, selectedEx]
  )
  const overload = useMemo(() => getOverloadSuggestion(sessions), [sessions])

  const chartTabs: { key: ChartTab; label: string }[] = [
    { key: 'weight', label: 'Weight' },
    { key: 'volume', label: 'Volume' },
    { key: 'sets', label: 'Sets & Reps' },
  ]

  return (
    <PageTransition>
      <div className="space-y-6 pb-nav">
        {/* Header */}
        <div>
          <p className="text-xs tracking-widest uppercase text-muted-foreground mb-1">Tracking</p>
          <h1 className="text-3xl font-bold text-gold">Progress</h1>
        </div>

        {/* ── Volume Stats Cards ─────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 rounded-2xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={<Dumbbell className="h-4 w-4" />} label="Workouts" value={volumeStats.totalWorkouts} />
            <StatCard icon={<BarChart3 className="h-4 w-4" />} label="Total Sets" value={volumeStats.totalSets.toLocaleString()} />
            <StatCard icon={<Weight className="h-4 w-4" />} label="Tonnage" value={formatTonnage(volumeStats.totalTonnage)} />
            <StatCard icon={<Flame className="h-4 w-4" />} label="Exercises" value={volumeStats.totalExercises} />
          </div>
        )}

        {/* ── Exercise Picker ────────────────────────────────────────── */}
        <ExercisePicker
          value={selectedExercise}
          onChange={setSelectedExercise}
          exerciseIdsWithData={exerciseIdsWithData}
        />

        {exerciseLoading ? (
          <div className="space-y-4">
            <div className="h-24 rounded-2xl bg-white/5 animate-pulse" />
            <div className="h-[280px] rounded-2xl bg-white/5 animate-pulse" />
          </div>
        ) : exerciseSets.length === 0 ? (
          <div className="rounded-2xl border border-white/8 card-luxury p-8 text-center">
            <Dumbbell className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              No data yet for {selectedEx?.name}. Log this exercise to see progress.
            </p>
          </div>
        ) : (
          <>
            {/* ── PR Celebration ───────────────────────────────────── */}
            {prs.bestWeight && (
              <div className="relative overflow-hidden rounded-2xl border border-white/8 card-luxury p-5">
                {(prs.isNewWeightPR || prs.isNewVolumePR) && (
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-primary/60 to-transparent" />
                )}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center justify-center h-8 w-8 rounded-xl bg-primary/15">
                    <Trophy className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-xs tracking-widest uppercase text-muted-foreground">Personal Records</p>
                  {(prs.isNewWeightPR || prs.isNewVolumePR) && (
                    <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      New PR!
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {prs.bestWeight && (
                    <div>
                      <p className="text-2xl font-bold font-display text-foreground">
                        {prs.bestWeight.weight_kg}<span className="text-sm text-muted-foreground ml-1">kg</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Best weight · {prs.bestWeight.reps} reps
                      </p>
                      <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                        {new Date(prs.bestWeight.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  )}
                  {prs.bestVolume && (
                    <div>
                      <p className="text-2xl font-bold font-display text-foreground">
                        {prs.bestVolume.value.toLocaleString()}<span className="text-sm text-muted-foreground ml-1">kg</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Best volume · {prs.bestVolume.weight_kg}kg × {prs.bestVolume.reps}
                      </p>
                      <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                        {new Date(prs.bestVolume.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Workout Analysis ─────────────────────────────────── */}
            <div className="rounded-2xl border border-white/8 card-luxury p-5">
              <div className="flex items-start gap-3">
                <div className={`flex items-center justify-center h-8 w-8 rounded-xl shrink-0 ${
                  analysis.trend === 'up' ? 'bg-primary/15' :
                  analysis.trend === 'down' ? 'bg-destructive/15' :
                  'bg-white/10'
                }`}>
                  {analysis.trend === 'up' ? <TrendingUp className="h-4 w-4 text-primary" /> :
                   analysis.trend === 'down' ? <TrendingDown className="h-4 w-4 text-destructive" /> :
                   <Minus className="h-4 w-4 text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{analysis.message}</p>
                  {analysis.details.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {analysis.details.map((d, i) => (
                        <p key={i} className="text-xs text-muted-foreground">• {d}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Progressive Overload Suggestion ──────────────────── */}
            {overload && (
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <Zap className="h-4 w-4 text-primary" />
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary">Next Session</p>
                </div>
                <p className="text-sm text-foreground">{overload.reason}</p>
              </div>
            )}

            {/* ── Charts ───────────────────────────────────────────── */}
            <div className="rounded-2xl border border-white/8 card-luxury overflow-hidden">
              {/* Chart tabs */}
              <div className="flex border-b border-white/8">
                {chartTabs.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setChartTab(tab.key)}
                    className={`flex-1 py-3 text-xs font-medium tracking-wide text-center transition-colors ${
                      chartTab === tab.key
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-5">
                <p className="text-xs text-muted-foreground mb-4">
                  {selectedEx?.name} · {sessions.length} session{sessions.length !== 1 ? 's' : ''}
                </p>

                {chartTab === 'weight' && (
                  <WeightChart data={sessions.map(s => ({ date: s.date, weight_kg: s.maxWeight }))} />
                )}
                {chartTab === 'volume' && (
                  <VolumeChart data={sessions.map(s => ({ date: s.date, totalVolume: s.totalVolume }))} />
                )}
                {chartTab === 'sets' && (
                  <SetsRepsChart data={sessions.map(s => ({ date: s.date, sets: s.sets, avgReps: s.avgReps }))} />
                )}
              </div>
            </div>
          </>
        )}

        {/* ── Friends' Recent Activity ──────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs tracking-widest uppercase text-muted-foreground">Friends' Activity</p>
          </div>

          {friendsLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 rounded-2xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : friendWorkouts.length === 0 ? (
            <div className="rounded-2xl border border-white/8 card-luxury p-6 text-center">
              <Users className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                No friend activity yet. Follow friends in the Social tab to see their workouts here.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {friendWorkouts.map(fw => (
                <div key={fw.id} className="rounded-2xl border border-white/8 card-luxury px-4 py-3 flex items-center gap-3">
                  <div className="flex items-center justify-center h-9 w-9 rounded-full bg-white/10 text-xs font-bold uppercase text-foreground shrink-0">
                    {fw.userName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{fw.userName}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {fw.name ?? 'Workout'} · {fw.setCount} sets
                    </p>
                  </div>
                  <p className="text-[10px] text-muted-foreground/60 shrink-0">
                    {new Date(fw.finished_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  )
}

// ── Helper Components ─────────────────────────────────────────────────────

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-white/8 card-luxury p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="text-muted-foreground">{icon}</div>
        <p className="text-[10px] tracking-widest uppercase text-muted-foreground">{label}</p>
      </div>
      <p className="text-2xl font-bold font-display text-foreground">{value}</p>
    </div>
  )
}

function formatTonnage(kg: number): string {
  if (kg >= 1_000_000) return `${(kg / 1_000_000).toFixed(1)}M kg`
  if (kg >= 1_000) return `${(kg / 1_000).toFixed(1)}k kg`
  return `${kg} kg`
}
