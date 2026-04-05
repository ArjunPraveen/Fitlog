'use client'

import { useMemo } from 'react'
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { getSavedAccent, getPreset } from '@/lib/theme'

/** Read the active accent preset colors for charts */
function useAccentColors() {
  return useMemo(() => {
    const preset = getPreset(getSavedAccent())
    return {
      primary: preset.primary,
      primaryDim: preset.primaryDim,
      chart1: preset.chart[0],
      chart3: preset.chart[2],
    }
  }, [])
}

// ── Shared styles ─────────────────────────────────────────────────────────

const GRID_STROKE = 'oklch(1 0 0 / 6%)'
const TICK_STYLE = { fontSize: 10, fill: 'oklch(0.50 0 0)' }
const TOOLTIP_STYLE = {
  contentStyle: { background: 'oklch(0.13 0 0)', border: '1px solid oklch(1 0 0 / 10%)', borderRadius: '12px', fontSize: '12px' },
  labelStyle: { color: 'oklch(0.60 0 0)' },
}

// ── Weight Over Time ──────────────────────────────────────────────────────

interface WeightChartProps {
  data: { date: string; weight_kg: number }[]
}

export function WeightChart({ data }: WeightChartProps) {
  const colors = useAccentColors()

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
        <defs>
          <linearGradient id="accentGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={colors.primary} />
            <stop offset="100%" stopColor={colors.primaryDim} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
        <XAxis dataKey="date" tick={TICK_STYLE} axisLine={false} tickLine={false} />
        <YAxis tick={TICK_STYLE} axisLine={false} tickLine={false} unit="kg" width={40} />
        <Tooltip
          {...TOOLTIP_STYLE}
          itemStyle={{ color: colors.primary }}
          formatter={(v) => [`${v}kg`, 'Max Weight']}
        />
        <Line
          type="monotone" dataKey="weight_kg" stroke="url(#accentGrad)" strokeWidth={2.5}
          dot={{ fill: colors.primary, strokeWidth: 0, r: 3 }}
          activeDot={{ fill: colors.primary, r: 5, strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

// ── Volume (Tonnage) Over Time ────────────────────────────────────────────

interface VolumeChartProps {
  data: { date: string; totalVolume: number }[]
}

export function VolumeChart({ data }: VolumeChartProps) {
  const colors = useAccentColors()

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="volumeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors.primary} stopOpacity={0.3} />
            <stop offset="100%" stopColor={colors.primary} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
        <XAxis dataKey="date" tick={TICK_STYLE} axisLine={false} tickLine={false} />
        <YAxis tick={TICK_STYLE} axisLine={false} tickLine={false} width={50}
          tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`}
        />
        <Tooltip
          {...TOOLTIP_STYLE}
          itemStyle={{ color: colors.primary }}
          formatter={(v) => [`${Number(v).toLocaleString()}kg`, 'Volume']}
        />
        <Area
          type="monotone" dataKey="totalVolume" stroke={colors.primary} strokeWidth={2}
          fill="url(#volumeGrad)"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// ── Sets & Reps Per Session ───────────────────────────────────────────────

interface SetsRepsChartProps {
  data: { date: string; sets: number; avgReps: number }[]
}

export function SetsRepsChart({ data }: SetsRepsChartProps) {
  const colors = useAccentColors()

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
        <XAxis dataKey="date" tick={TICK_STYLE} axisLine={false} tickLine={false} />
        <YAxis tick={TICK_STYLE} axisLine={false} tickLine={false} width={30} />
        <Tooltip {...TOOLTIP_STYLE} />
        <Bar dataKey="sets" fill={colors.primary} radius={[4, 4, 0, 0]} name="Sets" />
        <Bar dataKey="avgReps" fill={colors.chart3} radius={[4, 4, 0, 0]} name="Avg Reps" />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ── Legacy export ─────────────────────────────────────────────────────────

export function ProgressChart({ data }: WeightChartProps) {
  return <WeightChart data={data} />
}
