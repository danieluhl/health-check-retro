ALTER TABLE public.retros
ADD COLUMN timer timestamp with time zone NOT NULL DEFAULT now();
