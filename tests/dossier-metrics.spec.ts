import { expect, test } from "@playwright/test";

import {
  getDossierMetricsState,
  importDossierMetricsIfMissing,
} from "@/db/dossierMetrics";

import {
  createTestDatabaseClient,
  deleteStoredDossierMetrics,
} from "./setup/db";

const BASE_DOSSIER_NUMBER = 89990000;

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
