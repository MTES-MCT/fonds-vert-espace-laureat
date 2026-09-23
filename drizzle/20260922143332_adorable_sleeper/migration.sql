CREATE TABLE "fonds_vert_export_pages" (
	"export_id" uuid,
	"page_number" integer,
	"generated_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"total_count" integer NOT NULL,
	"corrections" jsonb NOT NULL,
	CONSTRAINT "fonds_vert_export_pages_pkey" PRIMARY KEY("export_id","page_number")
);
--> statement-breakpoint
CREATE INDEX "fonds_vert_export_pages_expiration_idx" ON "fonds_vert_export_pages" ("expires_at");