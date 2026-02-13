-- Add image_url column to doctors table
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS image_url TEXT;
