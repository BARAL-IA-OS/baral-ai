-- Campo opcional website_url en Brand Brain.
-- OBLIGATORIO: sin esta columna, guardar el Brand Brain falla (el form envia website_url).
-- Correr en Supabase → SQL Editor. Una sola vez.

ALTER TABLE public.brand_brain
ADD COLUMN IF NOT EXISTS website_url TEXT;
