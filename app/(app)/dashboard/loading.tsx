export default function DashboardLoading() {
  return (
    <div className="space-y-7 animate-pulse">
      <div className="pt-2">
        <div className="h-3 w-24 rounded bg-white/8 mb-2" />
        <div className="h-10 w-40 rounded bg-white/10" />
        <div className="h-4 w-56 rounded bg-white/6 mt-3" />
      </div>
      <div>
        <div className="h-3 w-28 rounded bg-white/6 mb-4" />
        <div className="grid grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-white/6" />
          ))}
        </div>
      </div>
      <div>
        <div className="h-3 w-32 rounded bg-white/6 mb-4" />
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-white/6" />
          ))}
        </div>
      </div>
    </div>
  )
}
