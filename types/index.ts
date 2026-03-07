export type MuscleGroup = 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'core'
export type FitnessGoal = 'strength' | 'hypertrophy' | 'endurance'
export type FollowStatus = 'pending' | 'accepted' | 'rejected'

export interface User {
  id: string
  email: string
  name: string
  avatar_url: string | null
  created_at: string
}

export interface Exercise {
  id: string
  name: string
  primary_muscle: MuscleGroup
  secondary_muscles: MuscleGroup[]
  description: string
  image_url: string | null
  youtube_url: string | null
  category: 'strength' | 'cardio' | 'flexibility'
}

export interface WorkoutTemplate {
  id: string
  user_id: string
  name: string
  exercise_ids: string[]
  created_at: string
}

export interface Workout {
  id: string
  user_id: string
  name: string | null
  template_id: string | null
  started_at: string
  finished_at: string | null
  notes: string | null
}

export interface WorkoutSet {
  id: string
  workout_id: string
  exercise_id: string
  set_number: number
  reps: number
  weight_kg: number
  rpe: number | null
  logged_at: string
}

export interface UserPreferences {
  id: string
  user_id: string
  fitness_goal: FitnessGoal
  available_equip: string[]
  days_per_week: number
}

export interface FollowRequest {
  id: string
  from_user: string
  to_user: string
  status: FollowStatus
  created_at: string
}

export interface PrivacySettings {
  id: string
  user_id: string
  workouts_public: boolean
  profile_searchable: boolean
}

// Enriched types used on frontend
export interface WorkoutWithSets extends Workout {
  sets: (WorkoutSet & { exercise: Exercise })[]
}

export interface MuscleRecovery {
  muscle: MuscleGroup
  recovery_score: number   // 0.0 to 1.0 (1.0 = fully recovered)
  hours_since: number
  last_trained_at: string | null
}
