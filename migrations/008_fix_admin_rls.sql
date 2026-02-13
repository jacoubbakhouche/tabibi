-- WARNING: This is for testing purposes only!
-- It allows anyone to read/update doctor data.
-- Revert this in production.

-- Enable access to doctors table
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view doctors" ON public.doctors;
CREATE POLICY "Public can view doctors" ON public.doctors
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can update doctors" ON public.doctors;
CREATE POLICY "Public can update doctors" ON public.doctors
FOR UPDATE USING (true);

-- Enable access to profiles table (needed for joins)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view profiles" ON public.profiles;
CREATE POLICY "Public can view profiles" ON public.profiles
FOR SELECT USING (true);
