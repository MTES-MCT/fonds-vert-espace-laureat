import { randomUUID } from "node:crypto";

import { type APIResponse, expect, test } from "@playwright/test";
import { sealData } from "iron-session";

import { correctionAccess } from "@/api/corrections-access";
import type { components } from "@/api/generated/corrections-api";

import { createTestDatabaseClient } from "./setup/db";

type Page = components["schemas"]["CorrectionPage"];
const key = "synthetic_current_key_000000000000000000000000";
const oldKey = "synthetic_previous_key_00000000000000000000000";
const ingress = "synthetic_ingress_key_000000000000000000000000";
const endpoint = "/api/v1/corrections";
const headers = {
  authorization: `Bearer ${key}`,
  "x-corrections-ingress": ingress,
  "x-corrections-client-ip": "192.0.2.10",
  "x-corrections-proto": "https",
};
const profile = process.env.CORRECTIONS_TEST_PROFILE;

async function errorResponse(
  response: APIResponse,
  status: number,
  error: string,
) {
  expect(response.status()).toBe(status);
  expect(response.headers()["cache-control"]).toBe("no-store");
  expect(await response.json()).toEqual({ error });
}

async function pageResponse(response: APIResponse): Promise<Page> {
  expect(response.status()).toBe(200);
  expect(response.headers()["cache-control"]).toBe("no-store");
  const body = await response.json();
  expect(Object.keys(body).sort()).toEqual(
    [
      "corrections",
      "next_cursor",
      "generated_at",
      "expires_at",
      "total_count",
    ].sort(),
  );
  for (const correction of body.corrections) {
    expect(Object.keys(correction).sort()).toEqual(
      ["dossier_number", "champ", "valeur_corrigee", "date_correction"].sort(),
    );
  }
  return body;
}

// This probe is also run after fresh server starts with incomplete configuration
// and after revoking the previous key. It never accesses the database.
test("HTTP configuration and rotation probe", async ({ request }) => {
  const response = await request.get(`${endpoint}?invalid=1`, { headers });
  if (!profile || profile === "closed") {
    await errorResponse(response, 503, "unavailable");
  } else {
    await errorResponse(response, 400, "invalid_request");
    const previous = await request.get(`${endpoint}?invalid=1`, {
      headers: { ...headers, authorization: `Bearer ${oldKey}` },
    });
    await errorResponse(
      previous,
      profile === "revoked" ? 401 : 400,
      profile === "revoked" ? "unauthorized" : "invalid_request",
    );
  }
});

test("unsupported methods never create an export", async ({ request }) => {
  for (const method of ["HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]) {
    const response = await request.fetch(endpoint, { method, headers });
    expect(response.status()).toBe(405);
    expect(response.headers()["cache-control"]).toBe("no-store");
    expect(response.headers().allow).toBe("GET");
  }
});

test("access configuration fails closed for each missing or malformed setting", () => {
  const valid = {
    CORRECTIONS_API_ENABLED: "true",
    CORRECTIONS_INGRESS_VERIFIED: "true",
    CORRECTIONS_API_KEY: key,
    CORRECTIONS_API_PREVIOUS_KEY: oldKey,
    CORRECTIONS_INGRESS_SECRET: ingress,
    CORRECTIONS_ALLOWED_IPS: "192.0.2.10,2001:db8::10",
  };
  const saved = Object.fromEntries(
    Object.keys(valid).map((name) => [name, process.env[name]]),
  );
  const check = () =>
    correctionAccess(
      new Request(`https://example.test${endpoint}`, { headers }),
    );
  try {
    Object.assign(process.env, valid);
    expect(check()).toBeNull();
    for (const name of Object.keys(valid).filter(
      (name) => name !== "CORRECTIONS_API_PREVIOUS_KEY",
    )) {
      delete process.env[name];
      expect(check(), name).toBe(503);
      Object.assign(process.env, valid);
    }
    for (const [name, value] of [
      ["CORRECTIONS_API_ENABLED", "1"],
      ["CORRECTIONS_INGRESS_VERIFIED", "false"],
      ["CORRECTIONS_API_KEY", "short"],
      ["CORRECTIONS_API_PREVIOUS_KEY", ""],
      ["CORRECTIONS_INGRESS_SECRET", key],
      ["CORRECTIONS_ALLOWED_IPS", "192.0.2.10,"],
      ["CORRECTIONS_ALLOWED_IPS", "192.0.2.0/24"],
      ["CORRECTIONS_ALLOWED_IPS", "garbage"],
      ["CORRECTIONS_ALLOWED_IPS", "fe80::1%en0"],
    ]) {
      process.env[name] = value;
      expect(check(), name).toBe(503);
      Object.assign(process.env, valid);
    }
  } finally {
    for (const [name, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
});

test.describe("configured machine HTTP API", () => {
  test.describe.configure({ mode: "serial" });
  test.skip(
    profile !== "enabled",
    "Run the isolated API profile against a fresh test database.",
  );
  let sql: ReturnType<typeof createTestDatabaseClient>;
  test.beforeAll(() => {
    expect(new URL(process.env.DATABASE_URL!).pathname).toMatch(/_test$/);
    sql = createTestDatabaseClient();
  });
  test.afterAll(async () => {
    await sql?.end();
  });
  test.beforeEach(async () => {
    await sql`truncate dossier_metric_revisions, fonds_vert_export_pages, fonds_vert_export_admission`;
  });

  async function seed(count: number) {
    await sql`insert into dossier_metric_revisions
      (dossier_number, metric_code, revision, label, value_type, text_array_value, created_at)
      select 89996000, 'field_' || lpad(i::text, 6, '0'), 2, 'Synthetic', 'text_array',
        array['École', 'Mairie'], '2026-09-21T12:00:00Z'::timestamptz
      from generate_series(1, ${count}) as i`;
  }

  test("rejects missing, wrong, duplicate keys and a valid ProConnect session alone", async ({
    request,
  }) => {
    const cookie = await sealData(
      { user: { email: "alice.doe@example.com" } },
      {
        password: process.env.IRON_SESSION_PWD!,
        ttl: 3600,
      },
    );
    for (const authorization of [
      "",
      "Bearer wrong",
      `Bearer ${"x".repeat(43)}`,
      `Bearer ${key}, Bearer ${key}`,
      `Basic ${key}`,
    ]) {
      const response = await request.get(endpoint, {
        headers: {
          ...headers,
          authorization,
          cookie: `fonds-vert-espace-laureat=${cookie}`,
        },
      });
      await errorResponse(response, 401, "unauthorized");
      expect(response.headers()["www-authenticate"]).toBe("Bearer");
    }
    expect(await sql`select * from fonds_vert_export_admission`).toHaveLength(
      0,
    );
  });

  test("accepts both rotation keys and canonical IPv6 but rejects spoofed origins", async ({
    request,
  }) => {
    for (const authorization of [`Bearer ${key}`, `Bearer ${oldKey}`]) {
      await errorResponse(
        await request.get(`${endpoint}?unknown=1`, {
          headers: { ...headers, authorization },
        }),
        400,
        "invalid_request",
      );
    }
    await errorResponse(
      await request.get(`${endpoint}?unknown=1`, {
        headers: {
          ...headers,
          "x-corrections-client-ip": "2001:0db8:0:0:0:0:0:10",
        },
      }),
      400,
      "invalid_request",
    );
    const originChanges: Record<string, string>[] = [
      { "x-corrections-ingress": "" },
      { "x-corrections-ingress": "wrong" },
      {
        "x-corrections-client-ip": "198.51.100.20",
        "x-forwarded-for": "192.0.2.10",
      },
      {
        "x-corrections-client-ip": "",
        "x-forwarded-for": "192.0.2.10",
        "x-real-ip": "192.0.2.10",
      },
      { "x-corrections-client-ip": "192.0.2.10, 198.51.100.20" },
      { "x-corrections-client-ip": "192.0.2.10:443" },
      { "x-corrections-client-ip": "2001:db8::11" },
      { "x-corrections-proto": "http", "x-forwarded-proto": "https" },
      { "x-corrections-proto": "https,http" },
    ];
    for (const changes of originChanges) {
      await errorResponse(
        await request.get(endpoint, { headers: { ...headers, ...changes } }),
        403,
        "forbidden",
      );
    }
    expect(await sql`select * from fonds_vert_export_admission`).toHaveLength(
      0,
    );
  });

  test("validates bounds, duplicate parameters and cursor syntax before database admission", async ({
    request,
  }) => {
    for (const query of [
      "page_size=0",
      "page_size=-1",
      "page_size=1001",
      "page_size=1.5",
      "page_size=01",
      "page_size=1e2",
      "page_size=",
      "page_size=2&page_size=2",
      "unexpected=1",
      "cursor=",
      "cursor=garbage",
      `cursor=${randomUUID()}:2147483648`,
      `cursor=${randomUUID()}:-1`,
      `cursor=${randomUUID()}:01`,
      `cursor=${randomUUID()}:0&page_size=2`,
      `cursor=${randomUUID()}:0&cursor=${randomUUID()}:0`,
    ]) {
      await errorResponse(
        await request.get(`${endpoint}?${query}`, { headers }),
        400,
        "invalid_request",
      );
    }
    await errorResponse(
      await request.get(`${endpoint}?cursor=${randomUUID()}:0`, { headers }),
      404,
      "missing",
    );
    expect(await sql`select * from fonds_vert_export_admission`).toHaveLength(
      0,
    );
  });

  test("traverses and replays immutable pages after a newer correction", async ({
    request,
  }) => {
    await seed(5);
    await sql`insert into dossier_metric_revisions
      (dossier_number, metric_code, revision, label, value_type, number_value, boolean_value, text_value)
      values (89996000, 'number', 2, 'Synthetic', 'number', 12.5, null, null),
      (89996000, 'boolean', 2, 'Synthetic', 'boolean', null, false, null),
      (89996000, 'text', 2, 'Synthetic', 'text', null, null, 'École')`;
    const first = await pageResponse(
      await request.get(`${endpoint}?page_size=3`, { headers }),
    );
    expect(first.total_count).toBe(8);
    expect(
      Date.parse(first.expires_at) - Date.parse(first.generated_at),
    ).toBeGreaterThanOrEqual(86_400_000);
    await sql`insert into dossier_metric_revisions
      (dossier_number, metric_code, revision, label, value_type, text_value)
      values (89996000, 'field_000001', 3, 'Synthetic', 'text', 'Updated')`;
    const corrections = [...first.corrections];
    let cursor = first.next_cursor;
    const sizes = [first.corrections.length];
    while (cursor) {
      const url = `${endpoint}?cursor=${encodeURIComponent(cursor)}`;
      const page = await pageResponse(await request.get(url, { headers }));
      expect(await pageResponse(await request.get(url, { headers }))).toEqual(
        page,
      );
      expect(page.generated_at).toBe(first.generated_at);
      expect(page.total_count).toBe(first.total_count);
      await errorResponse(
        await request.get(url, { headers: { ...headers, authorization: "" } }),
        401,
        "unauthorized",
      );
      await errorResponse(
        await request.get(url, {
          headers: { ...headers, "x-corrections-client-ip": "198.51.100.20" },
        }),
        403,
        "forbidden",
      );
      corrections.push(...page.corrections);
      sizes.push(page.corrections.length);
      cursor = page.next_cursor;
      expect(sizes.length).toBeLessThan(5);
    }
    expect(sizes).toEqual([3, 3, 2]);
    expect(
      corrections.find((c) => c.champ === "field_000001")?.valeur_corrigee,
    ).toEqual(["École", "Mairie"]);
    expect(corrections.find((c) => c.champ === "number")?.valeur_corrigee).toBe(
      12.5,
    );
    expect(
      corrections.find((c) => c.champ === "boolean")?.valeur_corrigee,
    ).toBe(false);
    expect(corrections.find((c) => c.champ === "text")?.valeur_corrigee).toBe(
      "École",
    );
    const id = first.next_cursor!.split(":")[0];
    expect(
      await pageResponse(
        await request.get(`${endpoint}?cursor=${id}:0`, { headers }),
      ),
    ).toEqual(first);
    await sql`update fonds_vert_export_admission set next_allowed_at = now() - interval '1 second'`;
    const updated = await pageResponse(
      await request.get(endpoint, { headers }),
    );
    expect(
      updated.corrections.find((c) => c.champ === "field_000001")
        ?.valeur_corrigee,
    ).toBe("Updated");
  });

  test("returns an empty export, expiration and cleanup as distinct outcomes", async ({
    request,
  }) => {
    const empty = await pageResponse(await request.get(endpoint, { headers }));
    expect(empty).toMatchObject({
      corrections: [],
      total_count: 0,
      next_cursor: null,
    });
    const [row] = await sql`select export_id from fonds_vert_export_pages`;
    await sql`update fonds_vert_export_pages set expires_at = now() - interval '1 second'`;
    await errorResponse(
      await request.get(`${endpoint}?cursor=${row.export_id}:0`, { headers }),
      410,
      "expired",
    );
    await sql`update fonds_vert_export_admission set next_allowed_at = now() - interval '1 second'`;
    await pageResponse(await request.get(endpoint, { headers }));
    await errorResponse(
      await request.get(`${endpoint}?cursor=${row.export_id}:0`, { headers }),
      404,
      "missing",
    );
  });

  test("coordinates concurrent creation and leaves stored pages readable during cooldown", async ({
    request,
  }) => {
    await seed(3);
    const responses = await Promise.all(
      Array.from({ length: 6 }, () =>
        request.get(`${endpoint}?page_size=1`, { headers }),
      ),
    );
    expect(
      responses.filter((response) => response.status() === 200),
    ).toHaveLength(1);
    for (const response of responses.filter(
      (response) => response.status() !== 200,
    )) {
      await errorResponse(response, 429, "rate_limited");
      expect(response.headers()["retry-after"]).toBe("60");
    }
    const successful = responses.find((response) => response.status() === 200)!;
    const first = await pageResponse(successful);
    await pageResponse(
      await request.get(`${endpoint}?cursor=${first.next_cursor}`, { headers }),
    );
    expect(
      await sql`select distinct export_id from fonds_vert_export_pages`,
    ).toHaveLength(1);
  });

  test("fails explicitly on SQL read and publication errors without leaking details", async ({
    request,
  }) => {
    await seed(3);
    await sql`alter table fonds_vert_export_pages add constraint api_injected_failure check (page_number < 1)`;
    try {
      await errorResponse(
        await request.get(`${endpoint}?page_size=1`, { headers }),
        503,
        "unavailable",
      );
      expect(await sql`select * from fonds_vert_export_pages`).toHaveLength(0);
      await errorResponse(
        await request.get(endpoint, { headers }),
        429,
        "rate_limited",
      );
    } finally {
      await sql`alter table fonds_vert_export_pages drop constraint api_injected_failure`;
    }
    await sql`alter table fonds_vert_export_pages rename to api_unavailable_pages`;
    try {
      await errorResponse(
        await request.get(`${endpoint}?cursor=${randomUUID()}:0`, { headers }),
        503,
        "unavailable",
      );
      await errorResponse(
        await request.get(endpoint, {
          headers: { ...headers, authorization: "" },
        }),
        401,
        "unauthorized",
      );
    } finally {
      await sql`alter table api_unavailable_pages rename to fonds_vert_export_pages`;
    }
  });

  test("measures synthetic HTTP export and page replay at 10000 corrections", async ({
    request,
  }) => {
    await seed(10_000);
    const start = performance.now();
    const first = await pageResponse(
      await request.get(`${endpoint}?page_size=100`, { headers }),
    );
    const creationMs = performance.now() - start;
    expect(first.total_count).toBe(10_000);
    const samples: number[] = [];
    let bytes = 0;
    for (let i = 0; i < 20; i++) {
      const before = performance.now();
      const response = await request.get(
        `${endpoint}?cursor=${first.next_cursor}`,
        { headers },
      );
      const page = await pageResponse(response);
      samples.push(performance.now() - before);
      bytes = (await response.body()).length;
      expect(page.corrections).toHaveLength(100);
    }
    samples.sort((a, b) => a - b);
    const [storage] =
      await sql`select pg_total_relation_size('fonds_vert_export_pages')::int as bytes`;
    console.log(
      JSON.stringify({
        syntheticHttpCorrections: 10000,
        pageSize: 100,
        replayRequests: samples.length,
        creationMs,
        replayMedianMs: samples[10],
        replayP95Ms: samples[18],
        responseBytes: bytes,
        totalPageStorageBytes: storage.bytes,
        node: process.version,
        platform: process.platform,
        architecture: process.arch,
      }),
    );
  });
});
