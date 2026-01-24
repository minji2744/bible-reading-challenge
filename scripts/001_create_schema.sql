-- Create groups table
CREATE TABLE IF NOT EXISTS public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create profiles table that references auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL UNIQUE, -- User's identifier (what they input)
  nickname TEXT, -- Display name shown on dashboard
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create readings table to track daily Bible reading
CREATE TABLE IF NOT EXISTS public.readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chapters_read INTEGER NOT NULL CHECK (chapters_read > 0),
  reading_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  book TEXT,
  start_chapter INTEGER,
  UNIQUE(user_id, reading_date, book, start_chapter),
  CONSTRAINT unique_user_date_book_chapter UNIQUE(user_id, reading_date, book, start_chapter)
);

-- Enable Row Level Security
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.readings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for groups (everyone can read all groups)
CREATE POLICY "groups_select_all"
  ON public.groups FOR SELECT
  USING (true);

-- RLS Policies for profiles (users can read all profiles, but only update their own)
CREATE POLICY "profiles_select_all"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for readings (users can read all readings, but only insert/update their own)
CREATE POLICY "readings_select_all"
  ON public.readings FOR SELECT
  USING (true);

CREATE POLICY "readings_insert_own"
  ON public.readings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "readings_update_own"
  ON public.readings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "readings_delete_own"
  ON public.readings FOR DELETE
  USING (auth.uid() = user_id);

-- Insert 5 default groups
INSERT INTO public.groups (group_name) VALUES
  ('1조'),
  ('2조'),
  ('3조'),
  ('4조'),
  ('5조')
ON CONFLICT DO NOTHING;

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_group_id UUID;
  v_user_id TEXT;
  v_nickname TEXT;
BEGIN
  -- Extract metadata from user
  v_user_id := COALESCE(NEW.raw_user_meta_data->>'user_id', '');
  v_nickname := COALESCE(NEW.raw_user_meta_data->>'nickname', '');
  v_group_id := (NEW.raw_user_meta_data->>'group_id')::UUID;
  
  -- Only create profile if we have the required data
  IF v_user_id IS NOT NULL AND v_user_id != '' AND v_group_id IS NOT NULL THEN
    INSERT INTO public.profiles (id, user_id, nickname, group_id)
    VALUES (
      NEW.id,
      v_user_id,
      v_nickname,
      v_group_id
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail user creation
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();