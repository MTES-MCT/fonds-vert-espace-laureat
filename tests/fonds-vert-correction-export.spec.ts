import { randomUUID } from "node:crypto";

import { expect, test } from "@playwright/test";

import { closeDb } from "@/db";
import {
  createFondsVertCorrectionExport,
  MAX_EXPORT_PAGE_SIZE,
  MAX_EXPORT_RETENTION_MS,
  readFondsVertCorrectionExportPage,
} from "@/db/fondsVertCorrectionExport";

import { createTestDatabaseClient } from "./setup/db";

test.describe.configure({ mode: "serial" });
let originalUrl: string;
let schema: string;
let sql: ReturnType<typeof createTestDatabaseClient>;

// Each suite owns its schema, including empty-export and failure-injection fixtures.
test.beforeAll(async () => {
  originalUrl = process.env.DATABASE_URL!;
  schema = `export_test_${randomUUID().replaceAll("-", "")}`;
  sql = createTestDatabaseClient();
  await sql.unsafe(`create schema ${schema}`);
  for (const table of ["dossier_metric_revisions", "fonds_vert_export_pages"]) {
    await sql.unsafe(
      `create table ${schema}.${table} (like public.${table} including all)`,
    );
  }
  await sql.unsafe(`set search_path to ${schema}, public`);
  await closeDb();
  const url = new URL(originalUrl);
  url.searchParams.set("options", `-c search_path=${schema},public`);
  process.env.DATABASE_URL = url.toString();
});

test.afterAll(async () => {
  await closeDb();
  process.env.DATABASE_URL = originalUrl;
  await sql.unsafe(`drop schema ${schema} cascade`);
  await sql.end();
});

test.beforeEach(async () => {
  await sql`truncate dossier_metric_revisions, fonds_vert_export_pages`;
});

async function seed(count: number) {
  await sql`
    insert into dossier_metric_revisions
      (dossier_number, metric_code, revision, label, value_type, text_array_value, created_at)
    select 89995000, 'field_' || lpad(i::text, 6, '0'), 2, 'Fixture', 'text_array',
      array['École', 'Mairie'], '2026-09-21T12:00:00Z'::timestamptz
    from generate_series(1, ${count}) as i
  `;
}

const options = { pageSize: 2, retentionMs: 60_000 };

test("stores all pages in order and replays typed immutable corrections", async () => {
  await seed(5);
  const exported = await createFondsVertCorrectionExport(options);
  expect(exported.totalCount).toBe(5);
  expect(exported.pageCount).toBe(3);
  const pages = await Promise.all(
    [0, 1, 2].map((n) =>
      readFondsVertCorrectionExportPage(exported.exportId, n),
    ),
  );
  expect(pages.map((p) => p.corrections.length)).toEqual([2, 2, 1]);
  expect(pages.flatMap((p) => p.corrections.map((c) => c.metricCode))).toEqual(
    [1, 2, 3, 4, 5].map((n) => `field_${String(n).padStart(6, "0")}`),
  );
  expect(pages[0].corrections[0]).toMatchObject({
    value: ["École", "Mairie"],
    correctedAt: "2026-09-21T12:00:00.000Z",
  });
  await sql`insert into dossier_metric_revisions
    (dossier_number, metric_code, revision, label, value_type, text_value)
    values (89995000, 'field_000001', 3, 'Fixture', 'text', 'Updated')`;
  expect(await readFondsVertCorrectionExportPage(exported.exportId, 0)).toEqual(
    pages[0],
  );
  const next = await createFondsVertCorrectionExport(options);
  expect(
    (await readFondsVertCorrectionExportPage(next.exportId, 0)).corrections[0]
      .value,
  ).toBe("Updated");
  await expect(
    readFondsVertCorrectionExportPage(exported.exportId, 3),
  ).rejects.toMatchObject({ code: "missing" });
});

test("distinguishes successful empty exports from missing pages", async () => {
  const exported = await createFondsVertCorrectionExport(options);
  expect(exported).toMatchObject({ totalCount: 0, pageCount: 1 });
  expect(
    (await readFondsVertCorrectionExportPage(exported.exportId, 0)).corrections,
  ).toEqual([]);
  for (const [id, page] of [
    [randomUUID(), 0],
    ["invalid", 0],
    [exported.exportId, -1],
    [exported.exportId, 0.5],
  ] as const) {
    await expect(
      readFondsVertCorrectionExportPage(id, page),
    ).rejects.toMatchObject({ code: "missing" });
  }
});

test("rejects expired pages and cleans them at the next creation only", async () => {
  const expired = await createFondsVertCorrectionExport(options);
  await sql`update fonds_vert_export_pages set expires_at = now() - interval '1 second' where export_id = ${expired.exportId}`;
  await expect(
    readFondsVertCorrectionExportPage(expired.exportId, 0),
  ).rejects.toMatchObject({ code: "expired" });
  expect(await sql`select * from fonds_vert_export_pages`).toHaveLength(1);
  const active = await createFondsVertCorrectionExport(options);
  expect(await sql`select export_id from fonds_vert_export_pages`).toEqual([
    { export_id: active.exportId },
  ]);
  await expect(
    readFondsVertCorrectionExportPage(expired.exportId, 0),
  ).rejects.toMatchObject({ code: "missing" });
});

test("rolls back every page and cleanup when a later insert fails", async () => {
  const expired = await createFondsVertCorrectionExport(options);
  await sql`update fonds_vert_export_pages set expires_at = now() - interval '1 second'`;
  await seed(5);
  await sql`alter table fonds_vert_export_pages add constraint injected_failure check (page_number < 1)`;
  try {
    await expect(createFondsVertCorrectionExport(options)).rejects.toThrow();
    expect(await sql`select export_id from fonds_vert_export_pages`).toEqual([
      { export_id: expired.exportId },
    ]);
  } finally {
    await sql`alter table fonds_vert_export_pages drop constraint injected_failure`;
  }
});

test("concurrent corrections cannot split a snapshot and creations stay independent", async () => {
  await seed(5);
  const results = await Promise.all([
    createFondsVertCorrectionExport(options),
    createFondsVertCorrectionExport({ ...options, pageSize: 3 }),
    sql`insert into dossier_metric_revisions
      (dossier_number, metric_code, revision, label, value_type, text_value)
      select dossier_number, metric_code, 3, label, 'text', 'Concurrent'
      from dossier_metric_revisions where revision = 2`,
  ]);
  expect(results[0].exportId).not.toBe(results[1].exportId);
  for (const exported of results.slice(0, 2) as (typeof results)[0][]) {
    const pages = await Promise.all(
      Array.from({ length: exported.pageCount }, (_, n) =>
        readFondsVertCorrectionExportPage(exported.exportId, n),
      ),
    );
    const corrections = pages.flatMap((p) => p.corrections);
    expect(corrections).toHaveLength(5);
    expect(new Set(corrections.map((c) => c.revision)).size).toBe(1);
  }
  const next = await createFondsVertCorrectionExport(options);
  expect(
    (
      await readFondsVertCorrectionExportPage(next.exportId, 0)
    ).corrections.every((c) => c.revision === 3),
  ).toBe(true);
});

test("bounds caller parameters before publishing anything", async () => {
  for (const pageSize of [0, -1, 1.5, NaN, MAX_EXPORT_PAGE_SIZE + 1]) {
    await expect(
      createFondsVertCorrectionExport({ ...options, pageSize }),
    ).rejects.toThrow(RangeError);
  }
  for (const retentionMs of [0, Infinity, 1.5, MAX_EXPORT_RETENTION_MS + 1]) {
    await expect(
      createFondsVertCorrectionExport({ ...options, retentionMs }),
    ).rejects.toThrow(RangeError);
  }
  expect(await sql`select * from fonds_vert_export_pages`).toHaveLength(0);
});

test("measures synthetic preparation and uses the page key for indexed reads", async () => {
  await seed(10_000);
  const before = process.memoryUsage().heapUsed;
  const start = performance.now();
  const exported = await createFondsVertCorrectionExport({
    pageSize: 100,
    retentionMs: 60_000,
  });
  const preparationMs = performance.now() - start;
  const heapDeltaBytes = process.memoryUsage().heapUsed - before;
  const readStart = performance.now();
  expect(
    (await readFondsVertCorrectionExportPage(exported.exportId, 50))
      .corrections,
  ).toHaveLength(100);
  const readMs = performance.now() - readStart;
  const [storage] =
    await sql`select sum(pg_column_size(corrections))::int as bytes from fonds_vert_export_pages`;
  await sql`analyze fonds_vert_export_pages`;
  const plan =
    await sql`explain (format json) select * from fonds_vert_export_pages where export_id = ${exported.exportId} and page_number = 50`;
  const planText = JSON.stringify(plan);
  expect(planText).toContain("Index");
  expect(exported).toMatchObject({ totalCount: 10_000, pageCount: 100 });
  console.log(
    JSON.stringify({
      syntheticCorrections: 10_000,
      preparationMs,
      readMs,
      heapDeltaBytes,
      storedJsonBytes: storage.bytes,
    }),
  );
});

test("keeps pages invisible until commit while later corrections wait for the next export", async () => {
  await seed(5);
  const lockId = Math.floor(Math.random() * 2_000_000_000);
  await sql`select pg_advisory_lock(${lockId})`;
  await sql.unsafe(`create function ${schema}.pause_export() returns trigger language plpgsql as $$
    begin
      if NEW.page_number = 1 then perform pg_advisory_xact_lock(${lockId}); end if;
      return NEW;
    end $$`);
  await sql.unsafe(`create trigger pause_export before insert on fonds_vert_export_pages
    for each row execute function ${schema}.pause_export()`);
  const pending = createFondsVertCorrectionExport(options);
  try {
    await expect
      .poll(async () => {
        const [row] =
          await sql`select count(*)::int as count from pg_locks where locktype = 'advisory' and objid = ${lockId} and not granted`;
        return row.count;
      })
      .toBe(1);
    expect(await sql`select * from fonds_vert_export_pages`).toHaveLength(0);
    await sql`insert into dossier_metric_revisions
      (dossier_number, metric_code, revision, label, value_type, text_value)
      select dossier_number, metric_code, 3, label, 'text', 'After projection'
      from dossier_metric_revisions where revision = 2`;
  } finally {
    await sql`select pg_advisory_unlock(${lockId})`;
    await pending;
    await sql`drop trigger pause_export on fonds_vert_export_pages`;
    await sql.unsafe(`drop function ${schema}.pause_export()`);
  }
  const exported = await pending;
  const pages = await Promise.all(
    [0, 1, 2].map((n) =>
      readFondsVertCorrectionExportPage(exported.exportId, n),
    ),
  );
  expect(
    pages.flatMap((p) => p.corrections).every((c) => c.revision === 2),
  ).toBe(true);
  const next = await createFondsVertCorrectionExport(options);
  expect(
    (
      await readFondsVertCorrectionExportPage(next.exportId, 0)
    ).corrections.every((c) => c.revision === 3),
  ).toBe(true);
});
