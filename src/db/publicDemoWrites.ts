import { and, gt, inArray, sql } from "drizzle-orm";

import { getDb } from "@/db";
import { dossierMetricRevisions, dossierProgressRevisions } from "@/db/schema";
import { DEMO_DOSSIER_NUMBERS } from "@/utils/demo/reservation";

export const DEMO_WRITE_INTERVAL_SECONDS = 2;
export const DEMO_MAX_REVISIONS = 100;
export const DEMO_REVISION_LIMIT_MESSAGE =
  "La limite de révisions est atteinte. Réinitialisez la démonstration pour continuer.";

export async function admitDemoWrite() {
  const rows = await getDb().execute(sql`
    insert into fonds_vert_export_admission (id, next_allowed_at)
    values (3, clock_timestamp() + make_interval(secs => ${DEMO_WRITE_INTERVAL_SECONDS}))
    on conflict (id) do update
      set next_allowed_at = clock_timestamp() + make_interval(secs => ${DEMO_WRITE_INTERVAL_SECONDS})
      where fonds_vert_export_admission.next_allowed_at <= clock_timestamp()
    returning id
  `);
  return rows.length > 0;
}

export async function resetDemoCatalogue() {
  const numbers = [...DEMO_DOSSIER_NUMBERS];
  await getDb().transaction(async (tx) => {
    for (const number of numbers) {
      await tx.execute(sql`select pg_advisory_xact_lock(${number})`);
    }
    await tx
      .delete(dossierMetricRevisions)
      .where(
        and(
          inArray(dossierMetricRevisions.dossierNumber, numbers),
          gt(dossierMetricRevisions.revision, 1),
        ),
      );
    await tx
      .delete(dossierProgressRevisions)
      .where(inArray(dossierProgressRevisions.dossierNumber, numbers));
  });
}
