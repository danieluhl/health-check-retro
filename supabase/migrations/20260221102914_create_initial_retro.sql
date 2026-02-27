create table "public"."entries" (
    "id" uuid not null default gen_random_uuid(),
    "survey_id" uuid not null,
    "user_id" uuid not null,
    "answers" jsonb,
    "created_at" timestamp with time zone not null default now()
);


alter table "public"."entries" enable row level security;

create table "public"."retros" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now()
);


alter table "public"."retros" enable row level security;

create table "public"."retro_users" (
    "id" uuid not null default gen_random_uuid(),
    "retro_id" uuid not null,
    "user_id" uuid not null,
    "joined_at" timestamp with time zone not null default now()
);


alter table "public"."retro_users" enable row level security;

create table "public"."surveys" (
    "id" uuid not null default gen_random_uuid(),
    "retro_id" uuid not null,
    "created_at" timestamp with time zone not null default now()
);


alter table "public"."surveys" enable row level security;

create table "public"."topics" (
    "id" uuid not null default gen_random_uuid(),
    "status" text not null default 'open'::text,
    "text" text not null,
    "user_id" uuid not null,
    "retro_id" uuid not null,
    "created_at" timestamp with time zone not null default now()
);


alter table "public"."topics" enable row level security;

create table "public"."users" (
    "id" uuid not null default gen_random_uuid(),
    "name" text,
    "email" text
);


alter table "public"."users" enable row level security;

create table "public"."votes" (
    "id" uuid not null default gen_random_uuid(),
    "topic_id" uuid not null,
    "user_id" uuid not null,
    "created_at" timestamp with time zone not null default now()
);


alter table "public"."votes" enable row level security;

CREATE UNIQUE INDEX entries_pkey ON public.entries USING btree (id);

CREATE UNIQUE INDEX entries_survey_id_user_id_key ON public.entries USING btree (survey_id, user_id);

CREATE INDEX idx_entries_survey_id ON public.entries USING btree (survey_id);

CREATE INDEX idx_entries_user_id ON public.entries USING btree (user_id);

CREATE INDEX idx_retro_created_at ON public.retros USING btree (created_at);

CREATE INDEX idx_retro_user_retro_id ON public.retro_users USING btree (retro_id);

CREATE INDEX idx_retro_user_user_id ON public.retro_users USING btree (user_id);

CREATE INDEX idx_survey_retro_id ON public.surveys USING btree (retro_id);

CREATE INDEX idx_topic_retro_id ON public.topics USING btree (retro_id);

CREATE INDEX idx_topic_status ON public.topics USING btree (status);

CREATE INDEX idx_topic_user_id ON public.topics USING btree (user_id);

CREATE INDEX idx_users_email ON public.users USING btree (email);

CREATE INDEX idx_votes_topic_id ON public.votes USING btree (topic_id);

CREATE INDEX idx_votes_user_id ON public.votes USING btree (user_id);

CREATE UNIQUE INDEX retro_pkey ON public.retros USING btree (id);

CREATE UNIQUE INDEX retro_user_pkey ON public.retro_users USING btree (id);

CREATE UNIQUE INDEX retro_user_retro_id_user_id_key ON public.retro_users USING btree (retro_id, user_id);

CREATE UNIQUE INDEX survey_pkey ON public.surveys USING btree (id);

CREATE UNIQUE INDEX topic_pkey ON public.topics USING btree (id);

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);

CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id);

CREATE UNIQUE INDEX votes_pkey ON public.votes USING btree (id);

CREATE UNIQUE INDEX votes_topic_id_user_id_key ON public.votes USING btree (topic_id, user_id);

alter table "public"."entries" add constraint "entries_pkey" PRIMARY KEY using index "entries_pkey";

alter table "public"."retros" add constraint "retro_pkey" PRIMARY KEY using index "retro_pkey";

alter table "public"."retro_users" add constraint "retro_user_pkey" PRIMARY KEY using index "retro_user_pkey";

alter table "public"."surveys" add constraint "survey_pkey" PRIMARY KEY using index "survey_pkey";

alter table "public"."topics" add constraint "topic_pkey" PRIMARY KEY using index "topic_pkey";

alter table "public"."users" add constraint "users_pkey" PRIMARY KEY using index "users_pkey";

alter table "public"."votes" add constraint "votes_pkey" PRIMARY KEY using index "votes_pkey";

alter table "public"."entries" add constraint "entries_survey_id_fkey" FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE CASCADE not valid;

alter table "public"."entries" validate constraint "entries_survey_id_fkey";

alter table "public"."entries" add constraint "entries_survey_id_user_id_key" UNIQUE using index "entries_survey_id_user_id_key";

alter table "public"."entries" add constraint "entries_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."entries" validate constraint "entries_user_id_fkey";

alter table "public"."retro_users" add constraint "retro_user_retro_id_fkey" FOREIGN KEY (retro_id) REFERENCES retros(id) ON DELETE CASCADE not valid;

alter table "public"."retro_users" validate constraint "retro_user_retro_id_fkey";

alter table "public"."retro_users" add constraint "retro_user_retro_id_user_id_key" UNIQUE using index "retro_user_retro_id_user_id_key";

alter table "public"."retro_users" add constraint "retro_user_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."retro_users" validate constraint "retro_user_user_id_fkey";

alter table "public"."surveys" add constraint "survey_retro_id_fkey" FOREIGN KEY (retro_id) REFERENCES retros(id) ON DELETE CASCADE not valid;

alter table "public"."surveys" validate constraint "survey_retro_id_fkey";

alter table "public"."topics" add constraint "topic_retro_id_fkey" FOREIGN KEY (retro_id) REFERENCES retros(id) ON DELETE CASCADE not valid;

alter table "public"."topics" validate constraint "topic_retro_id_fkey";

alter table "public"."topics" add constraint "topic_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL not valid;

alter table "public"."topics" validate constraint "topic_user_id_fkey";

alter table "public"."users" add constraint "users_email_key" UNIQUE using index "users_email_key";

alter table "public"."votes" add constraint "votes_topic_id_fkey" FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE not valid;

alter table "public"."votes" validate constraint "votes_topic_id_fkey";

alter table "public"."votes" add constraint "votes_topic_id_user_id_key" UNIQUE using index "votes_topic_id_user_id_key";

alter table "public"."votes" add constraint "votes_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."votes" validate constraint "votes_user_id_fkey";

grant delete on table "public"."entries" to "anon";

grant insert on table "public"."entries" to "anon";

grant references on table "public"."entries" to "anon";

grant select on table "public"."entries" to "anon";

grant trigger on table "public"."entries" to "anon";

grant truncate on table "public"."entries" to "anon";

grant update on table "public"."entries" to "anon";

grant delete on table "public"."entries" to "authenticated";

grant insert on table "public"."entries" to "authenticated";

grant references on table "public"."entries" to "authenticated";

grant select on table "public"."entries" to "authenticated";

grant trigger on table "public"."entries" to "authenticated";

grant truncate on table "public"."entries" to "authenticated";

grant update on table "public"."entries" to "authenticated";

grant delete on table "public"."entries" to "service_role";

grant insert on table "public"."entries" to "service_role";

grant references on table "public"."entries" to "service_role";

grant select on table "public"."entries" to "service_role";

grant trigger on table "public"."entries" to "service_role";

grant truncate on table "public"."entries" to "service_role";

grant update on table "public"."entries" to "service_role";

grant delete on table "public"."retros" to "anon";

grant insert on table "public"."retros" to "anon";

grant references on table "public"."retros" to "anon";

grant select on table "public"."retros" to "anon";

grant trigger on table "public"."retros" to "anon";

grant truncate on table "public"."retros" to "anon";

grant update on table "public"."retros" to "anon";

grant delete on table "public"."retros" to "authenticated";

grant insert on table "public"."retros" to "authenticated";

grant references on table "public"."retros" to "authenticated";

grant select on table "public"."retros" to "authenticated";

grant trigger on table "public"."retros" to "authenticated";

grant truncate on table "public"."retros" to "authenticated";

grant update on table "public"."retros" to "authenticated";

grant delete on table "public"."retros" to "service_role";

grant insert on table "public"."retros" to "service_role";

grant references on table "public"."retros" to "service_role";

grant select on table "public"."retros" to "service_role";

grant trigger on table "public"."retros" to "service_role";

grant truncate on table "public"."retros" to "service_role";

grant update on table "public"."retros" to "service_role";

grant delete on table "public"."retro_users" to "anon";

grant insert on table "public"."retro_users" to "anon";

grant references on table "public"."retro_users" to "anon";

grant select on table "public"."retro_users" to "anon";

grant trigger on table "public"."retro_users" to "anon";

grant truncate on table "public"."retro_users" to "anon";

grant update on table "public"."retro_users" to "anon";

grant delete on table "public"."retro_users" to "authenticated";

grant insert on table "public"."retro_users" to "authenticated";

grant references on table "public"."retro_users" to "authenticated";

grant select on table "public"."retro_users" to "authenticated";

grant trigger on table "public"."retro_users" to "authenticated";

grant truncate on table "public"."retro_users" to "authenticated";

grant update on table "public"."retro_users" to "authenticated";

grant delete on table "public"."retro_users" to "service_role";

grant insert on table "public"."retro_users" to "service_role";

grant references on table "public"."retro_users" to "service_role";

grant select on table "public"."retro_users" to "service_role";

grant trigger on table "public"."retro_users" to "service_role";

grant truncate on table "public"."retro_users" to "service_role";

grant update on table "public"."retro_users" to "service_role";

grant delete on table "public"."surveys" to "anon";

grant insert on table "public"."surveys" to "anon";

grant references on table "public"."surveys" to "anon";

grant select on table "public"."surveys" to "anon";

grant trigger on table "public"."surveys" to "anon";

grant truncate on table "public"."surveys" to "anon";

grant update on table "public"."surveys" to "anon";

grant delete on table "public"."surveys" to "authenticated";

grant insert on table "public"."surveys" to "authenticated";

grant references on table "public"."surveys" to "authenticated";

grant select on table "public"."surveys" to "authenticated";

grant trigger on table "public"."surveys" to "authenticated";

grant truncate on table "public"."surveys" to "authenticated";

grant update on table "public"."surveys" to "authenticated";

grant delete on table "public"."surveys" to "service_role";

grant insert on table "public"."surveys" to "service_role";

grant references on table "public"."surveys" to "service_role";

grant select on table "public"."surveys" to "service_role";

grant trigger on table "public"."surveys" to "service_role";

grant truncate on table "public"."surveys" to "service_role";

grant update on table "public"."surveys" to "service_role";

grant delete on table "public"."topics" to "anon";

grant insert on table "public"."topics" to "anon";

grant references on table "public"."topics" to "anon";

grant select on table "public"."topics" to "anon";

grant trigger on table "public"."topics" to "anon";

grant truncate on table "public"."topics" to "anon";

grant update on table "public"."topics" to "anon";

grant delete on table "public"."topics" to "authenticated";

grant insert on table "public"."topics" to "authenticated";

grant references on table "public"."topics" to "authenticated";

grant select on table "public"."topics" to "authenticated";

grant trigger on table "public"."topics" to "authenticated";

grant truncate on table "public"."topics" to "authenticated";

grant update on table "public"."topics" to "authenticated";

grant delete on table "public"."topics" to "service_role";

grant insert on table "public"."topics" to "service_role";

grant references on table "public"."topics" to "service_role";

grant select on table "public"."topics" to "service_role";

grant trigger on table "public"."topics" to "service_role";

grant truncate on table "public"."topics" to "service_role";

grant update on table "public"."topics" to "service_role";

grant delete on table "public"."users" to "anon";

grant insert on table "public"."users" to "anon";

grant references on table "public"."users" to "anon";

grant select on table "public"."users" to "anon";

grant trigger on table "public"."users" to "anon";

grant truncate on table "public"."users" to "anon";

grant update on table "public"."users" to "anon";

grant delete on table "public"."users" to "authenticated";

grant insert on table "public"."users" to "authenticated";

grant references on table "public"."users" to "authenticated";

grant select on table "public"."users" to "authenticated";

grant trigger on table "public"."users" to "authenticated";

grant truncate on table "public"."users" to "authenticated";

grant update on table "public"."users" to "authenticated";

grant delete on table "public"."users" to "service_role";

grant insert on table "public"."users" to "service_role";

grant references on table "public"."users" to "service_role";

grant select on table "public"."users" to "service_role";

grant trigger on table "public"."users" to "service_role";

grant truncate on table "public"."users" to "service_role";

grant update on table "public"."users" to "service_role";

grant delete on table "public"."votes" to "anon";

grant insert on table "public"."votes" to "anon";

grant references on table "public"."votes" to "anon";

grant select on table "public"."votes" to "anon";

grant trigger on table "public"."votes" to "anon";

grant truncate on table "public"."votes" to "anon";

grant update on table "public"."votes" to "anon";

grant delete on table "public"."votes" to "authenticated";

grant insert on table "public"."votes" to "authenticated";

grant references on table "public"."votes" to "authenticated";

grant select on table "public"."votes" to "authenticated";

grant trigger on table "public"."votes" to "authenticated";

grant truncate on table "public"."votes" to "authenticated";

grant update on table "public"."votes" to "authenticated";

grant delete on table "public"."votes" to "service_role";

grant insert on table "public"."votes" to "service_role";

grant references on table "public"."votes" to "service_role";

grant select on table "public"."votes" to "service_role";

grant trigger on table "public"."votes" to "service_role";

grant truncate on table "public"."votes" to "service_role";

grant update on table "public"."votes" to "service_role";


