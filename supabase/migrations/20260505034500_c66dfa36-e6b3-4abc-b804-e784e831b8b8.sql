ALTER TABLE public.departments ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_departments_sort_order ON public.departments(sort_order);