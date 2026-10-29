import { asc, desc, eq, inArray, sql } from "drizzle-orm";

import { getDb } from "@/db";
import { dossierProgressRevisions } from "@/db/schema";
import {
  type DossierProgressStatus,
  isDossierProgressStatus,
  requiresProgressConfirmation,
} from "@/utils/dossierProgress";

export type DossierProgressTarget = {
  revision: number;
  status: DossierProgressStatus | null;
  updatedAt: string | null;
};

const emptyProgress: DossierProgressTarget = {
  revision: 0,
  status: null,
  updatedAt: null,
};
const progressSelection = {
  revision: dossierProgressRevisions.revision,
  status: dossierProgressRevisions.status,
  createdAt: dossierProgressRevisions.createdAt,
};

function targetFromRow(
  row:
    | { revision: number; status: DossierProgressStatus; createdAt: Date }
    | undefined,
): DossierProgressTarget {
  return row
    ? {
        revision: row.revision,
        status: row.status,
        updatedAt: row.createdAt.toISOString(),
      }
    : emptyProgress;
}

export class DossierProgressError extends Error {
  constructor(
    public readonly code: "invalid-status" | "confirmation-required",
    message: string,
  ) {
    super(message);
    this.name = "DossierProgressError";
  }
}

export class DossierProgressConflict extends Error {
  constructor(public readonly target: DossierProgressTarget) {
    super(
      "L’avancement a été modifié depuis l’ouverture de l’éditeur. L’avancement actuel a été chargé. Vérifiez-le avant de le modifier à nouveau.",
    );
    this.name = "DossierProgressConflict";
  }
}

export async function getDossierProgress({
  numeroDossier,
}: {
  numeroDossier: number;
}): Promise<DossierProgressTarget> {
  const [row] = await getDb()
    .select(progressSelection)
    .from(dossierProgressRevisions)
    .where(eq(dossierProgressRevisions.dossierNumber, numeroDossier))
    .orderBy(desc(dossierProgressRevisions.revision))
    .limit(1);
  return targetFromRow(row);
}

export async function getDossiersProgress({
  dossierNumbers,
}: {
  dossierNumbers: number[];
}): Promise<Record<number, DossierProgressTarget>> {
  if (dossierNumbers.length === 0) return {};
  const rows = await getDb()
    .selectDistinctOn([dossierProgressRevisions.dossierNumber], {
      dossierNumber: dossierProgressRevisions.dossierNumber,
      ...progressSelection,
    })
    .from(dossierProgressRevisions)
    .where(inArray(dossierProgressRevisions.dossierNumber, dossierNumbers))
    .orderBy(
      asc(dossierProgressRevisions.dossierNumber),
      desc(dossierProgressRevisions.revision),
    );
  const targets = Object.fromEntries(
    dossierNumbers.map((number) => [number, emptyProgress]),
  );
  for (const row of rows) targets[row.dossierNumber] = targetFromRow(row);
  return targets;
}

export async function appendDossierProgressRevision({
  numeroDossier,
  status,
  expectedRevision,
  authorEmail,
  confirmed,
}: {
  numeroDossier: number;
  status: unknown;
  expectedRevision: number;
  authorEmail: string | null;
  confirmed: boolean;
}): Promise<DossierProgressTarget> {
  if (!isDossierProgressStatus(status)) {
    throw new DossierProgressError("invalid-status", "Avancement invalide");
  }

  return getDb().transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(${numeroDossier})`);
    const [row] = await tx
      .select(progressSelection)
      .from(dossierProgressRevisions)
      .where(eq(dossierProgressRevisions.dossierNumber, numeroDossier))
      .orderBy(desc(dossierProgressRevisions.revision))
      .limit(1);
    const target = targetFromRow(row);

    if (target.revision !== expectedRevision)
      throw new DossierProgressConflict(target);
    if (target.status === status) return target;
    if (requiresProgressConfirmation(status) && !confirmed) {
      throw new DossierProgressError(
        "confirmation-required",
        "Confirmez le passage à cet avancement",
      );
    }

    const [inserted] = await tx
      .insert(dossierProgressRevisions)
      .values({
        dossierNumber: numeroDossier,
        revision: target.revision + 1,
        status,
        authorEmail,
      })
      .returning(progressSelection);
    return targetFromRow(inserted);
  });
}

export async function resetDossierProgress({
  numeroDossier,
}: {
  numeroDossier: number;
}): Promise<void> {
  await getDb().transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(${numeroDossier})`);
    await tx
      .delete(dossierProgressRevisions)
      .where(eq(dossierProgressRevisions.dossierNumber, numeroDossier));
  });
}
