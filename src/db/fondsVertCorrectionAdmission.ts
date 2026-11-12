import { sql } from "drizzle-orm";

import { getDb } from "@/db";
import { createFondsVertCorrectionExport } from "@/db/fondsVertCorrectionExport";

export const CORRECTION_EXPORT_INTERVAL_SECONDS = 60;

export class CorrectionExportBusyError extends Error {}

/** One creation at a time across instances, at most one attempt per minute. */
export async function createAdmittedCorrectionExport(
  pageSize: number,
  demo = false,
) {
  // Commit the clock independently: failed publication must consume admission too.
  const admitted = await getDb().execute(sql`
    insert into fonds_vert_export_admission (id, next_allowed_at)
    values (${demo ? 2 : 1}, clock_timestamp() + make_interval(secs => ${CORRECTION_EXPORT_INTERVAL_SECONDS}))
    on conflict (id) do update
      set next_allowed_at = clock_timestamp() + make_interval(secs => ${CORRECTION_EXPORT_INTERVAL_SECONDS})
      where fonds_vert_export_admission.next_allowed_at <= clock_timestamp()
    returning id
  `);
  if (admitted.length === 0) throw new CorrectionExportBusyError();
  return getDb().transaction(async (lockTransaction) => {
    const [lock] = await lockTransaction.execute<{ acquired: boolean }>(
      sql`select pg_try_advisory_xact_lock(192837465, ${demo ? 29 : 28}) as acquired`,
    );
    if (!lock.acquired) throw new CorrectionExportBusyError();

    return createFondsVertCorrectionExport({
      pageSize,
      demo,
      transaction: lockTransaction,
      retentionMs: 24 * 60 * 60 * 1_000,
    });
  });
}
