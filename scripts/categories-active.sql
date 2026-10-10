ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

UPDATE public.categories
SET is_active = true
WHERE is_active IS NULL;

ALTER TABLE public.categories
  ALTER COLUMN is_active SET DEFAULT true,
  ALTER COLUMN is_active SET NOT NULL;
