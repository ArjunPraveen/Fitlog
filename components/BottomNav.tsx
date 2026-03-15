'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { m } from 'framer-motion'
import { Home, Dumbbell, BarChart2, User } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/workout/new?mode=scratch', icon: Dumbbell, label: 'Workout' },
  { href: '/progress', icon: BarChart2, label: 'Progress' },
  { href: '/settings', icon: User, label: 'Profile' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-[env(safe-area-inset-bottom)]">
      <div className="mx-4 mb-4 flex items-center gap-1 rounded-2xl border border-white/10 bg-[#111111ee] px-2 py-2 shadow-2xl backdrop-blur-xl">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const baseHref = href.split('?')[0]
          const isActive =
            baseHref === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(baseHref)

          return (
            <Link
              key={href}
              href={href}
              className="relative flex flex-col items-center gap-0.5 rounded-xl px-5 py-2 transition-colors"
            >
              {isActive && (
                <m.div
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-xl bg-gold"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <m.div
                whileTap={{ scale: 0.85 }}
                className="relative z-10 flex flex-col items-center gap-0.5"
              >
                <Icon
                  className={`h-5 w-5 transition-colors ${
                    isActive ? 'text-[oklch(0.07_0_0)]' : 'text-muted-foreground'
                  }`}
                />
                <span
                  className={`text-[10px] font-medium transition-colors ${
                    isActive ? 'text-[oklch(0.07_0_0)]' : 'text-muted-foreground'
                  }`}
                >
                  {label}
                </span>
              </m.div>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
