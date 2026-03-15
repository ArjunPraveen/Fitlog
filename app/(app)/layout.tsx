import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { BottomNav } from '@/components/BottomNav'
import { MotionProvider } from '@/components/MotionProvider'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) redirect('/login')

  return (
    <MotionProvider>
      <div className="min-h-screen bg-background">
        <main className="mx-auto max-w-2xl px-4 pt-6 pb-nav">
          {children}
        </main>
        <BottomNav />
      </div>
    </MotionProvider>
  )
}
