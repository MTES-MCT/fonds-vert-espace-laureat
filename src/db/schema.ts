import { integer, jsonb, pgTable, timestamp } from "drizzle-orm/pg-core";

import { Metrics } from "@/services/fondsvert/dossier";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
};

export const dossierMetrics = pgTable("dossier_metrics", {
  dossierNumber: integer("dossier_number").primaryKey(),
  metrics: jsonb("metrics").$type<Metrics>().notNull(),
  ...timestamps,
});
