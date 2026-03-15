'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { m } from 'framer-motion'
import { MotionProvider } from '@/components/MotionProvider'
import { createClient } from '@/lib/supabase'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false) }
    else { router.push('/dashboard'); router.refresh() }
  }

  return (
    <MotionProvider>
    <div className="flex min-h-screen flex-col items-center justify-center px-6 bg-background">
      {/* Background lime glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-60 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/6 blur-[140px]" />
      </div>

      <m.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative w-full max-w-sm"
      >
        {/* Logo */}
        <div className="mb-12 flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gold glow-gold">
            <span className="font-display text-2xl font-black text-[oklch(0.07_0_0)]">FL</span>
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-black text-gold">FitLog</h1>
            <p className="text-sm text-muted-foreground mt-1">Track your journey</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <m.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="rounded-xl bg-destructive/15 px-4 py-3 text-sm text-destructive"
            >
              {error}
            </m.p>
          )}

          <div className="space-y-1.5">
            <Label className="text-[11px] tracking-widest text-muted-foreground uppercase">Email</Label>
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="h-12 rounded-xl border-white/10 bg-white/5 px-4 focus:border-primary/60"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] tracking-widest text-muted-foreground uppercase">Password</Label>
            <Input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="h-12 rounded-xl border-white/10 bg-white/5 px-4 focus:border-primary/60"
            />
          </div>

          <m.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-xl bg-gold py-4 font-display text-base font-bold tracking-wide text-[oklch(0.07_0_0)] glow-gold transition-opacity disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'SIGN IN'}
          </m.button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          No account?{' '}
          <Link href="/signup" className="text-primary font-medium hover:text-primary/80">
            Sign up
          </Link>
        </p>
      </m.div>
    </div>
    </MotionProvider>
  )
}
