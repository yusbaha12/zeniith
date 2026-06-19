-- Tujuan: Menambahkan fondasi database fase 4 untuk ujian, sesi, jawaban, dan hasil grading.
-- Caller: Drizzle migrate runner backend.
-- Dependensi: Schema Drizzle backend fase 4 dan PostgreSQL enum/index/foreign key.
-- Main Functions: Membuat enum exam/session/question serta tabel exam engine dengan indeks jalur baca/tulis utama.
-- Side Effects: Menulis struktur database baru dan indeks untuk list ujian, submit jawaban, auto-submit, dan hasil ujian.

CREATE TYPE "public"."exam_type" AS ENUM('TRYOUT', 'LATIHAN', 'MID_EXAM', 'FINAL_EXAM');--> statement-breakpoint
CREATE TYPE "public"."question_type" AS ENUM('MULTIPLE_CHOICE', 'ESSAY');--> statement-breakpoint
CREATE TYPE "public"."session_status" AS ENUM('ACTIVE', 'SUBMITTED', 'EXPIRED', 'TERMINATED');--> statement-breakpoint
CREATE TABLE "answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"selected_option_id" uuid,
	"answer_text" text,
	"is_marked_doubt" boolean DEFAULT false NOT NULL,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exam_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"exam_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"total_questions" integer NOT NULL,
	"answered_questions" integer NOT NULL,
	"correct_answers" integer NOT NULL,
	"wrong_answers" integer NOT NULL,
	"unanswered_questions" integer NOT NULL,
	"score" integer NOT NULL,
	"max_score" integer NOT NULL,
	"percentage" integer NOT NULL,
	"duration_seconds" integer NOT NULL,
	"submitted_at" timestamp NOT NULL,
	"graded_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exam_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exam_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "session_status" DEFAULT 'ACTIVE' NOT NULL,
	"warning_count" integer DEFAULT 0 NOT NULL,
	"is_auto_submitted" boolean DEFAULT false NOT NULL,
	"started_at" timestamp NOT NULL,
	"expires_at" timestamp NOT NULL,
	"submitted_at" timestamp,
	"last_heartbeat_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" uuid,
	"subject_id" uuid,
	"created_by" uuid,
	"title" varchar(180) NOT NULL,
	"slug" varchar(180) NOT NULL,
	"description" text,
	"instructions" text,
	"exam_type" "exam_type" NOT NULL,
	"duration_minutes" integer NOT NULL,
	"total_questions" integer DEFAULT 0 NOT NULL,
	"total_score" integer DEFAULT 0 NOT NULL,
	"starts_at" timestamp NOT NULL,
	"ends_at" timestamp NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "exams_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exam_id" uuid NOT NULL,
	"question_type" "question_type" NOT NULL,
	"content_json" jsonb NOT NULL,
	"explanation_json" jsonb,
	"score" integer DEFAULT 1 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_id" uuid NOT NULL,
	"option_key" varchar(2) NOT NULL,
	"content_json" jsonb NOT NULL,
	"is_correct" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "answers" ADD CONSTRAINT "answers_session_id_exam_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."exam_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "answers" ADD CONSTRAINT "answers_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "answers" ADD CONSTRAINT "answers_selected_option_id_options_id_fk" FOREIGN KEY ("selected_option_id") REFERENCES "public"."options"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_results" ADD CONSTRAINT "exam_results_session_id_exam_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."exam_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_results" ADD CONSTRAINT "exam_results_exam_id_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_results" ADD CONSTRAINT "exam_results_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_sessions" ADD CONSTRAINT "exam_sessions_exam_id_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_sessions" ADD CONSTRAINT "exam_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exams" ADD CONSTRAINT "exams_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exams" ADD CONSTRAINT "exams_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exams" ADD CONSTRAINT "exams_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_exam_id_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "options" ADD CONSTRAINT "options_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uidx_answers_session_question" ON "answers" USING btree ("session_id","question_id");--> statement-breakpoint
CREATE INDEX "idx_answers_session" ON "answers" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_answers_question" ON "answers" USING btree ("question_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uidx_exam_results_session" ON "exam_results" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_exam_results_exam_score" ON "exam_results" USING btree ("exam_id","score");--> statement-breakpoint
CREATE INDEX "idx_exam_results_user_graded" ON "exam_results" USING btree ("user_id","graded_at");--> statement-breakpoint
CREATE INDEX "idx_exam_sessions_user_status" ON "exam_sessions" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "idx_exam_sessions_exam_status" ON "exam_sessions" USING btree ("exam_id","status");--> statement-breakpoint
CREATE INDEX "idx_exam_sessions_expires_at" ON "exam_sessions" USING btree ("status","expires_at");--> statement-breakpoint
CREATE INDEX "idx_exams_branch_published_starts" ON "exams" USING btree ("branch_id","is_published","starts_at");--> statement-breakpoint
CREATE INDEX "idx_exams_teacher_updated" ON "exams" USING btree ("created_by","updated_at");--> statement-breakpoint
CREATE INDEX "idx_exams_subject_starts" ON "exams" USING btree ("subject_id","starts_at");--> statement-breakpoint
CREATE INDEX "idx_questions_exam_sort" ON "questions" USING btree ("exam_id","sort_order");--> statement-breakpoint
CREATE INDEX "idx_questions_exam_score" ON "questions" USING btree ("exam_id","score");--> statement-breakpoint
CREATE INDEX "idx_options_question_sort" ON "options" USING btree ("question_id","sort_order");--> statement-breakpoint
CREATE INDEX "idx_options_question_correct" ON "options" USING btree ("question_id","is_correct");
