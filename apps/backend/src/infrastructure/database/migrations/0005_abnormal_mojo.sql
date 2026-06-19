CREATE TYPE "public"."proctor_event_type" AS ENUM('TAB_SWITCH', 'WINDOW_BLUR', 'RIGHT_CLICK', 'KEYBOARD_SHORTCUT', 'COPY_ATTEMPT', 'PASTE_ATTEMPT');--> statement-breakpoint
CREATE TABLE "proctor_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"event_type" "proctor_event_type" NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"occurred_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proctor_warnings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"warning_count" integer NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "proctor_logs" ADD CONSTRAINT "proctor_logs_session_id_exam_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."exam_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proctor_logs" ADD CONSTRAINT "proctor_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proctor_warnings" ADD CONSTRAINT "proctor_warnings_session_id_exam_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."exam_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proctor_warnings" ADD CONSTRAINT "proctor_warnings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_proctor_logs_session_occurred" ON "proctor_logs" USING btree ("session_id","occurred_at");--> statement-breakpoint
CREATE INDEX "idx_proctor_logs_user" ON "proctor_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_proctor_warnings_session_created" ON "proctor_warnings" USING btree ("session_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_proctor_warnings_user" ON "proctor_warnings" USING btree ("user_id");