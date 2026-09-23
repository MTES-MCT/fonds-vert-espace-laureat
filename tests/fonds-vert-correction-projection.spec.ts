import { expect, test } from "@playwright/test";

import { getLatestFondsVertCorrections } from "@/db/fondsVertCorrectionProjection";
import { DEMO_DOSSIER_NUMBER } from "@/utils/demo";

import {
  createTestDatabaseClient,
  deleteStoredDossierMetrics,
} from "./setup/db";

const BASE_DOSSIER_NUMBER = 89994000;
const DEMO_METRIC_CODE_PREFIX = "projection_demo_only";

test.afterEach(async ({}, testInfo) => {
  await deleteStoredDossierMetrics(
    BASE_DOSSIER_NUMBER + testInfo.parallelIndex,
  );

  const sql = createTestDatabaseClient();
  try {
    await sql`
      delete from dossier_metric_revisions
      where dossier_number = ${DEMO_DOSSIER_NUMBER}
        and metric_code = ${`${DEMO_METRIC_CODE_PREFIX}_${testInfo.parallelIndex}`}
    `;
  } finally {
    await sql.end();
  }
});

test("returns every corrected field outside the demo dossier", async ({}, testInfo) => {
  const dossierNumber = BASE_DOSSIER_NUMBER + testInfo.parallelIndex;
  const demoMetricCode = `${DEMO_METRIC_CODE_PREFIX}_${testInfo.parallelIndex}`;
  const sql = createTestDatabaseClient();

  try {
    await sql`
      insert into dossier_metric_revisions (
        dossier_number,
        metric_code,
        revision,
        label,
        unit,
        value_type,
        number_value,
        created_at
      )
      values
        (
          ${dossierNumber},
          'exported_number',
          1,
          'Import seul',
          'tCO₂e',
          'number',
          10,
          '2026-09-20T08:00:00Z'
        ),
        (
          ${dossierNumber},
          'gain_energetique_estime_percentage',
          2,
          'Champ calculé hors contrat',
          '%',
          'number',
          25,
          '2026-09-21T08:00:00Z'
        ),
        (
          ${dossierNumber},
          'other_out_of_scope',
          2,
          'Champ hors contrat',
          null,
          'number',
          30,
          '2026-09-21T09:00:00Z'
        ),
        (
          ${DEMO_DOSSIER_NUMBER},
          ${demoMetricCode},
          2,
          'Correction de démonstration',
          'tCO₂e',
          'number',
          40,
          '2026-09-21T10:00:00Z'
        )
    `;

    const corrections = await getLatestFondsVertCorrections();

    expect(
      corrections.filter(
        (correction) => correction.dossierNumber === dossierNumber,
      ),
    ).toEqual([
      {
        dossierNumber,
        metricCode: "gain_energetique_estime_percentage",
        revision: 2,
        valueType: "number",
        value: 25,
        unit: "%",
        correctedAt: new Date("2026-09-21T08:00:00Z"),
      },
      {
        dossierNumber,
        metricCode: "other_out_of_scope",
        revision: 2,
        valueType: "number",
        value: 30,
        unit: null,
        correctedAt: new Date("2026-09-21T09:00:00Z"),
      },
    ]);
    expect(
      corrections.find(
        (correction) =>
          correction.dossierNumber === DEMO_DOSSIER_NUMBER &&
          correction.metricCode === demoMetricCode,
      ),
    ).toBeUndefined();
  } finally {
    await sql.end();
  }
});

test("returns the latest typed correction and its revision date", async ({}, testInfo) => {
  const dossierNumber = BASE_DOSSIER_NUMBER + testInfo.parallelIndex;
  const sql = createTestDatabaseClient();

  try {
    await sql`
      insert into dossier_metric_revisions (
        dossier_number,
        metric_code,
        revision,
        label,
        unit,
        value_type,
        number_value,
        text_value,
        boolean_value,
        text_array_value,
        created_at
      )
      values
        (
          ${dossierNumber},
          'emission_ges_evitees_tco2e',
          1,
          'GES évitées',
          'tCO₂e',
          'number',
          10,
          null,
          null,
          null,
          '2026-09-20T08:00:00+02:00'
        ),
        (
          ${dossierNumber},
          'emission_ges_evitees_tco2e',
          2,
          'GES évitées',
          'tCO₂e',
          'number',
          12.5,
          null,
          null,
          null,
          '2026-09-21T09:30:00+02:00'
        ),
        (
          ${dossierNumber},
          'emission_ges_evitees_tco2e',
          3,
          'GES évitées',
          'tCO₂e',
          'number',
          10,
          null,
          null,
          null,
          '2026-09-21T09:30:00+02:00'
        ),
        (
          ${dossierNumber},
          'heating_system',
          2,
          'Chauffage',
          null,
          'text',
          null,
          'Réseau de chaleur',
          null,
          null,
          '2026-09-21T10:00:00Z'
        ),
        (
          ${dossierNumber},
          'audited',
          2,
          'Audité',
          null,
          'boolean',
          null,
          null,
          true,
          null,
          '2026-09-21T11:00:00Z'
        ),
        (
          ${dossierNumber},
          'building_types',
          2,
          'Types de bâtiments',
          null,
          'text_array',
          null,
          null,
          null,
          array['École', 'Mairie'],
          '2026-09-21T12:00:00Z'
        )
    `;

    const corrections = (await getLatestFondsVertCorrections()).filter(
      (correction) => correction.dossierNumber === dossierNumber,
    );

    expect(corrections).toEqual([
      {
        dossierNumber,
        metricCode: "audited",
        revision: 2,
        valueType: "boolean",
        value: true,
        unit: null,
        correctedAt: new Date("2026-09-21T11:00:00Z"),
      },
      {
        dossierNumber,
        metricCode: "building_types",
        revision: 2,
        valueType: "text_array",
        value: ["École", "Mairie"],
        unit: null,
        correctedAt: new Date("2026-09-21T12:00:00Z"),
      },
      {
        dossierNumber,
        metricCode: "emission_ges_evitees_tco2e",
        revision: 3,
        valueType: "number",
        value: 10,
        unit: "tCO₂e",
        correctedAt: new Date("2026-09-21T07:30:00Z"),
      },
      {
        dossierNumber,
        metricCode: "heating_system",
        revision: 2,
        valueType: "text",
        value: "Réseau de chaleur",
        unit: null,
        correctedAt: new Date("2026-09-21T10:00:00Z"),
      },
    ]);
    expect(corrections[2].correctedAt.toISOString()).toBe(
      "2026-09-21T07:30:00.000Z",
    );
  } finally {
    await sql.end();
  }
});
