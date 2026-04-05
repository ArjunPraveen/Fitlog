'use client'

import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

// ── Weight Over Time (existing, enhanced) ─────────────────────────────────

interface WeightChartProps {
  data: { date: string; weight_kg: number }[]
}

export function WeightChart({ data }: WeightChartProps) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
        <defs>
          <linearGradient id="limeGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="oklch(0.88 0.26 130)" />
            <stop offset="100%" stopColor="oklch(0.70 0.22 130)" />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 6%)" />
        <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'oklch(0.50 0 0)' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: 'oklch(0.50 0 0)' }} axisLine={false} tickLine={false} unit="kg" width={40} />
        <Tooltip
          contentStyle={{ background: 'oklch(0.13 0 0)', border: '1px solid oklch(1 0 0 / 10%)', borderRadius: '12px', fontSize: '12px' }}
          labelStyle={{ color: 'oklch(0.60 0 0)' }}
          itemStyle={{ color: 'oklch(0.88 0.26 130)' }}
          formatter={(v) => [`${v}kg`, 'Max Weight']}
        />
        <Line
          type="monotone" dataKey="weight_kg" stroke="url(#limeGrad)" strokeWidth={2.5}
          dot={{ fill: 'oklch(0.88 0.26 130)', strokeWidth: 0, r: 3 }}
          activeDot={{ fill: 'oklch(0.88 0.26 130)', r: 5, strokeWidth: 0 }}
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
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="volumeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.88 0.26 130)" stopOpacity={0.3} />
            <stop offset="100%" stopColor="oklch(0.88 0.26 130)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 6%)" />
        <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'oklch(0.50 0 0)' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: 'oklch(0.50 0 0)' }} axisLine={false} tickLine={false} width={50}
          tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`}
        />
        <Tooltip
          contentStyle={{ background: 'oklch(0.13 0 0)', border: '1px solid oklch(1 0 0 / 10%)', borderRadius: '12px', fontSize: '12px' }}
          labelStyle={{ color: 'oklch(0.60 0 0)' }}
          itemStyle={{ color: 'oklch(0.88 0.26 130)' }}
          formatter={(v) => [`${Number(v).toLocaleString()}kg`, 'Volume']}
        />
        <Area
          type="monotone" dataKey="totalVolume" stroke="oklch(0.88 0.26 130)" strokeWidth={2}
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
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 6%)" />
        <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'oklch(0.50 0 0)' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: 'oklch(0.50 0 0)' }} axisLine={false} tickLine={false} width={30} />
        <Tooltip
          contentStyle={{ background: 'oklch(0.13 0 0)', border: '1px solid oklch(1 0 0 / 10%)', borderRadius: '12px', fontSize: '12px' }}
          labelStyle={{ color: 'oklch(0.60 0 0)' }}
        />
        <Bar dataKey="sets" fill="oklch(0.88 0.26 130)" radius={[4, 4, 0, 0]} name="Sets" />
        <Bar dataKey="avgReps" fill="oklch(0.65 0.18 130)" radius={[4, 4, 0, 0]} name="Avg Reps" />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ── Legacy export (backwards compat for dynamic import) ───────────────────

export function ProgressChart({ data }: WeightChartProps) {
  return <WeightChart data={data} />
}
