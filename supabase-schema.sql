-- Run this in the Supabase SQL Editor to set up your database

-- 1. Users table (extends Supabase Auth)
CREATE TABLE public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT UNIQUE,
  name        TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Automatically create a user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Exercises (seeded via script, read-only for users)
CREATE TABLE public.exercises (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  primary_muscle    TEXT NOT NULL,
  secondary_muscles TEXT[] DEFAULT '{}',
  description       TEXT,
  image_url         TEXT,
  youtube_url       TEXT,
  category          TEXT DEFAULT 'strength'
);

-- 3. Workout templates
CREATE TABLE public.workout_templates (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  exercise_ids UUID[] DEFAULT '{}',
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- 4. Workout sessions
CREATE TABLE public.workouts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name        TEXT,
  template_id UUID REFERENCES public.workout_templates(id),
  started_at  TIMESTAMPTZ DEFAULT now(),
  finished_at TIMESTAMPTZ,
  notes       TEXT
);

-- 5. Sets within a workout
CREATE TABLE public.workout_sets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id  UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL,  -- references the hardcoded exercise ID from lib/exercises.ts
  set_number  INT NOT NULL,
  reps        INT NOT NULL,
  weight_kg   FLOAT NOT NULL DEFAULT 0,
  rpe         INT,
  logged_at   TIMESTAMPTZ DEFAULT now()
);

-- 6. User preferences
CREATE TABLE public.user_preferences (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  fitness_goal    TEXT DEFAULT 'hypertrophy',
  available_equip TEXT[] DEFAULT '{}',
  days_per_week   INT DEFAULT 3
);

-- 7. Follow requests (Strava-style)
CREATE TABLE public.follow_requests (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user  UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  to_user    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status     TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(from_user, to_user)
);

-- 8. Privacy settings
CREATE TABLE public.privacy_settings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  workouts_public     BOOLEAN DEFAULT false,
  profile_searchable  BOOLEAN DEFAULT true
);

-- ── Row Level Security ────────────────────────────────────────────────────

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.privacy_settings ENABLE ROW LEVEL SECURITY;

-- Users: can read all (for social search), can only update own
CREATE POLICY "users_read_all" ON public.users FOR SELECT USING (true);
CREATE POLICY "users_update_own" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Exercises: readable by all authenticated users
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "exercises_read_all" ON public.exercises FOR SELECT USING (true);

-- Workouts: own workouts always accessible; others only if follow + public
CREATE POLICY "workouts_own" ON public.workouts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "workouts_read_followed" ON public.workouts FOR SELECT USING (
  auth.uid() != user_id AND
  EXISTS (
    SELECT 1 FROM public.follow_requests fr
    WHERE fr.from_user = auth.uid()
      AND fr.to_user = user_id
      AND fr.status = 'accepted'
  ) AND
  EXISTS (
    SELECT 1 FROM public.privacy_settings ps
    WHERE ps.user_id = workouts.user_id
      AND ps.workouts_public = true
  )
);

-- Workout sets: accessible if the workout is accessible
CREATE POLICY "workout_sets_own" ON public.workout_sets FOR ALL USING (
  EXISTS (SELECT 1 FROM public.workouts w WHERE w.id = workout_id AND w.user_id = auth.uid())
);

-- Templates: own only
CREATE POLICY "templates_own" ON public.workout_templates FOR ALL USING (auth.uid() = user_id);

-- Preferences: own only
CREATE POLICY "preferences_own" ON public.user_preferences FOR ALL USING (auth.uid() = user_id);

-- Follow requests: can see own sent/received
CREATE POLICY "follow_requests_own" ON public.follow_requests FOR ALL USING (
  auth.uid() = from_user OR auth.uid() = to_user
);

-- Privacy settings: own only
CREATE POLICY "privacy_own" ON public.privacy_settings FOR ALL USING (auth.uid() = user_id);
