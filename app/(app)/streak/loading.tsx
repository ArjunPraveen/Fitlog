export default function StreakLoading() {
  return (
    <div className="page-transition flex flex-col items-center pt-4 pb-8 animate-pulse">
      {/* Flame circle skeleton */}
      <div className="h-24 w-24 rounded-full bg-white/5" />
      {/* Number skeleton */}
      <div className="mt-6 h-20 w-24 rounded-2xl bg-white/5" />
      {/* Label skeleton */}
      <div className="mt-2 h-4 w-20 rounded bg-white/5" />
      {/* Motivation skeleton */}
      <div className="mt-3 h-4 w-40 rounded bg-white/5" />
      {/* Week dots skeleton */}
      <div className="mt-10 flex gap-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-5 w-5 rounded-full bg-white/5" />
        ))}
      </div>
      {/* Month grid skeleton */}
      <div className="mt-10 w-full h-48 rounded-2xl bg-white/5" />
      {/* Stats skeleton */}
      <div className="mt-8 w-full grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-white/5" />
        ))}
      </div>
    </div>
  )
}
