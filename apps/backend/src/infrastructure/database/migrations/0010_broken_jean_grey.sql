CREATE TYPE "public"."badge_tier" AS ENUM('BRONZE', 'SILVER', 'GOLD', 'PLATINUM');--> statement-breakpoint
CREATE TYPE "public"."gamification_character" AS ENUM('ASTRA', 'NOVA', 'LUMI', 'RAKA');--> statement-breakpoint
CREATE TYPE "public"."gamification_event_type" AS ENUM('MATERIAL_COMPLETED', 'MODULE_COMPLETED', 'PRACTICE_COMPLETED', 'EXAM_SUBMITTED', 'EXAM_GRADED', 'PROCTOR_CLEAN_EXAM', 'DAILY_STREAK', 'QUEST_CLAIMED');--> statement-breakpoint
CREATE TYPE "public"."quest_status" AS ENUM('ACTIVE', 'COMPLETED', 'CLAIMED', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "public"."quest_type" AS ENUM('DAILY', 'WEEKLY', 'EVENT');--> statement-breakpoint
CREATE TABLE "badges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(80) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"category" varchar(40) NOT NULL,
	"tier" "badge_tier" NOT NULL,
	"criteria" jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "badges_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "quests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(100) NOT NULL,
	"type" "quest_type" NOT NULL,
	"title" varchar(120) NOT NULL,
	"description" text NOT NULL,
	"xp_reward" integer NOT NULL,
	"criteria" jsonb NOT NULL,
	"starts_at" timestamp NOT NULL,
	"ends_at" timestamp NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_badges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"badge_id" uuid NOT NULL,
	"earned_at" timestamp DEFAULT now() NOT NULL,
	"source_event_id" uuid,
	CONSTRAINT "student_badges_student_badge_unique" UNIQUE("student_id","badge_id")
);
--> statement-breakpoint
CREATE TABLE "student_profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"character_code" "gamification_character" DEFAULT 'ASTRA' NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"total_xp" integer DEFAULT 0 NOT NULL,
	"current_streak" integer DEFAULT 0 NOT NULL,
	"longest_streak" integer DEFAULT 0 NOT NULL,
	"streak_shields" smallint DEFAULT 0 NOT NULL,
	"last_activity_date" date,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_quests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"quest_id" uuid NOT NULL,
	"progress_value" integer DEFAULT 0 NOT NULL,
	"target_value" integer NOT NULL,
	"status" "quest_status" DEFAULT 'ACTIVE' NOT NULL,
	"claimed_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "student_quests_student_quest_unique" UNIQUE("student_id","quest_id")
);
--> statement-breakpoint
CREATE TABLE "xp_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"event_type" "gamification_event_type" NOT NULL,
	"source_id" uuid NOT NULL,
	"xp_delta" integer NOT NULL,
	"reason" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "xp_ledger_student_event_source_unique" UNIQUE("student_id","event_type","source_id")
);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "midtrans_snap_token" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "midtrans_transaction_id" varchar(100);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "midtrans_payment_type" varchar(60);--> statement-breakpoint
ALTER TABLE "student_badges" ADD CONSTRAINT "student_badges_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_badges" ADD CONSTRAINT "student_badges_badge_id_badges_id_fk" FOREIGN KEY ("badge_id") REFERENCES "public"."badges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_quests" ADD CONSTRAINT "student_quests_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_quests" ADD CONSTRAINT "student_quests_quest_id_quests_id_fk" FOREIGN KEY ("quest_id") REFERENCES "public"."quests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "xp_ledger" ADD CONSTRAINT "xp_ledger_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_badges_category_tier" ON "badges" USING btree ("category","tier");--> statement-breakpoint
CREATE INDEX "idx_quests_active_window" ON "quests" USING btree ("is_active","starts_at","ends_at");--> statement-breakpoint
CREATE INDEX "idx_student_badges_student_earned" ON "student_badges" USING btree ("student_id","earned_at");--> statement-breakpoint
CREATE INDEX "idx_student_profiles_level_xp" ON "student_profiles" USING btree ("level","total_xp");--> statement-breakpoint
CREATE INDEX "idx_student_profiles_streak" ON "student_profiles" USING btree ("current_streak");--> statement-breakpoint
CREATE INDEX "idx_student_quests_student_status" ON "student_quests" USING btree ("student_id","status","updated_at");--> statement-breakpoint
CREATE INDEX "idx_student_quests_quest_status" ON "student_quests" USING btree ("quest_id","status");--> statement-breakpoint
CREATE INDEX "idx_xp_ledger_student_created" ON "xp_ledger" USING btree ("student_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_xp_ledger_event_created" ON "xp_ledger" USING btree ("event_type","created_at");