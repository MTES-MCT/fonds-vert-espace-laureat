import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const metricValueType = pgEnum("metric_value_type", [
  "number",
  "text",
  "boolean",
  "text_array",
]);

export const dossierMetricRevisions = pgTable(
  "dossier_metric_revisions",
  {
    dossierNumber: integer("dossier_number").notNull(),
    metricCode: text("metric_code").notNull(),
    revision: integer("revision").notNull(),
    label: text("label").notNull(),
    unit: text("unit"),
    valueType: metricValueType("value_type").notNull(),
    numberValue: numeric("number_value", { mode: "number" }),
    textValue: text("text_value"),
    booleanValue: boolean("boolean_value"),
    textArrayValue: text("text_array_value").array(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.dossierNumber, table.metricCode, table.revision],
    }),
    check(
      "dossier_metric_revisions_revision_positive",
      sql`${table.revision} > 0`,
    ),
    check(
      "dossier_metric_revisions_typed_value",
      sql`
        (
          ${table.valueType} = 'number'
          and ${table.numberValue} is not null
          and ${table.textValue} is null
          and ${table.booleanValue} is null
          and ${table.textArrayValue} is null
        )
        or (
          ${table.valueType} = 'text'
          and ${table.numberValue} is null
          and ${table.textValue} is not null
          and ${table.booleanValue} is null
          and ${table.textArrayValue} is null
        )
        or (
          ${table.valueType} = 'boolean'
          and ${table.numberValue} is null
          and ${table.textValue} is null
          and ${table.booleanValue} is not null
          and ${table.textArrayValue} is null
        )
        or (
          ${table.valueType} = 'text_array'
          and ${table.numberValue} is null
          and ${table.textValue} is null
          and ${table.booleanValue} is null
          and ${table.textArrayValue} is not null
        )
      `,
    ),
    index("dossier_metric_revisions_latest_idx").on(
      table.dossierNumber,
      table.metricCode,
      table.revision.desc(),
    ),
  ],
);

export const fondsVertExportPages = pgTable(
  "fonds_vert_export_pages",
  {
    exportId: uuid("export_id").notNull(),
    pageNumber: integer("page_number").notNull(),
    generatedAt: timestamp("generated_at", { withTimezone: true }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    totalCount: integer("total_count").notNull(),
    corrections: jsonb("corrections")
      .$type<StoredFondsVertCorrection[]>()
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.exportId, table.pageNumber] }),
    index("fonds_vert_export_pages_expiration_idx").on(table.expiresAt),
  ],
);

export type StoredFondsVertCorrection = {
  dossierNumber: number;
  metricCode: string;
  revision: number;
  valueType: "number" | "text" | "boolean" | "text_array";
  value: number | string | boolean | string[];
  unit: string | null;
  correctedAt: string;
};

/** Shared admission clock for expensive machine export creation attempts. */
export const fondsVertExportAdmission = pgTable(
  "fonds_vert_export_admission",
  {
    id: integer("id").primaryKey(),
    nextAllowedAt: timestamp("next_allowed_at", { withTimezone: true }).notNull(),
  },
  (table) => [check("fonds_vert_export_admission_singleton", sql`${table.id} = 1`)],
);
