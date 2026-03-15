'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface ProgressChartProps {
  data: { date: string; weight_kg: number }[]
}

export function ProgressChart({ data }: ProgressChartProps) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data}>
        <defs>
          <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="oklch(0.80 0.10 82)" />
            <stop offset="100%" stopColor="oklch(0.58 0.08 58)" />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 6%)" />
        <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'oklch(0.58 0.02 72)' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: 'oklch(0.58 0.02 72)' }} axisLine={false} tickLine={false} unit="kg" width={36} />
        <Tooltip
          contentStyle={{ background: 'oklch(0.16 0.01 280)', border: '1px solid oklch(1 0 0 / 10%)', borderRadius: '12px', fontSize: '12px' }}
          labelStyle={{ color: 'oklch(0.93 0.015 72)' }}
          itemStyle={{ color: 'oklch(0.72 0.09 72)' }}
          formatter={(v) => [`${v}kg`, 'Weight']}
        />
        <Line type="monotone" dataKey="weight_kg" stroke="url(#goldGrad)" strokeWidth={2.5} dot={{ fill: 'oklch(0.72 0.09 72)', strokeWidth: 0, r: 3 }} activeDot={{ fill: 'oklch(0.80 0.10 82)', r: 5, strokeWidth: 0 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}
