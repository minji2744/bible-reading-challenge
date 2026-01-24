-- Drop the old unique constraint that only includes (user_id, reading_date)
-- This prevents multiple chapters from being recorded per day

-- First, check what constraints exist (for debugging)
-- SELECT constraint_name FROM information_schema.table_constraints 
-- WHERE table_name = 'readings' AND constraint_type = 'UNIQUE';

-- Drop the old constraint if it exists
-- ALTER TABLE public.readings 
-- DROP CONSTRAINT IF EXISTS readings_user_id_reading_date_key;

-- Add the new constraint that allows multiple chapters per day
ALTER TABLE public.readings 
ADD CONSTRAINT readings_user_id_reading_date_book_chapter_key 
UNIQUE(user_id, reading_date, book, start_chapter);

