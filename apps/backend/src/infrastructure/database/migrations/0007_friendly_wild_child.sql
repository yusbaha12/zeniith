CREATE TABLE "package_subjects" (
	"package_id" uuid NOT NULL,
	"subject_id" uuid NOT NULL,
	CONSTRAINT "package_subjects_package_id_subject_id_pk" PRIMARY KEY("package_id","subject_id")
);
--> statement-breakpoint
ALTER TABLE "package_subjects" ADD CONSTRAINT "package_subjects_package_id_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "package_subjects" ADD CONSTRAINT "package_subjects_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE cascade ON UPDATE no action;