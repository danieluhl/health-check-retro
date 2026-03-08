create table "public"."experiments" (
    "id" uuid not null default gen_random_uuid(),
    "retro_id" uuid not null,
    "text" text not null,
    "status" text not null default 'active'::text,
    "created_at" timestamp with time zone not null default now(),
    constraint "experiments_pkey" primary key ("id"),
    constraint "experiments_status_check" check (status in ('active', 'accepted', 'rejected'))
);

alter table "public"."experiments" enable row level security;

create index idx_experiments_retro_id on public.experiments using btree (retro_id);
create index idx_experiments_status on public.experiments using btree (status);

alter table "public"."experiments" add constraint "experiments_retro_id_fkey" FOREIGN KEY (retro_id) REFERENCES retros(id) ON DELETE CASCADE not valid;
alter table "public"."experiments" validate constraint "experiments_retro_id_fkey";

grant delete on table "public"."experiments" to "anon";
grant insert on table "public"."experiments" to "anon";
grant references on table "public"."experiments" to "anon";
grant select on table "public"."experiments" to "anon";
grant trigger on table "public"."experiments" to "anon";
grant truncate on table "public"."experiments" to "anon";
grant update on table "public"."experiments" to "anon";

grant delete on table "public"."experiments" to "authenticated";
grant insert on table "public"."experiments" to "authenticated";
grant references on table "public"."experiments" to "authenticated";
grant select on table "public"."experiments" to "authenticated";
grant trigger on table "public"."experiments" to "authenticated";
grant truncate on table "public"."experiments" to "authenticated";
grant update on table "public"."experiments" to "authenticated";

grant delete on table "public"."experiments" to "service_role";
grant insert on table "public"."experiments" to "service_role";
grant references on table "public"."experiments" to "service_role";
grant select on table "public"."experiments" to "service_role";
grant trigger on table "public"."experiments" to "service_role";
grant truncate on table "public"."experiments" to "service_role";
grant update on table "public"."experiments" to "service_role";

create policy "Enable full access for all users on experiments" on "public"."experiments" for all using (true) with check (true);

alter publication supabase_realtime add table experiments;
