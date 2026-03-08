export default function HistoryLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      <div>
        <div className="h-3 w-24 rounded bg-white/6 mb-2" />
        <div className="h-9 w-32 rounded bg-white/10" />
      </div>
      <div className="space-y-2">
        <div className="h-3 w-16 rounded bg-white/6" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-white/6" />
        ))}
      </div>
    </div>
  )
}
