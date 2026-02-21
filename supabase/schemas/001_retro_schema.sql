-- Retro app schema
-- File: supabase/schemas/001_retro_schema.sql

-- Users (app-level)
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text unique
);

create index if not exists idx_users_email on public.users (email);

-- Retro sessions
create table if not exists public.retro (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);

create index if not exists idx_retro_created_at on public.retro (created_at);

-- Retro <> User membership (which users are part of a retro)
create table if not exists public.retro_user (
  id uuid primary key default gen_random_uuid(),
  retro_id uuid not null references public.retro(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique (retro_id, user_id)
);

create index if not exists idx_retro_user_retro_id on public.retro_user (retro_id);
create index if not exists idx_retro_user_user_id on public.retro_user (user_id);

-- Topics in a retro
create table if not exists public.topic (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'open', -- possible values: open, closed, archived (app-enforced)
  text text not null,
  user_id uuid not null references public.users(id) on delete set null,
  retro_id uuid not null references public.retro(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists idx_topic_retro_id on public.topic (retro_id);
create index if not exists idx_topic_user_id on public.topic (user_id);
create index if not exists idx_topic_status on public.topic (status);

-- Votes for topics
create table if not exists public.vote (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topic(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (topic_id, user_id)
);

create index if not exists idx_vote_topic_id on public.vote (topic_id);
create index if not exists idx_vote_user_id on public.vote (user_id);

-- Surveys attached to a retro
create table if not exists public.survey (
  id uuid primary key default gen_random_uuid(),
  retro_id uuid not null references public.retro(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists idx_survey_retro_id on public.survey (retro_id);

-- Survey entries (responses)
create table if not exists public.entry (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references public.survey(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  answers jsonb, -- flexible structure for survey answers
  created_at timestamptz not null default now(),
  unique (survey_id, user_id)
);

create index if not exists idx_entry_survey_id on public.entry (survey_id);
create index if not exists idx_entry_user_id on public.entry (user_id);

-- Enable Row Level Security (RLS) on tables that will be exposed via the Data API.
-- Policies are not created yet — tell me your access rules and I'll add them.
alter table public.users enable row level security;
alter table public.retro enable row level security;
alter table public.retro_user enable row level security;
alter table public.topic enable row level security;
alter table public.vote enable row level security;
alter table public.survey enable row level security;
alter table public.entry enable row level security;
