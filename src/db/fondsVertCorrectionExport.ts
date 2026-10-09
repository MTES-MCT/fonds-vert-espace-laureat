import { randomUUID } from "node:crypto";

import { and, eq, lte, sql } from "drizzle-orm";

import { getDb } from "@/db";
import { getLatestFondsVertCorrections } from "@/db/fondsVertCorrectionProjection";
import { fondsVertExportPages } from "@/db/schema";

export const MAX_EXPORT_PAGE_SIZE = 1_000;
export const MAX_EXPORT_RETENTION_MS = 7 * 24 * 60 * 60 * 1_000;

export class FondsVertExportPageError extends Error {
  constructor(public readonly code: "missing" | "expired") {
    super(`Fonds Vert export page ${code}`);
    this.name = "FondsVertExportPageError";
  }
}

function boundedInteger(value: number, max: number, name: string) {
  if (!Number.isSafeInteger(value) || value < 1 || value > max) {
    throw new RangeError(`${name} must be an integer between 1 and ${max}`);
  }
}

/** Publishes immutable pages from one statement snapshot, including an empty page. */
export async function createFondsVertCorrectionExport({
  pageSize,
  retentionMs,
}: {
  pageSize: number;
  retentionMs: number;
}) {
  boundedInteger(pageSize, MAX_EXPORT_PAGE_SIZE, "pageSize");
  boundedInteger(retentionMs, MAX_EXPORT_RETENTION_MS, "retentionMs");

  const exportId = randomUUID();
  const generatedAt = new Date();
  const corrections = (await getLatestFondsVertCorrections()).map((row) => ({
    ...row,
    correctedAt: row.correctedAt.toISOString(),
  }));
  // Retention starts after projection; publication time is part of this window.
  const expiresAt = new Date(Date.now() + retentionMs);
  const totalCount = corrections.length;
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));

  await getDb().transaction(async (tx) => {
    await tx
      .delete(fondsVertExportPages)
      .where(lte(fondsVertExportPages.expiresAt, new Date()));
    // Bound each insert independently of the total size of the export.
    for (let pageNumber = 0; pageNumber < pageCount; pageNumber++) {
      await tx.insert(fondsVertExportPages).values({
        exportId,
        pageNumber,
        generatedAt,
        expiresAt,
        totalCount,
        corrections: corrections.slice(
          pageNumber * pageSize,
          (pageNumber + 1) * pageSize,
        ),
      });
    }
  });

  return { exportId, generatedAt, expiresAt, totalCount, pageCount };
}

function pageCondition(exportId: string, pageNumber: number) {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      exportId,
    ) ||
    !Number.isSafeInteger(pageNumber) ||
    pageNumber < 0 ||
    pageNumber > 2_147_483_647
  ) {
    throw new FondsVertExportPageError("missing");
  }
  return and(
    eq(fondsVertExportPages.exportId, exportId),
    eq(fondsVertExportPages.pageNumber, pageNumber),
  );
}

function activePage<Page extends { expiresAt: Date }>(page: Page | undefined) {
  if (!page) throw new FondsVertExportPageError("missing");
  if (page.expiresAt.getTime() <= Date.now()) {
    throw new FondsVertExportPageError("expired");
  }
  return page;
}

/** Reads one stored page without scanning correction history. */
export async function readFondsVertCorrectionExportPage(
  exportId: string,
  pageNumber: number,
) {
  const condition = pageCondition(exportId, pageNumber);
  const [page] = await getDb()
    .select()
    .from(fondsVertExportPages)
    .where(condition);
  return activePage(page);
}

/** Reads the initial page length without transferring its correction payload. */
export async function readFondsVertCorrectionExportPageSize(exportId: string) {
  const condition = pageCondition(exportId, 0);
  const [page] = await getDb()
    .select({
      pageSize: sql<number>`jsonb_array_length(${fondsVertExportPages.corrections})`,
      expiresAt: fondsVertExportPages.expiresAt,
    })
    .from(fondsVertExportPages)
    .where(condition);
  return activePage(page).pageSize;
}
