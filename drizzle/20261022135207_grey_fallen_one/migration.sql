CREATE TYPE "dossier_progress_status" AS ENUM('Non-commencé', 'En cours de réalisation', 'Bloqué', 'Abandonné', 'Terminé');--> statement-breakpoint
CREATE TABLE "dossier_progress_revisions" (
	"dossier_number" integer,
	"revision" integer,
	"status" "dossier_progress_status" NOT NULL,
	"author_email" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "dossier_progress_revisions_pkey" PRIMARY KEY("dossier_number","revision"),
	CONSTRAINT "dossier_progress_revisions_revision_positive" CHECK ("revision" > 0)
);
