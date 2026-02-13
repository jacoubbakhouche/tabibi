-- Add phone column to doctors table
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS phone TEXT;
