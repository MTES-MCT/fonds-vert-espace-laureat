import {
  expect,
  graphql,
  http,
  HttpResponse,
  test,
} from "next/experimental/testmode/playwright/msw";

import { getSessionOptions } from "@/utils/session";

import {
  DEPARTMENT,
  DOSSIER_NUMBER,
  INSTRUCTEUR_EMAIL,
  PROGRAM_TITLE,
  PROJECT_TITLE,
} from "./fixtures/constants";
import {
  getDossierData as originalDossierData,
  makeDossierDataForInstructeur,
  makeDossierDataWithNumber as makeOriginalDossierDataWithNumber,
} from "./fixtures/ds";
import {
  fondsVertDossiersListByInstructeurData,
  fondsVertDossiersListBySiretData,
  fondsVertLoginData,
  INSTRUCTEUR_DOSSIER_NUMBER,
} from "./fixtures/fondsvert";
import { authenticatePage } from "./setup/auth";
import { createTestDatabaseClient } from "./setup/db";

const ds = graphql.link("https://demarche.numerique.gouv.fr/api/v2/graphql");
const DEMANDEUR_EMAIL = "porteur.liste@example.com";
const getDossierData = {
  ...originalDossierData,
  data: {
    dossier: {
      ...originalDossierData.data.dossier,
      usager: { email: DEMANDEUR_EMAIL },
    },
  },
};

function makeDossierDataWithNumber(number: number) {
  const response = makeOriginalDossierDataWithNumber(number);
  return {
    ...response,
    data: {
      dossier: { ...response.data.dossier, usager: { email: DEMANDEUR_EMAIL } },
    },
  };
}

type DossiersResponse =
  | {
      success: true;
      count: number;
      next_page: string | null;
      previous_page: string | null;
      data: { socle_commun: { dossier_number: number } }[];
    }
  | { success: false };

const emptyList: DossiersResponse = {
  success: true,
  count: 0,
  next_page: null,
  previous_page: null,
  data: [],
};
const siretList: DossiersResponse = {
  success: true,
  ...fondsVertDossiersListBySiretData,
};
const instructeurList: DossiersResponse = {
  success: true,
  ...fondsVertDossiersListByInstructeurData,
};
const errorResponse: DossiersResponse = { success: false };
const noSignals = {
  est_error: false,
  est_anomalie: false,
  anomalie_demarche_list: [],
  anomalie_indicateur_list: [],
  error_indicateur_list: [],
};

function makeDossiersHandler({
  siret,
  instructeur,
}: {
  siret: DossiersResponse;
  instructeur: DossiersResponse;
}) {
  return http.get("http://fondsvert/fonds_vert/v2/dossiers", ({ request }) => {
    const url = new URL(request.url);

    if (url.searchParams.get("siret")) {
      if (!siret.success) {
        return HttpResponse.json({ error: "Server Error" }, { status: 500 });
      }
      return HttpResponse.json(siret);
    }

    const email = url.searchParams.get("instructeur__instructeur_email");
    if (email) {
      if (!instructeur.success) {
        return HttpResponse.json({ error: "Server Error" }, { status: 500 });
      }
      if (email !== INSTRUCTEUR_EMAIL) {
        return HttpResponse.json(emptyList);
      }
      return HttpResponse.json(instructeur);
    }

    return HttpResponse.json(emptyList);
  });
}

test.use({
  mswHandlers: [
    [
      http.post("http://fondsvert/fonds_vert/login", () => {
        return HttpResponse.json(fondsVertLoginData);
      }),

      ds.query("getDossier", ({ variables }) => {
        const number = variables.number;

        if (number === DOSSIER_NUMBER) {
          return HttpResponse.json(getDossierData);
        }

        if (number === INSTRUCTEUR_DOSSIER_NUMBER) {
          return HttpResponse.json(
            makeDossierDataForInstructeur(
              INSTRUCTEUR_DOSSIER_NUMBER,
              INSTRUCTEUR_EMAIL,
            ),
          );
        }

        return HttpResponse.json({ data: { dossier: null } });
      }),
    ],
    { scope: "test" },
  ],
});

test("demandeur sees dossiers from SIRET", async ({ page, msw }) => {
  await authenticatePage(page, { email: DEMANDEUR_EMAIL });
  msw.use(makeDossiersHandler({ siret: siretList, instructeur: emptyList }));

  await page.goto("/projets");

  await expect(page.getByText(String(DOSSIER_NUMBER))).toBeVisible();
  await expect(
    page.getByText(String(INSTRUCTEUR_DOSSIER_NUMBER)),
  ).not.toBeVisible();
});

test("demandeur sees dossiers regardless of status", async ({ page, msw }) => {
  const requestedStates: (string | null)[] = [];

  await authenticatePage(page, { email: DEMANDEUR_EMAIL });
  msw.use(
    http.get("http://fondsvert/fonds_vert/v2/dossiers", ({ request }) => {
      const url = new URL(request.url);
      requestedStates.push(url.searchParams.get("state"));

      if (url.searchParams.get("siret")) {
        return HttpResponse.json(siretList);
      }

      return HttpResponse.json(emptyList);
    }),
    ds.query("getDossier", () =>
      HttpResponse.json({
        data: {
          dossier: {
            ...getDossierData.data.dossier,
            state: "en_instruction",
          },
        },
      }),
    ),
  );

  await page.goto("/projets");

  await expect(page.getByText(String(DOSSIER_NUMBER))).toBeVisible();
  expect(requestedStates).toEqual([null, null]);
});

test("instructeur sees dossiers filtered by DS authorization", async ({
  page,
  msw,
}) => {
  await authenticatePage(page, { email: INSTRUCTEUR_EMAIL });
  // Fonds Vert returns both dossiers, but DS denies DOSSIER_NUMBER (not usager, not in instructeurs)
  msw.use(
    makeDossiersHandler({ siret: siretList, instructeur: instructeurList }),
  );

  await page.goto("/projets");

  await expect(page.getByText(String(DOSSIER_NUMBER))).not.toBeVisible();
  await expect(
    page.getByText(String(INSTRUCTEUR_DOSSIER_NUMBER)),
  ).toBeVisible();
});

test("l’instructeur voit les informations des projets autorisés, leur dernier avancement local et les différents états de signalement", async ({
  page,
  msw,
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const first = 89993800 + testInfo.parallelIndex * 10;
  const [rich, absent, incomplete, complete, warning, statistical] = Array.from(
    { length: 6 },
    (_, index) => first + index,
  );
  const indicator = "Surface du bâtiment avant projet";
  const unknownIndicator = "Indicateur partenaire à conserver";
  let detailCalls = 0;
  const sql = createTestDatabaseClient();
  try {
    await sql`delete from dossier_progress_revisions where dossier_number >= ${first} and dossier_number < ${first + 6}`;
    await sql`delete from dossier_metric_revisions where dossier_number >= ${first} and dossier_number < ${first + 6}`;
    await sql`insert into dossier_progress_revisions (dossier_number,revision,status,author_email) values
      (${rich},1,'En cours de réalisation',${INSTRUCTEUR_EMAIL}),
      (${rich},2,'Bloqué',${INSTRUCTEUR_EMAIL})`;
    await authenticatePage(page, { email: INSTRUCTEUR_EMAIL });
    msw.use(
      http.get("http://fondsvert/fonds_vert/v2/dossiers", ({ request }) => {
        const siret = new URL(request.url).searchParams.has("siret");
        const data = siret
          ? [
              {
                socle_commun: { dossier_number: warning },
                anomalies: noSignals,
                avertissements: ["Vérifier le périmètre de calcul"],
              },
            ]
          : [
              {
                socle_commun: {
                  dossier_number: rich,
                  entreprise_raison_sociale: "COMMUNE DE REZÉ",
                  nom_commune: "REZÉ",
                  annee_millesime: 2025,
                  statut_realisation_projet: "Terminé",
                  montant_subvention_attribuee: 999,
                  date_notification: "2020-01-01",
                },
                anomalies: {
                  ...noSignals,
                  est_error: true,
                  est_anomalie: true,
                  anomalie_indicateur_list: [
                    indicator,
                    indicator,
                    unknownIndicator,
                  ],
                  error_indicateur_list: [indicator, indicator],
                },
                avertissements: ["Justificatif partenaire à vérifier"],
              },
              { socle_commun: { dossier_number: absent } },
              {
                socle_commun: { dossier_number: incomplete },
                anomalies: { est_anomalie: false },
              },
              {
                socle_commun: { dossier_number: complete },
                anomalies: noSignals,
                avertissements: [],
              },
              {
                socle_commun: { dossier_number: warning },
                anomalies: noSignals,
                avertissements: [42],
              },
              {
                socle_commun: { dossier_number: statistical },
                anomalies: {
                  est_anomalie: true,
                  anomalie_indicateur_list: [indicator],
                },
              },
            ];
        return HttpResponse.json({
          count: data.length,
          next_page: null,
          previous_page: null,
          data,
        });
      }),
      ds.query("getDossier", ({ variables }) => {
        const response = makeDossierDataForInstructeur(
          variables.number,
          INSTRUCTEUR_EMAIL,
        );
        return HttpResponse.json({
          data: {
            dossier: {
              ...response.data.dossier,
              annotations: response.data.dossier.annotations.map((champ) =>
                champ.champDescriptorId === "Q2hhbXAtMjk4MjQ5NA=="
                  ? { ...champ, date: "2026-10-01" }
                  : champ,
              ),
            },
          },
        });
      }),
      http.get("http://fondsvert/fonds_vert/v2/dossiers/:number", () => {
        detailCalls++;
        return new HttpResponse(null, { status: 500 });
      }),
    );

    await page.goto("/projets");

    await expect(
      page.getByRole("heading", { level: 1, name: "Projets suivis" }),
    ).toBeVisible();
    await expect(page.getByRole("columnheader")).toHaveText([
      "Dossier",
      "Projet",
      "Signalements",
      "Porteur",
      "Territoire",
      "Dispositif",
      "Avancement",
      "Subvention attribuée",
      "Actions",
    ]);
    const richProject = page.getByRole("row").filter({
      has: page.getByRole("cell", { name: String(rich), exact: true }),
    });
    const richSignals = richProject.getByRole("cell").nth(2);
    const initialSignalsPosition = await richSignals.evaluate((cell) => {
      const bounds = cell.getBoundingClientRect();
      const container = cell.closest(".fr-table__container")!;
      const containerBounds = container.getBoundingClientRect();
      return {
        left: bounds.left,
        right: bounds.right,
        top: bounds.top,
        bottom: bounds.bottom,
        visibleLeft: Math.max(0, containerBounds.left),
        visibleRight: Math.min(window.innerWidth, containerBounds.right),
        viewportHeight: window.innerHeight,
        tableScroll: container.scrollLeft,
        pageScroll: { x: window.scrollX, y: window.scrollY },
      };
    });
    expect(initialSignalsPosition.tableScroll).toBe(0);
    expect(initialSignalsPosition.pageScroll).toEqual({ x: 0, y: 0 });
    expect(initialSignalsPosition.left).toBeGreaterThanOrEqual(
      initialSignalsPosition.visibleLeft,
    );
    expect(initialSignalsPosition.right).toBeLessThanOrEqual(
      initialSignalsPosition.visibleRight,
    );
    expect(initialSignalsPosition.top).toBeGreaterThanOrEqual(0);
    expect(initialSignalsPosition.bottom).toBeLessThanOrEqual(
      initialSignalsPosition.viewportHeight,
    );
    await expect(richProject.getByRole("cell").nth(1)).toHaveText(
      PROJECT_TITLE,
    );
    await expect(richProject.getByRole("cell").nth(3)).toHaveText(
      "COMMUNE DE REZÉ",
    );
    await expect(richProject.getByRole("cell").nth(4)).toContainText("REZÉ");
    await expect(richProject.getByRole("cell").nth(4)).toContainText(
      DEPARTMENT,
    );
    await expect(richProject.getByRole("cell").nth(5)).toContainText(
      PROGRAM_TITLE,
    );
    await expect(richProject.getByRole("cell").nth(5)).toContainText("2025");
    await expect(richProject.getByRole("cell").nth(6)).toHaveText("Bloqué");
    await expect(richProject.getByRole("cell").nth(7)).toContainText(
      /10\s*073\s*564,00\s*€/,
    );
    await expect(richProject.getByRole("cell").nth(7)).toContainText(
      "1 octobre 2026",
    );
    await expect(
      richSignals.getByRole("link", {
        name: `2 données à vérifier pour le projet n°${rich}`,
        exact: true,
      }),
    ).toHaveAttribute("href", `/projets/${rich}/impact#signalements`);
    await expect(richSignals.locator(".fr-badge--error")).toHaveText(
      "2 données à vérifier",
    );
    await expect(richSignals.getByRole("listitem")).toHaveText([
      `${indicator} — Anomalie statistique, Incohérence forte`,
      `${unknownIndicator} — Anomalie statistique`,
    ]);
    await expect(
      richSignals.getByText("Justificatif partenaire à vérifier", {
        exact: true,
      }),
    ).toBeVisible();

    const missingProject = page.getByRole("row").filter({
      has: page.getByRole("cell", { name: String(absent), exact: true }),
    });
    await expect(missingProject.getByRole("cell").nth(3)).toHaveText(
      "Non renseigné",
    );
    await expect(missingProject.getByRole("cell").nth(4)).toContainText(
      "Non renseignée",
    );
    await expect(missingProject.getByRole("cell").nth(5)).toContainText(
      "Millésime non renseigné",
    );
    await expect(missingProject.getByRole("cell").nth(6)).toHaveText(
      "Non renseigné",
    );
    for (const [number, label] of [
      [absent, "Signalements non renseignés"],
      [incomplete, "Signalements incomplets"],
      [complete, "Aucun signalement"],
    ] as const) {
      const project = page.getByRole("row").filter({
        has: page.getByRole("cell", { name: String(number), exact: true }),
      });
      await expect(
        project.getByRole("link", {
          name: `${label} pour le projet n°${number}`,
          exact: true,
        }),
      ).toHaveAttribute("href", `/projets/${number}/impact#signalements`);
    }
    const warnings = page.getByRole("row").filter({
      has: page.getByRole("cell", { name: String(warning), exact: true }),
    });
    await expect(warnings).toContainText("Vérifier le périmètre de calcul");
    await expect(warnings).toContainText("Avertissements incomplets");
    const statisticalProject = page.getByRole("row").filter({
      has: page.getByRole("cell", { name: String(statistical), exact: true }),
    });
    await expect(
      statisticalProject
        .getByRole("link", {
          name: `1 donnée à vérifier pour le projet n°${statistical}`,
          exact: true,
        })
        .locator(".fr-badge--warning"),
    ).toBeVisible();
    await expect(statisticalProject).toContainText("Signalements incomplets");
    await expect(statisticalProject.getByRole("listitem")).toHaveText([
      `${indicator} — Anomalie statistique`,
    ]);
    expect(detailCalls).toBe(0);
    const [stored] = await sql<
      { count: string }[]
    >`select count(*) from dossier_metric_revisions where dossier_number >= ${first} and dossier_number < ${first + 6}`;
    expect(Number(stored.count)).toBe(0);
    await expect(page.locator("main")).toContainText(
      "l'adresse e-mail associée à votre groupe instructeur dans Démarche numérique",
    );
    await expect(page.locator("main")).not.toContainText(
      "dépôt de votre demande",
    );
    await page.screenshot({
      path: testInfo.outputPath("liste-instructeur-desktop.png"),
      fullPage: true,
    });
    await page.locator(".fr-table__container").evaluate((element) => {
      element.scrollLeft = element.scrollWidth;
    });
    await page.screenshot({
      path: testInfo.outputPath("liste-instructeur-signalements-desktop.png"),
      fullPage: true,
    });
  } finally {
    await sql`delete from dossier_progress_revisions where dossier_number >= ${first} and dossier_number < ${first + 6}`;
    await sql`delete from dossier_metric_revisions where dossier_number >= ${first} and dossier_number < ${first + 6}`;
    await sql.end();
  }
});

test("displays only SIRET dossiers when instructeur API fails", async ({
  page,
  msw,
}) => {
  await authenticatePage(page, { email: DEMANDEUR_EMAIL });
  msw.use(
    makeDossiersHandler({ siret: siretList, instructeur: errorResponse }),
  );

  await page.goto("/projets");

  await expect(page.getByText(String(DOSSIER_NUMBER))).toBeVisible();
  await expect(
    page.getByText(/La liste des projets est incomplète/),
  ).toBeVisible();
});

test("displays only instructeur dossiers when SIRET API fails", async ({
  page,
  msw,
}) => {
  await authenticatePage(page, { email: INSTRUCTEUR_EMAIL });
  msw.use(
    makeDossiersHandler({ siret: errorResponse, instructeur: instructeurList }),
  );

  await page.goto("/projets");

  await expect(
    page.getByText(String(INSTRUCTEUR_DOSSIER_NUMBER)),
  ).toBeVisible();
  await expect(
    page.getByText(/La liste des projets est incomplète/),
  ).toBeVisible();
});

test("205 candidats paginés ne masquent pas le voisin autorisé d’un dossier refusé", async ({
  page,
  msw,
}) => {
  test.setTimeout(60_000);
  const first = 89993000;
  const denied = first + 101;
  const owner = "porteur.liste024@example.com";
  let dnCalls = 0;
  let detailCalls = 0;
  let active = 0;
  let peak = 0;
  const pages: number[] = [];
  await authenticatePage(page, { email: owner });
  msw.use(
    http.get("http://fondsvert/fonds_vert/v2/dossiers", ({ request }) => {
      const params = new URL(request.url).searchParams;
      if (!params.has("siret")) return HttpResponse.json(emptyList);
      const pageNumber = Number(params.get("page"));
      pages.push(pageNumber);
      const offset = (pageNumber - 1) * 100;
      return HttpResponse.json({
        count: 205,
        next_page: pageNumber < 3 ? `?page=${pageNumber + 1}` : null,
        previous_page: null,
        data: Array.from(
          { length: Math.min(100, 205 - offset) },
          (_, index) => ({
            socle_commun: { dossier_number: first + offset + index },
            anomalies: {
              est_error: true,
              est_anomalie: false,
              anomalie_demarche_list: [],
              anomalie_indicateur_list: [],
              error_indicateur_list: [
                first + offset + index === denied
                  ? "Signalement privé du dossier refusé"
                  : "Signalement du dossier autorisé",
              ],
            },
          }),
        ),
      });
    }),
    ds.query("getDossier", async ({ variables }) => {
      dnCalls++;
      active++;
      peak = Math.max(peak, active);
      await new Promise((resolve) => setTimeout(resolve, 10));
      active--;
      const data = structuredClone(makeDossierDataWithNumber(variables.number));
      data.data.dossier.usager.email =
        variables.number === denied ? "autre-porteur@example.com" : owner;
      return HttpResponse.json(data);
    }),
    http.get("http://fondsvert/fonds_vert/v2/dossiers/:number", () => {
      detailCalls++;
      return new HttpResponse(null, { status: 500 });
    }),
  );

  const started = performance.now();
  await page.goto("/projets");

  await expect(page.getByRole("table").getByRole("row")).toHaveCount(205);
  await expect(
    page.getByRole("cell", { name: String(denied), exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByText("Signalement privé du dossier refusé"),
  ).toHaveCount(0);
  expect(await page.content()).not.toContain(
    "Signalement privé du dossier refusé",
  );
  await expect(page.getByText("Signalement du dossier autorisé")).toHaveCount(
    204,
  );
  await expect(
    page.getByRole("cell", { name: String(denied + 1), exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("cell", { name: String(first + 204), exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(/La liste des projets est incomplète/),
  ).toHaveCount(0);
  expect(pages).toEqual([1, 2, 3]);
  expect(dnCalls).toBe(205);
  expect(peak).toBeLessThanOrEqual(8);
  expect(detailCalls).toBe(0);
  const duration = Math.round(performance.now() - started);
  const sql = createTestDatabaseClient();
  try {
    const [stored] = await sql<
      { count: string }[]
    >`select count(*) from dossier_metric_revisions where dossier_number >= ${first} and dossier_number < ${first + 205}`;
    expect(Number(stored.count)).toBe(0);
  } finally {
    await sql.end();
  }
  console.log(
    "FV024 LIST205",
    JSON.stringify({
      duration,
      pages,
      dnCalls,
      peak,
      detailCalls,
      imported: 0,
      authorized: 204,
      denied: 1,
    }),
  );
});

test("un projet présent dans les deux sources ne demande qu’une seule autorisation DN", async ({
  page,
  msw,
}) => {
  let dnCalls = 0;
  await authenticatePage(page, { email: DEMANDEUR_EMAIL });
  msw.use(
    http.get("http://fondsvert/fonds_vert/v2/dossiers", () =>
      HttpResponse.json(fondsVertDossiersListBySiretData),
    ),
    ds.query("getDossier", () => {
      dnCalls++;
      return HttpResponse.json(getDossierData);
    }),
  );

  await page.goto("/projets");

  await expect(page.getByRole("table").getByRole("row")).toHaveCount(2);
  expect(dnCalls).toBe(1);
});

test("une panne DN laisse visible le projet autorisé et annonce une liste partielle", async ({
  page,
  msw,
}) => {
  await authenticatePage(page, { email: DEMANDEUR_EMAIL });
  msw.use(
    makeDossiersHandler({
      siret: {
        success: true,
        count: 2,
        next_page: null,
        previous_page: null,
        data: [
          ...fondsVertDossiersListBySiretData.data,
          ...fondsVertDossiersListByInstructeurData.data,
        ],
      },
      instructeur: emptyList,
    }),
    ds.query("getDossier", ({ variables }) =>
      variables.number === INSTRUCTEUR_DOSSIER_NUMBER
        ? HttpResponse.json(
            { errors: [{ message: "DN indisponible" }] },
            { status: 503 },
          )
        : HttpResponse.json(getDossierData),
    ),
  );

  await page.goto("/projets");

  await expect(page.getByText(String(DOSSIER_NUMBER))).toBeVisible();
  await expect(
    page.getByText(/La liste des projets est incomplète/),
  ).toBeVisible();
  await expect(
    page.getByRole("cell", {
      name: String(INSTRUCTEUR_DOSSIER_NUMBER),
      exact: true,
    }),
  ).toHaveCount(0);
});

test("une source vide et une source en panne ne présentent pas un état vide définitif", async ({
  page,
  msw,
}) => {
  await authenticatePage(page, { email: DEMANDEUR_EMAIL });
  msw.use(
    makeDossiersHandler({ siret: emptyList, instructeur: errorResponse }),
  );

  await page.goto("/projets");

  await expect(
    page.getByText(/La liste des projets est incomplète/),
  ).toBeVisible();
  await expect(
    page.getByText(/Assurez-vous de vous connecter avec l'adresse/),
  ).toHaveCount(0);
});

test("le tri utilise toutes les dates de décision DN plutôt que l’ordre FV ou le numéro", async ({
  page,
  msw,
}) => {
  await authenticatePage(page, { email: DEMANDEUR_EMAIL });
  msw.use(
    makeDossiersHandler({
      siret: {
        success: true,
        count: 2,
        next_page: null,
        previous_page: null,
        data: [
          ...fondsVertDossiersListBySiretData.data,
          ...fondsVertDossiersListByInstructeurData.data,
        ],
      },
      instructeur: emptyList,
    }),
    ds.query("getDossier", ({ variables }) => {
      const data = makeDossierDataWithNumber(variables.number);
      return HttpResponse.json({
        data: {
          dossier: {
            ...data.data.dossier,
            annotations: data.data.dossier.annotations.map((champ) =>
              champ.champDescriptorId === "Q2hhbXAtMjk4MjQ5NA=="
                ? {
                    ...champ,
                    date:
                      variables.number === DOSSIER_NUMBER
                        ? "2026-10-01"
                        : "2024-01-01",
                  }
                : champ,
            ),
          },
        },
      });
    }),
  );

  await page.goto("/projets");

  const rows = page.getByRole("table").getByRole("row");
  await expect(rows).toHaveCount(3);
  await expect(rows.nth(1).getByRole("cell").first()).toHaveText(
    String(DOSSIER_NUMBER),
  );
  await expect(rows.nth(2).getByRole("cell").first()).toHaveText(
    String(INSTRUCTEUR_DOSSIER_NUMBER),
  );
});

test("displays error when both APIs fail", async ({ page, msw }) => {
  await authenticatePage(page, { email: DEMANDEUR_EMAIL });
  msw.use(
    makeDossiersHandler({ siret: errorResponse, instructeur: errorResponse }),
  );

  await page.goto("/projets");

  await expect(
    page.getByText("La liste de vos dossiers est temporairement indisponible"),
  ).toBeVisible();
});

test("displays empty state when no dossiers in any source", async ({
  page,
  msw,
}) => {
  await authenticatePage(page, { email: DEMANDEUR_EMAIL });
  msw.use(makeDossiersHandler({ siret: emptyList, instructeur: emptyList }));

  await page.goto("/projets");

  await expect(
    page.getByText(
      "Assurez-vous de vous connecter avec une adresse e-mail disposant d'un accès au projet dans Démarche numérique. Si vous avez besoin d'aide, n'hésitez pas à nous contacter.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(page.locator("main")).not.toContainText(
    "dépôt de votre demande",
  );
  await expect(page.locator("main")).not.toContainText(
    "votre groupe instructeur",
  );
});

for (const [situation, viewport] of [
  ["desktop", { width: 1280, height: 800 }],
  ["mobile", { width: 390, height: 844 }],
] as const) {
  test(`an authenticated laureat logs out using the ${situation} header and keyboard`, async ({
    page,
    msw,
  }) => {
    await page.setViewportSize(viewport);
    await authenticatePage(page, { email: DEMANDEUR_EMAIL });
    msw.use(makeDossiersHandler({ siret: emptyList, instructeur: emptyList }));
    await page.goto("/projets");

    if (situation === "mobile") {
      const menu = page.getByRole("button", { name: "Menu", exact: true });
      await expect(menu).toHaveAttribute("data-fr-js-modal-button", "true");
      await menu.press("Enter");
      await expect(page.locator("#header-menu-modal-fr-header")).toBeVisible();
    }
    const quickAccess = page.locator(
      situation === "mobile"
        ? "#fr-header-quick-access-item-0-mobile"
        : "#fr-header-quick-access-item-0",
    );
    await expect(quickAccess).toContainText(DEMANDEUR_EMAIL);
    const logout = quickAccess.getByRole("button", { name: "Se déconnecter" });
    await expect(logout).toBeVisible();
    await expect(logout).toHaveAttribute("type", "submit");

    const submitted = page.waitForResponse((response) =>
      response.url().endsWith("/api/auth/proconnect/logout"),
    );
    await logout.press("Enter");
    const response = await submitted;
    expect(response.request().method()).toBe("POST");
    expect(response.status()).toBe(303);
    await expect(page).toHaveURL("/");
    const cookies = await page.context().cookies();
    expect(
      cookies.find((cookie) => cookie.name === getSessionOptions().cookieName),
    ).toBeUndefined();
    await page.goto("/projets");
    await expect(page).toHaveURL(/\/connexion\?/);
  });
}
