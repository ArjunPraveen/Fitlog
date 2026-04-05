export interface AccentPreset {
  id: string
  name: string
  /** The main accent color (oklch) */
  primary: string
  /** Dimmer variant for secondary usage */
  primaryDim: string
  /** Gradient start for text-gold */
  gradientFrom: string
  /** Gradient end for text-gold */
  gradientTo: string
  /** Ring / focus color */
  ring: string
  /** CSS color string for the swatch preview */
  swatch: string
  /** Chart color scale (5 steps, bright → dim) */
  chart: [string, string, string, string, string]
}

export const ACCENT_PRESETS: AccentPreset[] = [
  {
    id: 'lime',
    name: 'Lime',
    primary: 'oklch(0.88 0.26 130)',
    primaryDim: 'oklch(0.75 0.22 130)',
    gradientFrom: 'oklch(0.93 0.22 128)',
    gradientTo: 'oklch(0.82 0.28 133)',
    ring: 'oklch(0.88 0.26 130 / 40%)',
    swatch: 'oklch(0.88 0.26 130)',
    chart: ['oklch(0.88 0.26 130)', 'oklch(0.78 0.23 130)', 'oklch(0.68 0.19 130)', 'oklch(0.58 0.15 130)', 'oklch(0.48 0.11 130)'],
  },
  {
    id: 'blue',
    name: 'Blue',
    primary: 'oklch(0.72 0.19 250)',
    primaryDim: 'oklch(0.60 0.16 250)',
    gradientFrom: 'oklch(0.80 0.16 245)',
    gradientTo: 'oklch(0.65 0.22 255)',
    ring: 'oklch(0.72 0.19 250 / 40%)',
    swatch: 'oklch(0.72 0.19 250)',
    chart: ['oklch(0.72 0.19 250)', 'oklch(0.64 0.17 250)', 'oklch(0.56 0.15 250)', 'oklch(0.48 0.13 250)', 'oklch(0.40 0.10 250)'],
  },
  {
    id: 'cyan',
    name: 'Cyan',
    primary: 'oklch(0.82 0.16 195)',
    primaryDim: 'oklch(0.68 0.14 195)',
    gradientFrom: 'oklch(0.88 0.14 190)',
    gradientTo: 'oklch(0.74 0.18 200)',
    ring: 'oklch(0.82 0.16 195 / 40%)',
    swatch: 'oklch(0.82 0.16 195)',
    chart: ['oklch(0.82 0.16 195)', 'oklch(0.72 0.14 195)', 'oklch(0.62 0.12 195)', 'oklch(0.52 0.10 195)', 'oklch(0.42 0.08 195)'],
  },
  {
    id: 'pink',
    name: 'Pink',
    primary: 'oklch(0.75 0.20 350)',
    primaryDim: 'oklch(0.62 0.18 350)',
    gradientFrom: 'oklch(0.82 0.18 345)',
    gradientTo: 'oklch(0.68 0.22 355)',
    ring: 'oklch(0.75 0.20 350 / 40%)',
    swatch: 'oklch(0.75 0.20 350)',
    chart: ['oklch(0.75 0.20 350)', 'oklch(0.67 0.18 350)', 'oklch(0.59 0.16 350)', 'oklch(0.51 0.14 350)', 'oklch(0.43 0.11 350)'],
  },
  {
    id: 'purple',
    name: 'Purple',
    primary: 'oklch(0.72 0.20 300)',
    primaryDim: 'oklch(0.60 0.17 300)',
    gradientFrom: 'oklch(0.80 0.17 295)',
    gradientTo: 'oklch(0.65 0.22 305)',
    ring: 'oklch(0.72 0.20 300 / 40%)',
    swatch: 'oklch(0.72 0.20 300)',
    chart: ['oklch(0.72 0.20 300)', 'oklch(0.64 0.18 300)', 'oklch(0.56 0.15 300)', 'oklch(0.48 0.12 300)', 'oklch(0.40 0.10 300)'],
  },
  {
    id: 'orange',
    name: 'Orange',
    primary: 'oklch(0.82 0.18 65)',
    primaryDim: 'oklch(0.70 0.16 65)',
    gradientFrom: 'oklch(0.88 0.16 60)',
    gradientTo: 'oklch(0.75 0.20 70)',
    ring: 'oklch(0.82 0.18 65 / 40%)',
    swatch: 'oklch(0.82 0.18 65)',
    chart: ['oklch(0.82 0.18 65)', 'oklch(0.73 0.16 65)', 'oklch(0.64 0.14 65)', 'oklch(0.55 0.12 65)', 'oklch(0.46 0.09 65)'],
  },
  {
    id: 'red',
    name: 'Red',
    primary: 'oklch(0.70 0.22 25)',
    primaryDim: 'oklch(0.58 0.19 25)',
    gradientFrom: 'oklch(0.78 0.19 22)',
    gradientTo: 'oklch(0.63 0.24 28)',
    ring: 'oklch(0.70 0.22 25 / 40%)',
    swatch: 'oklch(0.70 0.22 25)',
    chart: ['oklch(0.70 0.22 25)', 'oklch(0.62 0.19 25)', 'oklch(0.54 0.16 25)', 'oklch(0.46 0.13 25)', 'oklch(0.38 0.10 25)'],
  },
  {
    id: 'gold',
    name: 'Gold',
    primary: 'oklch(0.82 0.14 82)',
    primaryDim: 'oklch(0.70 0.12 82)',
    gradientFrom: 'oklch(0.88 0.12 78)',
    gradientTo: 'oklch(0.74 0.16 86)',
    ring: 'oklch(0.82 0.14 82 / 40%)',
    swatch: 'oklch(0.82 0.14 82)',
    chart: ['oklch(0.82 0.14 82)', 'oklch(0.73 0.12 82)', 'oklch(0.64 0.10 82)', 'oklch(0.55 0.08 82)', 'oklch(0.46 0.06 82)'],
  },
]

const STORAGE_KEY = 'fitlog-accent'
const DEFAULT_ACCENT = 'lime'

export function getSavedAccent(): string {
  if (typeof window === 'undefined') return DEFAULT_ACCENT
  return localStorage.getItem(STORAGE_KEY) ?? DEFAULT_ACCENT
}

export function saveAccent(id: string) {
  localStorage.setItem(STORAGE_KEY, id)
}

export function getPreset(id: string): AccentPreset {
  return ACCENT_PRESETS.find(p => p.id === id) ?? ACCENT_PRESETS[0]
}

/** Apply a preset's CSS variables to the document root */
export function applyAccent(id: string) {
  const preset = getPreset(id)
  const root = document.documentElement.style

  root.setProperty('--primary', preset.primary)
  root.setProperty('--accent', preset.primary)
  root.setProperty('--ring', preset.ring)
  root.setProperty('--primary-dim', preset.primaryDim)
  root.setProperty('--accent-gradient-from', preset.gradientFrom)
  root.setProperty('--accent-gradient-to', preset.gradientTo)
  root.setProperty('--chart-1', preset.chart[0])
  root.setProperty('--chart-2', preset.chart[1])
  root.setProperty('--chart-3', preset.chart[2])
  root.setProperty('--chart-4', preset.chart[3])
  root.setProperty('--chart-5', preset.chart[4])
}
