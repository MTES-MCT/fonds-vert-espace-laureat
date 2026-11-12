ALTER TABLE "fonds_vert_export_admission" DROP CONSTRAINT "fonds_vert_export_admission_singleton";--> statement-breakpoint
ALTER TABLE "fonds_vert_export_pages" ADD COLUMN "demo" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "fonds_vert_export_admission" ADD CONSTRAINT "fonds_vert_export_admission_scope" CHECK ("id" in (1, 2));