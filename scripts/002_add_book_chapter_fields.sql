-- Add book and start_chapter fields to readings table
ALTER TABLE public.readings
ADD COLUMN IF NOT EXISTS book TEXT,
ADD COLUMN IF NOT EXISTS start_chapter INTEGER;

