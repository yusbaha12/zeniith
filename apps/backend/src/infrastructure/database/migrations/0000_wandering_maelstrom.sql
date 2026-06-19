-- Tujuan: Migration fase 1 untuk membuat tabel branches dan users beserta enum dan indeks auth dasar.
-- Caller: drizzle-kit migrate dan bootstrap database lokal/staging.
-- Dependensi: PostgreSQL 16, schema branches/users dari Drizzle.
-- Main Functions: Membentuk struktur awal auth dan branch scope yang dipakai fase 1.
-- Side Effects: Membuat enum, tabel, foreign key, dan indeks pada database PostgreSQL.

CREATE TYPE "public"."user_role" AS ENUM('SUPER_ADMIN', 'BRANCH_ADMIN', 'TEACHER', 'STUDENT');--> statement-breakpoint
CREATE TABLE "branches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"code" varchar(10) NOT NULL,
	"address" text,
	"city" varchar(100),
	"phone" varchar(20),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "branches_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" uuid,
	"name" varchar(100) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"phone" varchar(15),
	"role" "user_role" DEFAULT 'STUDENT' NOT NULL,
	"avatar_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_branches_code" ON "branches" USING btree ("code");--> statement-breakpoint
CREATE INDEX "idx_users_email" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_users_branch" ON "users" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "idx_users_role" ON "users" USING btree ("role");
