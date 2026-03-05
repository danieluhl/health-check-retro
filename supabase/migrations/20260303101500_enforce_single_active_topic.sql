WITH ranked_active_topics AS (
	SELECT
		id,
		ROW_NUMBER() OVER (
			PARTITION BY retro_id
			ORDER BY created_at ASC, id ASC
		) AS position
	FROM public.topics
	WHERE status = 'active'
)
UPDATE public.topics
SET status = 'open'
WHERE id IN (
	SELECT id
	FROM ranked_active_topics
	WHERE position > 1
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_topics_single_active_per_retro
	ON public.topics (retro_id)
	WHERE status = 'active';
