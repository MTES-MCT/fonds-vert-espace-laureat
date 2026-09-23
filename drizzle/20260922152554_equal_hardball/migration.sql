CREATE TABLE "fonds_vert_export_admission" (
	"id" integer PRIMARY KEY,
	"next_allowed_at" timestamp with time zone NOT NULL,
	CONSTRAINT "fonds_vert_export_admission_singleton" CHECK ("id" = 1)
);
