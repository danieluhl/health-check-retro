create table "public"."teams" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "created_at" timestamp with time zone not null default now(),
    constraint "teams_pkey" primary key ("id")
);

alter table "public"."teams" enable row level security;

alter table "public"."retros" add column "team_id" uuid;

create index idx_retro_team_id on public.retros using btree (team_id);

alter table "public"."retros" add constraint "retro_team_id_fkey" FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE not valid;

alter table "public"."retros" validate constraint "retro_team_id_fkey";

grant delete on table "public"."teams" to "anon";
grant insert on table "public"."teams" to "anon";
grant references on table "public"."teams" to "anon";
grant select on table "public"."teams" to "anon";
grant trigger on table "public"."teams" to "anon";
grant truncate on table "public"."teams" to "anon";
grant update on table "public"."teams" to "anon";

grant delete on table "public"."teams" to "authenticated";
grant insert on table "public"."teams" to "authenticated";
grant references on table "public"."teams" to "authenticated";
grant select on table "public"."teams" to "authenticated";
grant trigger on table "public"."teams" to "authenticated";
grant truncate on table "public"."teams" to "authenticated";
grant update on table "public"."teams" to "authenticated";

grant delete on table "public"."teams" to "service_role";
grant insert on table "public"."teams" to "service_role";
grant references on table "public"."teams" to "service_role";
grant select on table "public"."teams" to "service_role";
grant trigger on table "public"."teams" to "service_role";
grant truncate on table "public"."teams" to "service_role";
grant update on table "public"."teams" to "service_role";

create policy "Enable full access for all users on teams" on "public"."teams" for all using (true) with check (true);
