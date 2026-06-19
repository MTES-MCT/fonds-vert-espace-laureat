CREATE TABLE "dossier_metrics" (
	"dossier_number" integer PRIMARY KEY,
	"metrics" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
