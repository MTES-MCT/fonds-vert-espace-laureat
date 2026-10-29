import {
  expect,
  graphql,
  http,
  HttpResponse,
  test,
} from "next/experimental/testmode/playwright/msw";

import { getSessionOptions } from "@/utils/session";

import { DOSSIER_NUMBER, INSTRUCTEUR_EMAIL } from "./fixtures/constants";
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
              error_indicateur_list: ["Signalement privé"],
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
    page.getByText("Assurez-vous de vous connecter avec l'adresse e-mail"),
  ).toBeVisible();
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
