import { getExerciseById } from '@/lib/exercises'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { notFound } from 'next/navigation'
import { Youtube, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function ExerciseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const exercise = getExerciseById(id)

  if (!exercise) notFound()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/exercises">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">{exercise.name}</h1>
      </div>

      <div className="flex gap-2">
        <Badge className="capitalize">{exercise.primary_muscle}</Badge>
        {exercise.secondary_muscles.map(m => (
          <Badge key={m} variant="secondary" className="capitalize">{m}</Badge>
        ))}
      </div>

      {exercise.image_url && (
        <div className="overflow-hidden rounded-xl border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={exercise.image_url} alt={exercise.name} className="w-full object-cover" />
        </div>
      )}

      <p className="text-muted-foreground leading-relaxed">{exercise.description}</p>

      {exercise.youtube_url && (
        <a href={exercise.youtube_url} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" className="gap-2 w-full">
            <Youtube className="h-4 w-4 text-red-500" />
            Watch on YouTube
          </Button>
        </a>
      )}
    </div>
  )
}
