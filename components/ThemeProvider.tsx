'use client'

import { useEffect } from 'react'
import { getSavedAccent, applyAccent } from '@/lib/theme'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    applyAccent(getSavedAccent())
  }, [])

  return <>{children}</>
}
