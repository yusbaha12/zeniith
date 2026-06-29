/*
Tujuan: Membuat tabel pivot PIC guru per mata pelajaran.
Caller: Drizzle migrate dan workflow `bun run db:migrate`.
Dependensi: subjects, users, dan PostgreSQL index/foreign key.
Main Functions: Menyimpan assignment guru ke subject dengan PK komposit dan index lookup per guru/subject.
Side Effects: Menambah tabel subject_teacher_assignments, foreign key, dan index ke database.
*/

CREATE TABLE "subject_teacher_assignments" (
	"subject_id" uuid NOT NULL,
	"teacher_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subject_teacher_assignments_subject_id_teacher_id_pk" PRIMARY KEY("subject_id","teacher_id")
);
--> statement-breakpoint
ALTER TABLE "subject_teacher_assignments" ADD CONSTRAINT "subject_teacher_assignments_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject_teacher_assignments" ADD CONSTRAINT "subject_teacher_assignments_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_subject_teacher_assignments_teacher" ON "subject_teacher_assignments" USING btree ("teacher_id");--> statement-breakpoint
CREATE INDEX "idx_subject_teacher_assignments_subject" ON "subject_teacher_assignments" USING btree ("subject_id");
