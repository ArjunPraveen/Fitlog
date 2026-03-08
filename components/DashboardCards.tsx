'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Dumbbell, LayoutTemplate, Shuffle } from 'lucide-react'

const CARDS = [
  {
    href: '/workout/new?mode=suggested',
    icon: Shuffle,
    title: 'Suggested',
    desc: 'Based on recovery',
    accent: true,
  },
  {
    href: '/workout/new?mode=template',
    icon: LayoutTemplate,
    title: 'Template',
    desc: 'Saved routines',
    accent: false,
  },
  {
    href: '/workout/new?mode=scratch',
    icon: Dumbbell,
    title: 'From Scratch',
    desc: 'Build your own',
    accent: false,
  },
]

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}

const card = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
}

export function DashboardCards() {
  return (
    <div>
      <h2 className="text-xs tracking-widest uppercase text-muted-foreground mb-4">Start a Workout</h2>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-3 gap-3 items-stretch"
      >
        {CARDS.map(({ href, icon: Icon, title, desc, accent }) => (
          <motion.div key={href} variants={card} className="h-full">
            <Link href={href} className="block h-full">
              <motion.div
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className={`relative flex h-full flex-col gap-3 rounded-2xl border p-4 cursor-pointer overflow-hidden
                  ${accent
                    ? 'bg-gold border-transparent glow-gold'
                    : 'card-luxury border-white/8 hover:border-white/20'
                  }`}
              >
                {accent && (
                  <div className="absolute inset-0 bg-gradient-to-br from-white/15 to-transparent pointer-events-none" />
                )}
                <Icon className={`h-5 w-5 relative z-10 ${accent ? 'text-[oklch(0.07_0_0)]' : 'text-primary'}`} />
                <div className="relative z-10">
                  <p className={`font-semibold text-sm leading-tight ${accent ? 'text-[oklch(0.07_0_0)]' : 'text-foreground'}`}>
                    {title}
                  </p>
                  <p className={`text-[11px] mt-0.5 leading-tight ${accent ? 'text-[oklch(0.07_0_0)]/70' : 'text-muted-foreground'}`}>
                    {desc}
                  </p>
                </div>
              </motion.div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
