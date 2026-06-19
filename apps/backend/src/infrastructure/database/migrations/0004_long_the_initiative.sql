-- Tujuan: Menambahkan fondasi database RBAC granular untuk permissions, role mapping, user override, dan audit authz.
-- Caller: Drizzle migrate runner backend.
-- Dependensi: Schema Drizzle backend RBAC, enum user_role yang sudah ada, dan PostgreSQL enum/index/foreign key.
-- Main Functions: Membuat enum permission_effect serta tabel permissions, role_permissions, user_permissions, dan permission_audits dengan indeks lookup utama.
-- Side Effects: Menulis struktur database baru dan indeks untuk bootstrap permission matrix, override user, dan histori perubahan authz.

CREATE TYPE "public"."permission_effect" AS ENUM('ALLOW', 'DENY');--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(100) NOT NULL,
	"module" varchar(50) NOT NULL,
	"action" varchar(50) NOT NULL,
	"description" text NOT NULL,
	"is_system" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "permissions_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"role" "user_role" NOT NULL,
	"permission_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "role_permissions_role_permission_id_pk" PRIMARY KEY("role","permission_id")
);
--> statement-breakpoint
CREATE TABLE "user_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"permission_id" uuid NOT NULL,
	"effect" "permission_effect" DEFAULT 'ALLOW' NOT NULL,
	"reason" text,
	"expires_at" timestamp,
	"granted_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uidx_user_permissions_user_permission" UNIQUE("user_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "permission_audits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_user_id" uuid,
	"target_user_id" uuid,
	"target_role" "user_role",
	"permission_code" varchar(100) NOT NULL,
	"effect" "permission_effect",
	"action_type" varchar(30) NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_granted_by_users_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permission_audits" ADD CONSTRAINT "permission_audits_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permission_audits" ADD CONSTRAINT "permission_audits_target_user_id_users_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_permissions_module" ON "permissions" USING btree ("module");--> statement-breakpoint
CREATE INDEX "idx_permissions_module_action" ON "permissions" USING btree ("module","action");--> statement-breakpoint
CREATE INDEX "idx_role_permissions_permission" ON "role_permissions" USING btree ("permission_id");--> statement-breakpoint
CREATE INDEX "idx_user_permissions_user" ON "user_permissions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_permissions_effective" ON "user_permissions" USING btree ("user_id","effect","expires_at");--> statement-breakpoint
CREATE INDEX "idx_user_permissions_permission" ON "user_permissions" USING btree ("permission_id");--> statement-breakpoint
CREATE INDEX "idx_permission_audits_actor_created" ON "permission_audits" USING btree ("actor_user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_permission_audits_target_created" ON "permission_audits" USING btree ("target_user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_permission_audits_code_created" ON "permission_audits" USING btree ("permission_code","created_at");
