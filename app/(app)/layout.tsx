// PREVIEW MODE: using stub user — restore auth after Supabase is configured
import { BottomNav } from '@/components/BottomNav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-2xl px-4 pt-6 pb-nav">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
