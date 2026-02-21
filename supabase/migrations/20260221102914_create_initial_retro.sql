create table "public"."entry" (
    "id" uuid not null default gen_random_uuid(),
    "survey_id" uuid not null,
    "user_id" uuid not null,
    "answers" jsonb,
    "created_at" timestamp with time zone not null default now()
);


alter table "public"."entry" enable row level security;

create table "public"."retro" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now()
);


alter table "public"."retro" enable row level security;

create table "public"."retro_user" (
    "id" uuid not null default gen_random_uuid(),
    "retro_id" uuid not null,
    "user_id" uuid not null,
    "joined_at" timestamp with time zone not null default now()
);


alter table "public"."retro_user" enable row level security;

create table "public"."survey" (
    "id" uuid not null default gen_random_uuid(),
    "retro_id" uuid not null,
    "created_at" timestamp with time zone not null default now()
);


alter table "public"."survey" enable row level security;

create table "public"."topic" (
    "id" uuid not null default gen_random_uuid(),
    "status" text not null default 'open'::text,
    "text" text not null,
    "user_id" uuid not null,
    "retro_id" uuid not null,
    "created_at" timestamp with time zone not null default now()
);


alter table "public"."topic" enable row level security;

create table "public"."users" (
    "id" uuid not null default gen_random_uuid(),
    "name" text,
    "email" text
);


alter table "public"."users" enable row level security;

create table "public"."vote" (
    "id" uuid not null default gen_random_uuid(),
    "topic_id" uuid not null,
    "user_id" uuid not null,
    "created_at" timestamp with time zone not null default now()
);


alter table "public"."vote" enable row level security;

CREATE UNIQUE INDEX entry_pkey ON public.entry USING btree (id);

CREATE UNIQUE INDEX entry_survey_id_user_id_key ON public.entry USING btree (survey_id, user_id);

CREATE INDEX idx_entry_survey_id ON public.entry USING btree (survey_id);

CREATE INDEX idx_entry_user_id ON public.entry USING btree (user_id);

CREATE INDEX idx_retro_created_at ON public.retro USING btree (created_at);

CREATE INDEX idx_retro_user_retro_id ON public.retro_user USING btree (retro_id);

CREATE INDEX idx_retro_user_user_id ON public.retro_user USING btree (user_id);

CREATE INDEX idx_survey_retro_id ON public.survey USING btree (retro_id);

CREATE INDEX idx_topic_retro_id ON public.topic USING btree (retro_id);

CREATE INDEX idx_topic_status ON public.topic USING btree (status);

CREATE INDEX idx_topic_user_id ON public.topic USING btree (user_id);

CREATE INDEX idx_users_email ON public.users USING btree (email);

CREATE INDEX idx_vote_topic_id ON public.vote USING btree (topic_id);

CREATE INDEX idx_vote_user_id ON public.vote USING btree (user_id);

CREATE UNIQUE INDEX retro_pkey ON public.retro USING btree (id);

CREATE UNIQUE INDEX retro_user_pkey ON public.retro_user USING btree (id);

CREATE UNIQUE INDEX retro_user_retro_id_user_id_key ON public.retro_user USING btree (retro_id, user_id);

CREATE UNIQUE INDEX survey_pkey ON public.survey USING btree (id);

CREATE UNIQUE INDEX topic_pkey ON public.topic USING btree (id);

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);

CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id);

CREATE UNIQUE INDEX vote_pkey ON public.vote USING btree (id);

CREATE UNIQUE INDEX vote_topic_id_user_id_key ON public.vote USING btree (topic_id, user_id);

alter table "public"."entry" add constraint "entry_pkey" PRIMARY KEY using index "entry_pkey";

alter table "public"."retro" add constraint "retro_pkey" PRIMARY KEY using index "retro_pkey";

alter table "public"."retro_user" add constraint "retro_user_pkey" PRIMARY KEY using index "retro_user_pkey";

alter table "public"."survey" add constraint "survey_pkey" PRIMARY KEY using index "survey_pkey";

alter table "public"."topic" add constraint "topic_pkey" PRIMARY KEY using index "topic_pkey";

alter table "public"."users" add constraint "users_pkey" PRIMARY KEY using index "users_pkey";

alter table "public"."vote" add constraint "vote_pkey" PRIMARY KEY using index "vote_pkey";

alter table "public"."entry" add constraint "entry_survey_id_fkey" FOREIGN KEY (survey_id) REFERENCES survey(id) ON DELETE CASCADE not valid;

alter table "public"."entry" validate constraint "entry_survey_id_fkey";

alter table "public"."entry" add constraint "entry_survey_id_user_id_key" UNIQUE using index "entry_survey_id_user_id_key";

alter table "public"."entry" add constraint "entry_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."entry" validate constraint "entry_user_id_fkey";

alter table "public"."retro_user" add constraint "retro_user_retro_id_fkey" FOREIGN KEY (retro_id) REFERENCES retro(id) ON DELETE CASCADE not valid;

alter table "public"."retro_user" validate constraint "retro_user_retro_id_fkey";

alter table "public"."retro_user" add constraint "retro_user_retro_id_user_id_key" UNIQUE using index "retro_user_retro_id_user_id_key";

alter table "public"."retro_user" add constraint "retro_user_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."retro_user" validate constraint "retro_user_user_id_fkey";

alter table "public"."survey" add constraint "survey_retro_id_fkey" FOREIGN KEY (retro_id) REFERENCES retro(id) ON DELETE CASCADE not valid;

alter table "public"."survey" validate constraint "survey_retro_id_fkey";

alter table "public"."topic" add constraint "topic_retro_id_fkey" FOREIGN KEY (retro_id) REFERENCES retro(id) ON DELETE CASCADE not valid;

alter table "public"."topic" validate constraint "topic_retro_id_fkey";

alter table "public"."topic" add constraint "topic_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL not valid;

alter table "public"."topic" validate constraint "topic_user_id_fkey";

alter table "public"."users" add constraint "users_email_key" UNIQUE using index "users_email_key";

alter table "public"."vote" add constraint "vote_topic_id_fkey" FOREIGN KEY (topic_id) REFERENCES topic(id) ON DELETE CASCADE not valid;

alter table "public"."vote" validate constraint "vote_topic_id_fkey";

alter table "public"."vote" add constraint "vote_topic_id_user_id_key" UNIQUE using index "vote_topic_id_user_id_key";

alter table "public"."vote" add constraint "vote_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."vote" validate constraint "vote_user_id_fkey";

grant delete on table "public"."entry" to "anon";

grant insert on table "public"."entry" to "anon";

grant references on table "public"."entry" to "anon";

grant select on table "public"."entry" to "anon";

grant trigger on table "public"."entry" to "anon";

grant truncate on table "public"."entry" to "anon";

grant update on table "public"."entry" to "anon";

grant delete on table "public"."entry" to "authenticated";

grant insert on table "public"."entry" to "authenticated";

grant references on table "public"."entry" to "authenticated";

grant select on table "public"."entry" to "authenticated";

grant trigger on table "public"."entry" to "authenticated";

grant truncate on table "public"."entry" to "authenticated";

grant update on table "public"."entry" to "authenticated";

grant delete on table "public"."entry" to "service_role";

grant insert on table "public"."entry" to "service_role";

grant references on table "public"."entry" to "service_role";

grant select on table "public"."entry" to "service_role";

grant trigger on table "public"."entry" to "service_role";

grant truncate on table "public"."entry" to "service_role";

grant update on table "public"."entry" to "service_role";

grant delete on table "public"."retro" to "anon";

grant insert on table "public"."retro" to "anon";

grant references on table "public"."retro" to "anon";

grant select on table "public"."retro" to "anon";

grant trigger on table "public"."retro" to "anon";

grant truncate on table "public"."retro" to "anon";

grant update on table "public"."retro" to "anon";

grant delete on table "public"."retro" to "authenticated";

grant insert on table "public"."retro" to "authenticated";

grant references on table "public"."retro" to "authenticated";

grant select on table "public"."retro" to "authenticated";

grant trigger on table "public"."retro" to "authenticated";

grant truncate on table "public"."retro" to "authenticated";

grant update on table "public"."retro" to "authenticated";

grant delete on table "public"."retro" to "service_role";

grant insert on table "public"."retro" to "service_role";

grant references on table "public"."retro" to "service_role";

grant select on table "public"."retro" to "service_role";

grant trigger on table "public"."retro" to "service_role";

grant truncate on table "public"."retro" to "service_role";

grant update on table "public"."retro" to "service_role";

grant delete on table "public"."retro_user" to "anon";

grant insert on table "public"."retro_user" to "anon";

grant references on table "public"."retro_user" to "anon";

grant select on table "public"."retro_user" to "anon";

grant trigger on table "public"."retro_user" to "anon";

grant truncate on table "public"."retro_user" to "anon";

grant update on table "public"."retro_user" to "anon";

grant delete on table "public"."retro_user" to "authenticated";

grant insert on table "public"."retro_user" to "authenticated";

grant references on table "public"."retro_user" to "authenticated";

grant select on table "public"."retro_user" to "authenticated";

grant trigger on table "public"."retro_user" to "authenticated";

grant truncate on table "public"."retro_user" to "authenticated";

grant update on table "public"."retro_user" to "authenticated";

grant delete on table "public"."retro_user" to "service_role";

grant insert on table "public"."retro_user" to "service_role";

grant references on table "public"."retro_user" to "service_role";

grant select on table "public"."retro_user" to "service_role";

grant trigger on table "public"."retro_user" to "service_role";

grant truncate on table "public"."retro_user" to "service_role";

grant update on table "public"."retro_user" to "service_role";

grant delete on table "public"."survey" to "anon";

grant insert on table "public"."survey" to "anon";

grant references on table "public"."survey" to "anon";

grant select on table "public"."survey" to "anon";

grant trigger on table "public"."survey" to "anon";

grant truncate on table "public"."survey" to "anon";

grant update on table "public"."survey" to "anon";

grant delete on table "public"."survey" to "authenticated";

grant insert on table "public"."survey" to "authenticated";

grant references on table "public"."survey" to "authenticated";

grant select on table "public"."survey" to "authenticated";

grant trigger on table "public"."survey" to "authenticated";

grant truncate on table "public"."survey" to "authenticated";

grant update on table "public"."survey" to "authenticated";

grant delete on table "public"."survey" to "service_role";

grant insert on table "public"."survey" to "service_role";

grant references on table "public"."survey" to "service_role";

grant select on table "public"."survey" to "service_role";

grant trigger on table "public"."survey" to "service_role";

grant truncate on table "public"."survey" to "service_role";

grant update on table "public"."survey" to "service_role";

grant delete on table "public"."topic" to "anon";

grant insert on table "public"."topic" to "anon";

grant references on table "public"."topic" to "anon";

grant select on table "public"."topic" to "anon";

grant trigger on table "public"."topic" to "anon";

grant truncate on table "public"."topic" to "anon";

grant update on table "public"."topic" to "anon";

grant delete on table "public"."topic" to "authenticated";

grant insert on table "public"."topic" to "authenticated";

grant references on table "public"."topic" to "authenticated";

grant select on table "public"."topic" to "authenticated";

grant trigger on table "public"."topic" to "authenticated";

grant truncate on table "public"."topic" to "authenticated";

grant update on table "public"."topic" to "authenticated";

grant delete on table "public"."topic" to "service_role";

grant insert on table "public"."topic" to "service_role";

grant references on table "public"."topic" to "service_role";

grant select on table "public"."topic" to "service_role";

grant trigger on table "public"."topic" to "service_role";

grant truncate on table "public"."topic" to "service_role";

grant update on table "public"."topic" to "service_role";

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

grant delete on table "public"."vote" to "anon";

grant insert on table "public"."vote" to "anon";

grant references on table "public"."vote" to "anon";

grant select on table "public"."vote" to "anon";

grant trigger on table "public"."vote" to "anon";

grant truncate on table "public"."vote" to "anon";

grant update on table "public"."vote" to "anon";

grant delete on table "public"."vote" to "authenticated";

grant insert on table "public"."vote" to "authenticated";

grant references on table "public"."vote" to "authenticated";

grant select on table "public"."vote" to "authenticated";

grant trigger on table "public"."vote" to "authenticated";

grant truncate on table "public"."vote" to "authenticated";

grant update on table "public"."vote" to "authenticated";

grant delete on table "public"."vote" to "service_role";

grant insert on table "public"."vote" to "service_role";

grant references on table "public"."vote" to "service_role";

grant select on table "public"."vote" to "service_role";

grant trigger on table "public"."vote" to "service_role";

grant truncate on table "public"."vote" to "service_role";

grant update on table "public"."vote" to "service_role";


