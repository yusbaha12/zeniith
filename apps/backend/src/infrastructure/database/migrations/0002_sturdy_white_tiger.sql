-- Tujuan: Menambahkan fondasi database fase 3 untuk subject, module, material, dan progress belajar.
-- Caller: Drizzle migrate runner backend.
-- Dependensi: Schema Drizzle backend fase 3 dan PostgreSQL enum/index/foreign key.
-- Main Functions: Membuat enum material_type, tabel ruang belajar, foreign key, dan index akses utama.
-- Side Effects: Menulis struktur database baru dan index untuk alur ruang belajar murid/guru.

CREATE TYPE "public"."material_type" AS ENUM('VIDEO', 'PDF', 'EXERCISE', 'TEXT');--> statement-breakpoint
CREATE TABLE "subjects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(120) NOT NULL,
	"slug" varchar(120) NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subjects_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "modules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subject_id" uuid NOT NULL,
	"title" varchar(160) NOT NULL,
	"slug" varchar(160) NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "materials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"module_id" uuid NOT NULL,
	"branch_id" uuid,
	"created_by" uuid,
	"title" varchar(180) NOT NULL,
	"slug" varchar(180) NOT NULL,
	"summary" text,
	"material_type" "material_type" NOT NULL,
	"content_json" jsonb,
	"attachment_object_key" text,
	"attachment_file_name" varchar(255),
	"attachment_content_type" varchar(120),
	"estimated_duration_minutes" integer,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "material_progresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"material_id" uuid NOT NULL,
	"progress_percent" integer DEFAULT 0 NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp,
	"last_accessed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "modules" ADD CONSTRAINT "modules_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_progresses" ADD CONSTRAINT "material_progresses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_progresses" ADD CONSTRAINT "material_progresses_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_subjects_active_sort" ON "subjects" USING btree ("is_active","sort_order");--> statement-breakpoint
CREATE INDEX "idx_modules_subject_sort" ON "modules" USING btree ("subject_id","is_active","sort_order");--> statement-breakpoint
CREATE INDEX "idx_materials_module_published_sort" ON "materials" USING btree ("module_id","is_published","sort_order");--> statement-breakpoint
CREATE INDEX "idx_materials_teacher_updated" ON "materials" USING btree ("created_by","updated_at");--> statement-breakpoint
CREATE INDEX "idx_materials_branch_published" ON "materials" USING btree ("branch_id","is_published");--> statement-breakpoint
CREATE UNIQUE INDEX "uidx_material_progress_user_material" ON "material_progresses" USING btree ("user_id","material_id");--> statement-breakpoint
CREATE INDEX "idx_material_progress_user_completed" ON "material_progresses" USING btree ("user_id","is_completed");--> statement-breakpoint
CREATE INDEX "idx_material_progress_material" ON "material_progresses" USING btree ("material_id");
