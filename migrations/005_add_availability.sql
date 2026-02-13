-- Add availability column (JSONB)
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS availability JSONB DEFAULT '{}'::jsonb;

-- Example Structure for availability:
-- {
--   "sunday": { "start": "09:00", "end": "17:00", "enabled": true },
--   "monday": { "start": "09:00", "end": "17:00", "enabled": true },
--   ...
-- }
