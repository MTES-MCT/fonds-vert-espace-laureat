CREATE TYPE "metric_value_type" AS ENUM('number', 'text', 'boolean', 'text_array');--> statement-breakpoint
CREATE TABLE "dossier_metric_revisions" (
	"dossier_number" integer,
	"metric_code" text,
	"revision" integer,
	"label" text NOT NULL,
	"unit" text,
	"value_type" "metric_value_type" NOT NULL,
	"number_value" numeric,
	"text_value" text,
	"boolean_value" boolean,
	"text_array_value" text[],
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "dossier_metric_revisions_pkey" PRIMARY KEY("dossier_number","metric_code","revision"),
	CONSTRAINT "dossier_metric_revisions_revision_positive" CHECK ("revision" > 0),
	CONSTRAINT "dossier_metric_revisions_typed_value" CHECK (
        (
          "value_type" = 'number'
          and "number_value" is not null
          and "text_value" is null
          and "boolean_value" is null
          and "text_array_value" is null
        )
        or (
          "value_type" = 'text'
          and "number_value" is null
          and "text_value" is not null
          and "boolean_value" is null
          and "text_array_value" is null
        )
        or (
          "value_type" = 'boolean'
          and "number_value" is null
          and "text_value" is null
          and "boolean_value" is not null
          and "text_array_value" is null
        )
        or (
          "value_type" = 'text_array'
          and "number_value" is null
          and "text_value" is null
          and "boolean_value" is null
          and "text_array_value" is not null
        )
      )
);
--> statement-breakpoint
DROP TABLE "dossier_metrics";--> statement-breakpoint
CREATE INDEX "dossier_metric_revisions_latest_idx" ON "dossier_metric_revisions" ("dossier_number","metric_code","revision" DESC NULLS LAST);