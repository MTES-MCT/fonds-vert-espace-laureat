import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
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
