SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."handle_new_retro"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.surveys (retro_id)
  VALUES (new.id);
  RETURN new;
END;
$$;


ALTER FUNCTION "public"."handle_new_retro"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."entries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "survey_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "answers" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."entries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."retro_users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "retro_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "joined_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."retro_users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."retros" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "team_id" "uuid"
);


ALTER TABLE "public"."retros" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."surveys" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "retro_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."surveys" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."teams" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."teams" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."topics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "status" "text" DEFAULT 'open'::"text" NOT NULL,
    "text" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "retro_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."topics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text",
    "email" "text"
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."votes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "topic_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."votes" OWNER TO "postgres";


ALTER TABLE ONLY "public"."entries"
    ADD CONSTRAINT "entries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."entries"
    ADD CONSTRAINT "entries_survey_id_user_id_key" UNIQUE ("survey_id", "user_id");



ALTER TABLE ONLY "public"."retros"
    ADD CONSTRAINT "retro_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."retro_users"
    ADD CONSTRAINT "retro_user_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."retro_users"
    ADD CONSTRAINT "retro_user_retro_id_user_id_key" UNIQUE ("retro_id", "user_id");



ALTER TABLE ONLY "public"."surveys"
    ADD CONSTRAINT "survey_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."topics"
    ADD CONSTRAINT "topic_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."votes"
    ADD CONSTRAINT "votes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."votes"
    ADD CONSTRAINT "votes_topic_id_user_id_key" UNIQUE ("topic_id", "user_id");



CREATE INDEX "idx_entries_survey_id" ON "public"."entries" USING "btree" ("survey_id");



CREATE INDEX "idx_entries_user_id" ON "public"."entries" USING "btree" ("user_id");



CREATE INDEX "idx_retro_created_at" ON "public"."retros" USING "btree" ("created_at");



CREATE INDEX "idx_retro_team_id" ON "public"."retros" USING "btree" ("team_id");



CREATE INDEX "idx_retro_user_retro_id" ON "public"."retro_users" USING "btree" ("retro_id");



CREATE INDEX "idx_retro_user_user_id" ON "public"."retro_users" USING "btree" ("user_id");



CREATE INDEX "idx_survey_retro_id" ON "public"."surveys" USING "btree" ("retro_id");



CREATE INDEX "idx_topic_retro_id" ON "public"."topics" USING "btree" ("retro_id");



CREATE INDEX "idx_topic_status" ON "public"."topics" USING "btree" ("status");



CREATE INDEX "idx_topic_user_id" ON "public"."topics" USING "btree" ("user_id");



CREATE INDEX "idx_users_email" ON "public"."users" USING "btree" ("email");



CREATE INDEX "idx_votes_topic_id" ON "public"."votes" USING "btree" ("topic_id");



CREATE INDEX "idx_votes_user_id" ON "public"."votes" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "on_retro_created" AFTER INSERT ON "public"."retros" FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_retro"();



ALTER TABLE ONLY "public"."entries"
    ADD CONSTRAINT "entries_survey_id_fkey" FOREIGN KEY ("survey_id") REFERENCES "public"."surveys"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."entries"
    ADD CONSTRAINT "entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."retros"
    ADD CONSTRAINT "retro_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."retro_users"
    ADD CONSTRAINT "retro_user_retro_id_fkey" FOREIGN KEY ("retro_id") REFERENCES "public"."retros"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."retro_users"
    ADD CONSTRAINT "retro_user_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."surveys"
    ADD CONSTRAINT "survey_retro_id_fkey" FOREIGN KEY ("retro_id") REFERENCES "public"."retros"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."topics"
    ADD CONSTRAINT "topic_retro_id_fkey" FOREIGN KEY ("retro_id") REFERENCES "public"."retros"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."topics"
    ADD CONSTRAINT "topic_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."votes"
    ADD CONSTRAINT "votes_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."votes"
    ADD CONSTRAINT "votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Enable full access for all users on entries" ON "public"."entries" USING (true) WITH CHECK (true);



CREATE POLICY "Enable full access for all users on retro_users" ON "public"."retro_users" USING (true) WITH CHECK (true);



CREATE POLICY "Enable full access for all users on retros" ON "public"."retros" USING (true) WITH CHECK (true);



CREATE POLICY "Enable full access for all users on surveys" ON "public"."surveys" USING (true) WITH CHECK (true);



CREATE POLICY "Enable full access for all users on teams" ON "public"."teams" USING (true) WITH CHECK (true);



CREATE POLICY "Enable full access for all users on topics" ON "public"."topics" USING (true) WITH CHECK (true);



CREATE POLICY "Enable full access for all users on users" ON "public"."users" USING (true) WITH CHECK (true);



CREATE POLICY "Enable full access for all users on votes" ON "public"."votes" USING (true) WITH CHECK (true);



ALTER TABLE "public"."entries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."retro_users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."retros" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."surveys" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."teams" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."topics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."votes" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_retro"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_retro"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_retro"() TO "service_role";



GRANT ALL ON TABLE "public"."entries" TO "anon";
GRANT ALL ON TABLE "public"."entries" TO "authenticated";
GRANT ALL ON TABLE "public"."entries" TO "service_role";



GRANT ALL ON TABLE "public"."retro_users" TO "anon";
GRANT ALL ON TABLE "public"."retro_users" TO "authenticated";
GRANT ALL ON TABLE "public"."retro_users" TO "service_role";



GRANT ALL ON TABLE "public"."retros" TO "anon";
GRANT ALL ON TABLE "public"."retros" TO "authenticated";
GRANT ALL ON TABLE "public"."retros" TO "service_role";



GRANT ALL ON TABLE "public"."surveys" TO "anon";
GRANT ALL ON TABLE "public"."surveys" TO "authenticated";
GRANT ALL ON TABLE "public"."surveys" TO "service_role";



GRANT ALL ON TABLE "public"."teams" TO "anon";
GRANT ALL ON TABLE "public"."teams" TO "authenticated";
GRANT ALL ON TABLE "public"."teams" TO "service_role";



GRANT ALL ON TABLE "public"."topics" TO "anon";
GRANT ALL ON TABLE "public"."topics" TO "authenticated";
GRANT ALL ON TABLE "public"."topics" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."votes" TO "anon";
GRANT ALL ON TABLE "public"."votes" TO "authenticated";
GRANT ALL ON TABLE "public"."votes" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







