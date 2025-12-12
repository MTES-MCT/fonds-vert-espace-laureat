import {
  expect,
  graphql,
  http,
  HttpResponse,
  test,
} from "next/experimental/testmode/playwright/msw";

import {
  DEMANDEUR_EMAIL,
  DOSSIER_NUMBER,
  INSTRUCTEUR_EMAIL,
} from "./fixtures/constants";
import { getDossierData, makeDossierDataForInstructeur } from "./fixtures/ds";
import {
  fondsVertLoginData,
  INSTRUCTEUR_DOSSIER_NUMBER,
} from "./fixtures/fondsvert";
import { authenticatePage } from "./setup/auth";

const ds = graphql.link("https://www.demarches-simplifiees.fr/api/v2/graphql");

type DossiersResponse =
  | { success: true; data: { socle_commun: { dossier_number: number } }[] }
  | { success: false };

const emptyList: DossiersResponse = { success: true, data: [] };
const siretList: DossiersResponse = {
  success: true,
  data: [{ socle_commun: { dossier_number: DOSSIER_NUMBER } }],
};
const instructeurList: DossiersResponse = {
  success: true,
  data: [{ socle_commun: { dossier_number: INSTRUCTEUR_DOSSIER_NUMBER } }],
};
const errorResponse: DossiersResponse = { success: false };

function makeDossiersHandler({
  siret,
  instructeur,
}: {
  siret: DossiersResponse;
  instructeur: DossiersResponse;
}) {
  return http.get("http://fondsvert/fonds_vert/dossiers", ({ request }) => {
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
        return HttpResponse.json({ data: [] });
      }
      return HttpResponse.json(instructeur);
    }

    return HttpResponse.json({ data: [] });
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

  await page.goto("/espace-laureat");

  await expect(page.getByText(String(DOSSIER_NUMBER))).toBeVisible();
  await expect(
    page.getByText(String(INSTRUCTEUR_DOSSIER_NUMBER)),
  ).not.toBeVisible();
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

  await page.goto("/espace-laureat");

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

  await page.goto("/espace-laureat");

  await expect(page.getByText(String(DOSSIER_NUMBER))).toBeVisible();
});

test("displays only instructeur dossiers when SIRET API fails", async ({
  page,
  msw,
}) => {
  await authenticatePage(page, { email: INSTRUCTEUR_EMAIL });
  msw.use(
    makeDossiersHandler({ siret: errorResponse, instructeur: instructeurList }),
  );

  await page.goto("/espace-laureat");

  await expect(
    page.getByText(String(INSTRUCTEUR_DOSSIER_NUMBER)),
  ).toBeVisible();
});

test("displays error when both APIs fail", async ({ page, msw }) => {
  await authenticatePage(page, { email: DEMANDEUR_EMAIL });
  msw.use(
    makeDossiersHandler({ siret: errorResponse, instructeur: errorResponse }),
  );

  await page.goto("/espace-laureat");

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

  await page.goto("/espace-laureat");

  await expect(
    page.getByText("Assurez-vous de vous connecter avec l'adresse e-mail"),
  ).toBeVisible();
});
