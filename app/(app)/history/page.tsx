'use client'

// PREVIEW MODE: stub data
import { motion } from 'framer-motion'
import Link from 'next/link'
import { PageTransition } from '@/components/PageTransition'
import { ChevronRight, Dumbbell } from 'lucide-react'

const STUB_WORKOUTS = [
  { id: 'w1', name: 'Push Day', finished_at: new Date(Date.now() - 2 * 86400000).toISOString(), sets: 12 },
  { id: 'w2', name: 'Leg Day', finished_at: new Date(Date.now() - 4 * 86400000).toISOString(), sets: 10 },
  { id: 'w3', name: 'Pull Day', finished_at: new Date(Date.now() - 6 * 86400000).toISOString(), sets: 14 },
  { id: 'w4', name: 'Upper Body', finished_at: new Date(Date.now() - 9 * 86400000).toISOString(), sets: 16 },
]

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
}
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
}

export default function HistoryPage() {
  return (
    <PageTransition>
      <div className="space-y-5">
        <div>
          <p className="text-xs tracking-widest uppercase text-muted-foreground mb-1">Your Journey</p>
          <h1 className="text-3xl font-bold text-gold">History</h1>
        </div>

        <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
          {STUB_WORKOUTS.map(w => {
            const date = new Date(w.finished_at)
            const dayLabel = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
            return (
              <motion.div key={w.id} variants={item}>
                <Link href={`/workout/${w.id}`}>
                  <motion.div
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    className="flex items-center justify-between rounded-xl border border-white/8 card-luxury px-4 py-4 cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15">
                        <Dumbbell className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{w.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {dayLabel} · {w.sets} sets
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </motion.div>
                </Link>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </PageTransition>
  )
}
