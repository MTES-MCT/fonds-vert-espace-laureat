import { expect, test } from "@playwright/test";

import { closeDb } from "@/db";
import {
  appendDossierMetricRevision,
  DossierMetricRevisionConflict,
  getDossierMetricRevisionTargets,
  getDossierMetricsSnapshot,
  getDossierMetricsState,
  importDossierMetricsIfMissing,
} from "@/db/dossierMetrics";
import { getLatestFondsVertCorrections } from "@/db/fondsVertCorrectionProjection";

import {
  createTestDatabaseClient,
  deleteStoredDossierMetrics,
} from "./setup/db";

const BASE_DOSSIER_NUMBER = 89990000;

test("measures sequential correction writes and the Fonds Vert projection", async ({}, testInfo) => {
  const dossierNumber = 89997032 + testInfo.parallelIndex;
  const durations = { writes: [] as number[], projections: [] as number[] };

  try {
    await importDossierMetricsIfMissing({
      numeroDossier: dossierNumber,
      metrics: {
        measured: { label: "Métrique mesurée", unite: "ha", valeur_estimee: 0 },
      },
    });

    for (let value = 1; value <= 30; value += 1) {
      const writeStartedAt = performance.now();
      const target = await appendDossierMetricRevision({
        authorEmail: "metric-author@example.com",
        numeroDossier: dossierNumber,
        metricCode: "measured",
        value,
        expectedRevision: value,
      });
      durations.writes.push(performance.now() - writeStartedAt);
      expect(target.revision).toBe(value + 1);

      const projectionStartedAt = performance.now();
      const corrections = await getLatestFondsVertCorrections();
      durations.projections.push(performance.now() - projectionStartedAt);
      expect(
        corrections.find(
          (correction) => correction.dossierNumber === dossierNumber,
        ),
      ).toMatchObject({ metricCode: "measured", value, revision: value + 1 });
    }

    const summary = Object.fromEntries(
      Object.entries(durations).map(([operation, samples]) => {
        const ordered = [...samples].sort((left, right) => left - right);
        return [
          operation,
          {
            samples: ordered.length,
            medianMs: ordered[14],
            p95Ms: ordered[28],
          },
        ];
      }),
    );
    console.log(
      "Metric performance (local PostgreSQL):",
      JSON.stringify(summary),
    );
    await testInfo.attach("metric-performance.json", {
      body: JSON.stringify(summary),
      contentType: "application/json",
    });
  } finally {
    await deleteStoredDossierMetrics(dossierNumber);
  }
});

test("requires PostgreSQL to read the metric import state", async () => {
  const databaseUrl = process.env.DATABASE_URL;
  await closeDb();
  delete process.env.DATABASE_URL;

  try {
    await expect(
      getDossierMetricsState({ numeroDossier: BASE_DOSSIER_NUMBER }),
    ).rejects.toThrow("DATABASE_URL is required");
  } finally {
    process.env.DATABASE_URL = databaseUrl;
  }
});

test("requires PostgreSQL to import metrics", async () => {
  const databaseUrl = process.env.DATABASE_URL;
  await closeDb();
  delete process.env.DATABASE_URL;

  try {
    await expect(
      importDossierMetricsIfMissing({
        numeroDossier: BASE_DOSSIER_NUMBER,
        metrics: {
          metric: {
            label: "Métrique",
            unite: null,
            valeur_estimee: 1,
          },
        },
      }),
    ).rejects.toThrow("DATABASE_URL is required");
  } finally {
    process.env.DATABASE_URL = databaseUrl;
  }
});

test.afterEach(async ({}, testInfo) => {
  await deleteStoredDossierMetrics(
    BASE_DOSSIER_NUMBER + testInfo.parallelIndex,
  );
});

test("stores and reads the four typed metric values", async ({}, testInfo) => {
  const dossierNumber = BASE_DOSSIER_NUMBER + testInfo.parallelIndex;

  await importDossierMetricsIfMissing({
    numeroDossier: dossierNumber,
    metrics: {
      exact_number: {
        label: "Nombre exact",
        unite: "ha",
        valeur_estimee: 123.45,
      },
      text: {
        label: "Texte",
        unite: null,
        valeur_estimee: "valeur",
      },
      boolean: {
        label: "Booléen",
        unite: null,
        valeur_estimee: false,
      },
      text_array: {
        label: "Tableau",
        unite: null,
        valeur_estimee: ["un", "deux"],
      },
    },
  });

  await expect(
    getDossierMetricsState({ numeroDossier: dossierNumber }),
  ).resolves.toEqual({
    status: "imported",
    metrics: {
      boolean: {
        label: "Booléen",
        unite: null,
        valeur_estimee: false,
      },
      exact_number: {
        label: "Nombre exact",
        unite: "ha",
        valeur_estimee: 123.45,
      },
      text: {
        label: "Texte",
        unite: null,
        valeur_estimee: "valeur",
      },
      text_array: {
        label: "Tableau",
        unite: null,
        valeur_estimee: ["un", "deux"],
      },
    },
  });

  const sql = createTestDatabaseClient();
  try {
    const [row] = await sql<{ number_value: string }[]>`
      select number_value::text as number_value
      from dossier_metric_revisions
      where dossier_number = ${dossierNumber}
        and metric_code = 'exact_number'
    `;
    expect(row.number_value).toBe("123.45");
  } finally {
    await sql.end();
  }
});

test("rejects revisions with a mismatched or missing typed value", async ({}, testInfo) => {
  const dossierNumber = BASE_DOSSIER_NUMBER + testInfo.parallelIndex;
  const sql = createTestDatabaseClient();

  try {
    await expect(
      sql`
        insert into dossier_metric_revisions (
          dossier_number,
          metric_code,
          revision,
          label,
          value_type,
          number_value,
          text_value
        )
        values (
          ${dossierNumber},
          'invalid_multiple',
          1,
          'Invalide',
          'number',
          1,
          'unexpected'
        )
      `,
    ).rejects.toThrow();

    await expect(
      sql`
        insert into dossier_metric_revisions (
          dossier_number,
          metric_code,
          revision,
          label,
          value_type
        )
        values (
          ${dossierNumber},
          'invalid_missing',
          1,
          'Invalide',
          'text'
        )
      `,
    ).rejects.toThrow();
  } finally {
    await sql.end();
  }
});

test("enforces revision uniqueness and reads only the latest revision", async ({}, testInfo) => {
  const dossierNumber = BASE_DOSSIER_NUMBER + testInfo.parallelIndex;
  const sql = createTestDatabaseClient();

  try {
    await importDossierMetricsIfMissing({
      numeroDossier: dossierNumber,
      metrics: {
        changing: {
          label: "Valeur initiale",
          unite: null,
          valeur_estimee: "avant",
        },
      },
    });

    await sql`
      insert into dossier_metric_revisions (
        dossier_number,
        metric_code,
        revision,
        label,
        value_type,
        text_value
      )
      values (
        ${dossierNumber},
        'changing',
        2,
        'Valeur révisée',
        'text',
        'après'
      )
    `;

    await expect(
      sql`
        insert into dossier_metric_revisions (
          dossier_number,
          metric_code,
          revision,
          label,
          value_type,
          text_value
        )
        values (
          ${dossierNumber},
          'changing',
          2,
          'Doublon',
          'text',
          'doublon'
        )
      `,
    ).rejects.toThrow();

    await expect(
      getDossierMetricsState({ numeroDossier: dossierNumber }),
    ).resolves.toEqual({
      status: "imported",
      metrics: {
        changing: {
          label: "Valeur révisée",
          unite: null,
          valeur_estimee: "après",
        },
      },
    });
  } finally {
    await sql.end();
  }
});

test("rolls back all metric rows when an import fails", async ({}, testInfo) => {
  const dossierNumber = BASE_DOSSIER_NUMBER + testInfo.parallelIndex;

  await expect(
    importDossierMetricsIfMissing({
      numeroDossier: dossierNumber,
      metrics: {
        valid: {
          label: "Valide",
          unite: null,
          valeur_estimee: 1,
        },
        invalid: {
          label: "Nul interdit \u0000",
          unite: null,
          valeur_estimee: "invalide",
        },
      },
    }),
  ).rejects.toThrow();

  await expect(
    getDossierMetricsState({ numeroDossier: dossierNumber }),
  ).resolves.toEqual({ status: "not-imported" });
});

test("imports only metrics with a supported Fonds Vert shape", async ({}, testInfo) => {
  const dossierNumber = BASE_DOSSIER_NUMBER + testInfo.parallelIndex;

  await importDossierMetricsIfMissing({
    numeroDossier: dossierNumber,
    metrics: {
      valid: {
        label: "Valide",
        unite: null,
        valeur_estimee: "conservée",
      },
      null_value: {
        label: "Valeur nulle",
        unite: null,
        valeur_estimee: null,
      },
      mixed_array: {
        label: "Tableau mixte",
        unite: null,
        valeur_estimee: ["valide", 2],
      },
      object_value: {
        label: "Objet",
        unite: null,
        valeur_estimee: { nested: true },
      },
      invalid_unit: {
        label: "Unité invalide",
        unite: 12,
        valeur_estimee: true,
      },
      empty_label: {
        label: "",
        unite: null,
        valeur_estimee: 1,
      },
    },
  });

  await expect(
    getDossierMetricsState({ numeroDossier: dossierNumber }),
  ).resolves.toEqual({
    status: "imported",
    metrics: {
      valid: {
        label: "Valide",
        unite: null,
        valeur_estimee: "conservée",
      },
    },
  });
});

test("keeps the import pending when no metric has a supported shape", async ({}, testInfo) => {
  const dossierNumber = BASE_DOSSIER_NUMBER + testInfo.parallelIndex;

  await importDossierMetricsIfMissing({
    numeroDossier: dossierNumber,
    metrics: {
      null_value: {
        label: "Valeur nulle",
        unite: null,
        valeur_estimee: null,
      },
      invalid_array: {
        label: "Tableau invalide",
        unite: null,
        valeur_estimee: ["valide", 2],
      },
    },
  });

  await expect(
    getDossierMetricsState({ numeroDossier: dossierNumber }),
  ).resolves.toEqual({ status: "not-imported" });
});

test("keeps the import pending when metrics only contain unavailable data", async ({}, testInfo) => {
  const dossierNumber = BASE_DOSSIER_NUMBER + testInfo.parallelIndex;

  await importDossierMetricsIfMissing({
    numeroDossier: dossierNumber,
    metrics: {
      unavailable: {
        label: "Surface créée — Donnée non disponible",
        unite: "m²",
        valeur_estimee: 12,
      },
    },
  });

  await expect(
    getDossierMetricsState({ numeroDossier: dossierNumber }),
  ).resolves.toEqual({ status: "not-imported" });
});

test("keeps only the first concurrent initial import", async ({}, testInfo) => {
  const dossierNumber = BASE_DOSSIER_NUMBER + testInfo.parallelIndex;

  await Promise.all([
    importDossierMetricsIfMissing({
      numeroDossier: dossierNumber,
      metrics: {
        first: {
          label: "Premier import",
          unite: null,
          valeur_estimee: 1,
        },
      },
    }),
    importDossierMetricsIfMissing({
      numeroDossier: dossierNumber,
      metrics: {
        second: {
          label: "Second import",
          unite: null,
          valeur_estimee: 2,
        },
      },
    }),
  ]);

  const state = await getDossierMetricsState({
    numeroDossier: dossierNumber,
  });

  expect(state.status).toBe("imported");
  if (state.status === "imported") {
    expect(Object.keys(state.metrics)).toHaveLength(1);
  }
});

test("appends one typed revision while preserving the source and other metrics", async ({}, testInfo) => {
  const dossierNumber = BASE_DOSSIER_NUMBER + testInfo.parallelIndex;
  const sql = createTestDatabaseClient();

  try {
    await importDossierMetricsIfMissing({
      numeroDossier: dossierNumber,
      metrics: {
        changing: {
          label: "Valeur à corriger",
          unite: "ha",
          valeur_estimee: 12.5,
        },
        unchanged: {
          label: "Valeur indépendante",
          unite: null,
          valeur_estimee: "stable",
        },
      },
    });

    await expect(
      appendDossierMetricRevision({
        authorEmail: "metric-author@example.com",
        expectedRevision: 1,
        numeroDossier: dossierNumber,
        metricCode: "changing",
        value: 13.75,
      }),
    ).resolves.toMatchObject({
      metricCode: "changing",
      revision: 2,
      sourceValue: 12.5,
      effectiveValue: 13.75,
    });

    await expect(
      getDossierMetricsState({ numeroDossier: dossierNumber }),
    ).resolves.toEqual({
      status: "imported",
      metrics: {
        changing: {
          label: "Valeur à corriger",
          unite: "ha",
          valeur_estimee: 13.75,
        },
        unchanged: {
          label: "Valeur indépendante",
          unite: null,
          valeur_estimee: "stable",
        },
      },
    });

    await expect(
      getDossierMetricRevisionTargets({ numeroDossier: dossierNumber }),
    ).resolves.toEqual({
      changing: {
        metricCode: "changing",
        revision: 2,
        label: "Valeur à corriger",
        unit: "ha",
        valueType: "number",
        sourceValue: 12.5,
        effectiveValue: 13.75,
      },
      unchanged: {
        metricCode: "unchanged",
        revision: 1,
        label: "Valeur indépendante",
        unit: null,
        valueType: "text",
        sourceValue: "stable",
        effectiveValue: "stable",
      },
    });

    await expect(
      getDossierMetricsSnapshot({ numeroDossier: dossierNumber }),
    ).resolves.toMatchObject({
      status: "imported",
      metrics: {
        changing: { valeur_estimee: 13.75 },
        unchanged: { valeur_estimee: "stable" },
      },
      targets: {
        changing: {
          sourceValue: 12.5,
          effectiveValue: 13.75,
        },
        unchanged: {
          sourceValue: "stable",
          effectiveValue: "stable",
        },
      },
    });

    const revisions = await sql<
      {
        revision: number;
        number_value: string;
        author_email: string | null;
        created_at: Date;
      }[]
    >`
      select revision, number_value::text as number_value, author_email, created_at
      from dossier_metric_revisions
      where dossier_number = ${dossierNumber}
        and metric_code = 'changing'
      order by revision
    `;

    expect(revisions).toEqual([
      {
        revision: 1,
        number_value: "12.5",
        author_email: null,
        created_at: expect.any(Date),
      },
      {
        revision: 2,
        number_value: "13.75",
        author_email: "metric-author@example.com",
        created_at: expect.any(Date),
      },
    ]);
  } finally {
    await sql.end();
  }
});

test("imports a missing source while preserving an orphan correction and refuses later reimports", async ({}, testInfo) => {
  const dossierNumber = BASE_DOSSIER_NUMBER + 2000 + testInfo.parallelIndex;
  const sql = createTestDatabaseClient();

  try {
    await sql`
      insert into dossier_metric_revisions (
        dossier_number,
        metric_code,
        revision,
        label,
        value_type,
        text_value
      )
      values (
        ${dossierNumber},
        'orphan',
        2,
        'Révision orpheline',
        'text',
        'sans source'
      )
    `;

    await expect(
      getDossierMetricsSnapshot({ numeroDossier: dossierNumber }),
    ).resolves.toEqual({
      status: "not-imported",
      targets: {},
    });
    await expect(
      getDossierMetricsState({ numeroDossier: dossierNumber }),
    ).resolves.toEqual({
      status: "not-imported",
    });

    await importDossierMetricsIfMissing({
      numeroDossier: dossierNumber,
      metrics: {
        orphan: {
          label: "Révision orpheline",
          unite: null,
          valeur_estimee: "source Fonds Vert",
        },
      },
    });
    const importedSnapshot = await getDossierMetricsSnapshot({
      numeroDossier: dossierNumber,
    });
    expect(importedSnapshot).toEqual({
      status: "imported",
      metrics: {
        orphan: {
          label: "Révision orpheline",
          unite: null,
          valeur_estimee: "sans source",
        },
      },
      targets: {
        orphan: {
          metricCode: "orphan",
          revision: 2,
          label: "Révision orpheline",
          unit: null,
          valueType: "text",
          sourceValue: "source Fonds Vert",
          effectiveValue: "sans source",
        },
      },
    });

    await importDossierMetricsIfMissing({
      numeroDossier: dossierNumber,
      metrics: {
        orphan: {
          label: "Révision orpheline",
          unite: null,
          valeur_estimee: "source externe ultérieure",
        },
      },
    });
    await expect(
      getDossierMetricsSnapshot({ numeroDossier: dossierNumber }),
    ).resolves.toEqual(importedSnapshot);
    expect(
      await sql<{ revision: number; text_value: string }[]>`
        select revision, text_value
        from dossier_metric_revisions
        where dossier_number = ${dossierNumber}
          and metric_code = 'orphan'
        order by revision
      `,
    ).toEqual([
      { revision: 1, text_value: "source Fonds Vert" },
      { revision: 2, text_value: "sans source" },
    ]);
  } finally {
    await deleteStoredDossierMetrics(dossierNumber);
    await sql.end();
  }
});

test("appends valid revisions for every stored metric type", async ({}, testInfo) => {
  const dossierNumber = BASE_DOSSIER_NUMBER + testInfo.parallelIndex;
  const corrections = {
    number: 2.5,
    text: "texte corrigé",
    boolean: true,
    text_array: ["première", "deuxième"],
  } as const;

  await importDossierMetricsIfMissing({
    numeroDossier: dossierNumber,
    metrics: {
      number: { label: "Nombre", unite: null, valeur_estimee: 1 },
      text: { label: "Texte", unite: null, valeur_estimee: "source" },
      boolean: { label: "Booléen", unite: null, valeur_estimee: false },
      text_array: {
        label: "Liste",
        unite: null,
        valeur_estimee: ["source"],
      },
    },
  });

  for (const [metricCode, value] of Object.entries(corrections)) {
    await expect(
      appendDossierMetricRevision({
        authorEmail: "metric-author@example.com",
        expectedRevision: 1,
        numeroDossier: dossierNumber,
        metricCode,
        value,
      }),
    ).resolves.toMatchObject({
      metricCode,
      revision: 2,
      effectiveValue: value,
    });
  }

  await expect(
    getDossierMetricsState({ numeroDossier: dossierNumber }),
  ).resolves.toMatchObject({
    metrics: {
      number: { valeur_estimee: corrections.number },
      text: { valeur_estimee: corrections.text },
      boolean: { valeur_estimee: corrections.boolean },
      text_array: { valeur_estimee: corrections.text_array },
    },
  });
});

test("normalizes accepted text revisions before storing them", async ({}, testInfo) => {
  const dossierNumber = BASE_DOSSIER_NUMBER + testInfo.parallelIndex;

  await importDossierMetricsIfMissing({
    numeroDossier: dossierNumber,
    metrics: {
      text: { label: "Texte", unite: null, valeur_estimee: "source" },
      text_array: {
        label: "Liste",
        unite: null,
        valeur_estimee: ["source"],
      },
    },
  });

  await expect(
    appendDossierMetricRevision({
      authorEmail: "metric-author@example.com",
      expectedRevision: 1,
      numeroDossier: dossierNumber,
      metricCode: "text",
      value: "  texte corrigé  ",
    }),
  ).resolves.toMatchObject({ effectiveValue: "texte corrigé" });
  await expect(
    appendDossierMetricRevision({
      authorEmail: "metric-author@example.com",
      expectedRevision: 1,
      numeroDossier: dossierNumber,
      metricCode: "text_array",
      value: [" première ", " deuxième "],
    }),
  ).resolves.toMatchObject({
    effectiveValue: ["première", "deuxième"],
  });

  await expect(
    getDossierMetricsState({ numeroDossier: dossierNumber }),
  ).resolves.toMatchObject({
    metrics: {
      text: { valeur_estimee: "texte corrigé" },
      text_array: { valeur_estimee: ["première", "deuxième"] },
    },
  });
});

test("rejects unknown targets and invalid values for every stored type", async ({}, testInfo) => {
  const dossierNumber = BASE_DOSSIER_NUMBER + testInfo.parallelIndex;

  await importDossierMetricsIfMissing({
    numeroDossier: dossierNumber,
    metrics: {
      number: { label: "Nombre", unite: null, valeur_estimee: 1 },
      text: { label: "Texte", unite: null, valeur_estimee: "source" },
      boolean: { label: "Booléen", unite: null, valeur_estimee: false },
      text_array: {
        label: "Liste",
        unite: null,
        valeur_estimee: ["source"],
      },
    },
  });

  await expect(
    appendDossierMetricRevision({
      authorEmail: "metric-author@example.com",
      expectedRevision: 1,
      numeroDossier: dossierNumber,
      metricCode: "unknown",
      value: 1,
    }),
  ).rejects.toThrow("Métrique inconnue");

  for (const [metricCode, value] of [
    ["number", "1"],
    ["number", Number.NaN],
    ["number", Number.POSITIVE_INFINITY],
    ["text", "   "],
    ["text", false],
    ["boolean", "true"],
    ["text_array", []],
    ["text_array", ["valide", "  "]],
    ["text_array", ["doublon", "doublon"]],
    ["text_array", "valide"],
  ] satisfies [string, unknown][]) {
    await expect(
      appendDossierMetricRevision({
        authorEmail: "metric-author@example.com",
        expectedRevision: 1,
        numeroDossier: dossierNumber,
        metricCode,
        value,
      }),
    ).rejects.toThrow("Valeur invalide");
  }
});

test("refuses a repeated obsolete submission even when its value matches", async ({}, testInfo) => {
  const dossierNumber = BASE_DOSSIER_NUMBER + testInfo.parallelIndex;
  const sql = createTestDatabaseClient();

  try {
    await importDossierMetricsIfMissing({
      numeroDossier: dossierNumber,
      metrics: {
        metric: {
          label: "Métrique",
          unite: null,
          valeur_estimee: 1,
        },
      },
    });

    const results = await Promise.allSettled([
      appendDossierMetricRevision({
        authorEmail: "metric-author@example.com",
        expectedRevision: 1,
        numeroDossier: dossierNumber,
        metricCode: "metric",
        value: 2,
      }),
      appendDossierMetricRevision({
        authorEmail: "metric-author@example.com",
        expectedRevision: 1,
        numeroDossier: dossierNumber,
        metricCode: "metric",
        value: 2,
      }),
    ]);

    expect(
      results.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1);
    const rejected = results.find((result) => result.status === "rejected");
    expect(rejected?.reason).toBeInstanceOf(DossierMetricRevisionConflict);
    expect(rejected?.reason.target).toMatchObject({
      revision: 2,
      effectiveValue: 2,
    });
    const [{ count }] = await sql<{ count: number }[]>`
      select count(*)::integer as count
      from dossier_metric_revisions
      where dossier_number = ${dossierNumber}
        and metric_code = 'metric'
    `;
    expect(count).toBe(2);
  } finally {
    await sql.end();
  }
});

test("accepts only one concurrent correction from the same opened revision", async ({}, testInfo) => {
  const dossierNumber = BASE_DOSSIER_NUMBER + testInfo.parallelIndex;
  const sql = createTestDatabaseClient();

  try {
    await importDossierMetricsIfMissing({
      numeroDossier: dossierNumber,
      metrics: {
        metric: {
          label: "Métrique",
          unite: null,
          valeur_estimee: 1,
        },
      },
    });

    const results = await Promise.allSettled([
      appendDossierMetricRevision({
        authorEmail: "metric-author@example.com",
        expectedRevision: 1,
        numeroDossier: dossierNumber,
        metricCode: "metric",
        value: 2,
      }),
      appendDossierMetricRevision({
        authorEmail: "metric-author@example.com",
        expectedRevision: 1,
        numeroDossier: dossierNumber,
        metricCode: "metric",
        value: 3,
      }),
    ]);

    const revisions = await sql<{ revision: number; number_value: string }[]>`
      select revision, number_value::text as number_value
      from dossier_metric_revisions
      where dossier_number = ${dossierNumber}
        and metric_code = 'metric'
      order by revision
    `;

    expect(
      results.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1);
    const rejected = results.find((result) => result.status === "rejected");
    expect(rejected?.reason).toBeInstanceOf(DossierMetricRevisionConflict);
    expect(revisions.map(({ revision }) => revision)).toEqual([1, 2]);
    expect(["2", "3"]).toContain(revisions[1].number_value);
  } finally {
    await sql.end();
  }
});

test("does not create a revision or attribution when storing a correction fails", async ({}, testInfo) => {
  const dossierNumber = BASE_DOSSIER_NUMBER + testInfo.parallelIndex;
  const sql = createTestDatabaseClient();

  try {
    await importDossierMetricsIfMissing({
      numeroDossier: dossierNumber,
      metrics: {
        text: { label: "Texte", unite: null, valeur_estimee: "source" },
      },
    });

    await expect(
      appendDossierMetricRevision({
        numeroDossier: dossierNumber,
        metricCode: "text",
        value: "Valeur interdite \u0000",
        expectedRevision: 1,
        authorEmail: "metric-author@example.com",
      }),
    ).rejects.toThrow();

    const revisions = await sql`select revision, text_value, author_email
      from dossier_metric_revisions where dossier_number = ${dossierNumber}`;
    expect(revisions).toEqual([
      { revision: 1, text_value: "source", author_email: null },
    ]);
  } finally {
    await sql.end();
  }
});
