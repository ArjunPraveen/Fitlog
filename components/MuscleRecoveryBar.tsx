'use client'

import { motion } from 'framer-motion'
import type { MuscleRecovery, MuscleGroup } from '@/types'

const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  chest: 'Chest',
  back: 'Back',
  legs: 'Legs',
  shoulders: 'Shoulders',
  arms: 'Arms',
  core: 'Core',
}

interface MuscleRecoveryBarProps {
  recovery: MuscleRecovery[]
}

export function MuscleRecoveryBar({ recovery }: MuscleRecoveryBarProps) {
  return (
    <div className="space-y-4">
      {recovery.map(({ muscle, recovery_score, hours_since, last_trained_at }, i) => {
        const pct = Math.round(recovery_score * 100)
        const isReady = recovery_score >= 0.8

        return (
          <motion.div
            key={muscle}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06, duration: 0.35, ease: 'easeOut' }}
            className="space-y-1.5"
          >
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">{MUSCLE_LABELS[muscle]}</span>
                {isReady && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.06 + 0.3, type: 'spring', stiffness: 400 }}
                    className="rounded-sm bg-primary px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[oklch(0.07_0_0)]"
                  >
                    Ready
                  </motion.span>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {last_trained_at
                  ? hours_since < 1 ? 'Just trained' : `${hours_since}h ago`
                  : 'Fresh'}
              </span>
            </div>

            {/* Track */}
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/8">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ delay: i * 0.06 + 0.1, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                className={`h-full rounded-full ${isReady
                  ? 'bg-gradient-to-r from-[oklch(0.88_0.26_130)] to-[oklch(0.78_0.23_130)]'
                  : 'bg-gradient-to-r from-[oklch(0.35_0_0)] to-[oklch(0.28_0_0)]'
                }`}
              />
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
