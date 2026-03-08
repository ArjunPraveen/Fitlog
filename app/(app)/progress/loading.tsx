export default function ProgressLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      <div>
        <div className="h-3 w-24 rounded bg-white/6 mb-2" />
        <div className="h-9 w-36 rounded bg-white/10" />
      </div>
      <div className="h-10 rounded-xl bg-white/6" />
      <div className="h-56 rounded-2xl bg-white/6" />
    </div>
  )
}
