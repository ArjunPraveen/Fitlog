'use client'

import { useEffect, useState } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { PageTransition } from '@/components/PageTransition'
import { CheckCircle, Users, Eye, Target, Calendar } from 'lucide-react'

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative h-7 w-12 rounded-full transition-colors duration-300 ${
        checked ? 'bg-gradient-to-r from-[oklch(0.88_0.14_82)] to-[oklch(0.78_0.13_72)]' : 'bg-white/10'
      }`}
    >
      <m.span
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-md ${checked ? 'left-6' : 'left-1'}`}
      />
    </button>
  )
}

function Section({ icon: Icon, title, desc, children }: {
  icon: React.ElementType; title: string; desc: string; children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-white/8 card-luxury p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15">
          <Icon className="h-4.5 w-4.5 text-primary" />
        </div>
        <div>
          <p className="font-semibold text-sm">{title}</p>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
      </div>
      {children}
    </div>
  )
}

export default function SettingsPage() {
  const [workoutsPublic, setWorkoutsPublic] = useState(false)
  const [profileSearchable, setProfileSearchable] = useState(true)
  const [fitnessGoal, setFitnessGoal] = useState('hypertrophy')
  const [daysPerWeek, setDaysPerWeek] = useState(3)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: privacy } = await supabase.from('privacy_settings').select('workouts_public, profile_searchable').eq('user_id', user.id).maybeSingle()
      const { data: prefs } = await supabase.from('user_preferences').select('fitness_goal, days_per_week').eq('user_id', user.id).maybeSingle()
      if (privacy) { setWorkoutsPublic(privacy.workouts_public); setProfileSearchable(privacy.profile_searchable) }
      if (prefs) { setFitnessGoal(prefs.fitness_goal); setDaysPerWeek(prefs.days_per_week) }
    }
    load()
  }, [])

  async function handleSave() {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }
    await Promise.all([
      supabase.from('privacy_settings').upsert({ user_id: user.id, workouts_public: workoutsPublic, profile_searchable: profileSearchable }, { onConflict: 'user_id' }),
      supabase.from('user_preferences').upsert({ user_id: user.id, fitness_goal: fitnessGoal, days_per_week: daysPerWeek }, { onConflict: 'user_id' }),
    ])
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <p className="text-xs tracking-widest uppercase text-muted-foreground mb-1">Account</p>
          <h1 className="text-3xl font-bold text-gold">Profile</h1>
        </div>

        <Section icon={Eye} title="Privacy" desc="Control who sees your activity">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm">Public workouts</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Followers can see your history</p>
              </div>
              <Toggle checked={workoutsPublic} onChange={() => setWorkoutsPublic(v => !v)} />
            </div>
            <div className="h-px bg-white/6" />
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm">Discoverable</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Show up in search</p>
              </div>
              <Toggle checked={profileSearchable} onChange={() => setProfileSearchable(v => !v)} />
            </div>
          </div>
        </Section>

        <Section icon={Target} title="Fitness Goal" desc="What are you training for?">
          <div className="grid grid-cols-3 gap-2">
            {(['strength', 'hypertrophy', 'endurance'] as const).map(goal => (
              <button
                key={goal}
                onClick={() => setFitnessGoal(goal)}
                className={`rounded-xl border py-3 text-xs font-medium capitalize transition-all ${
                  fitnessGoal === goal
                    ? 'bg-gold border-transparent text-[oklch(0.11_0.008_285)]'
                    : 'border-white/10 text-muted-foreground hover:border-white/20'
                }`}
              >
                {goal}
              </button>
            ))}
          </div>
        </Section>

        <Section icon={Calendar} title="Schedule" desc="How often do you train?">
          <div className="flex gap-2">
            {[2, 3, 4, 5, 6].map(n => (
              <button
                key={n}
                onClick={() => setDaysPerWeek(n)}
                className={`flex-1 rounded-xl border py-3 text-sm font-semibold transition-all ${
                  daysPerWeek === n
                    ? 'bg-gold border-transparent text-[oklch(0.11_0.008_285)]'
                    : 'border-white/10 text-muted-foreground hover:border-white/20'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center">{daysPerWeek} days per week</p>
        </Section>

        <m.div whileTap={{ scale: 0.98 }}>
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-2xl bg-gold py-4 text-sm font-semibold text-[oklch(0.11_0.008_285)] shadow-lg glow-gold transition-opacity disabled:opacity-60"
          >
            <AnimatePresence mode="wait" initial={false}>
              {saved ? (
                <m.span
                  key="saved"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="flex items-center justify-center gap-2"
                >
                  <CheckCircle className="h-4 w-4" /> Saved!
                </m.span>
              ) : (
                <m.span
                  key="save"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </m.span>
              )}
            </AnimatePresence>
          </button>
        </m.div>
      </div>
    </PageTransition>
  )
}
