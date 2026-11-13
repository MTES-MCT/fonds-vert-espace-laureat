import { expect, test } from "@playwright/test";

import { DEMO_POOL_NUMBER } from "@/utils/demo/reservation";

import { authenticatePage } from "./setup/auth";
import {
  deleteStoredDossierProgress,
  getStoredDossierProgressRevisions,
} from "./setup/db";

test.skip(
  process.env.DS_TOKEN !== "" ||
    process.env.CORRECTIONS_TEST_PROFILE !== "enabled",
  "Lancer npm run test:service-pause.",
);

const closureMessage = "Le service est actuellement fermé.";

test("une session encore valide ne permet ni d’accéder aux projets ni de passer par ProConnect pendant la pause", async ({
  page,
}) => {
  const email = "alice.doe@example.com";
  await authenticatePage(page, { email });
  await page.goto("/");
  await page
    .getByRole("main")
    .getByRole("link", { name: "Vert impact" })
    .click();

  await expect(page).toHaveURL(/\/connexion\?/);
  await expect(page.getByRole("main").getByRole("alert")).toHaveText(
    closureMessage,
  );
  await expect(
    page.locator('a[href^="/api/auth/proconnect/login"]'),
  ).toHaveCount(0);
  await expect(page.locator('a[href^="/projets/demo"]')).toHaveCount(0);
  await expect(page.getByText(email)).toHaveCount(0);

  for (const path of ["login", "login-callback", "logout-callback"]) {
    const response = await page.request.get(`/api/auth/proconnect/${path}`, {
      maxRedirects: 0,
    });
    expect(response.status(), path).toBe(303);
    expect(response.headers().location, path).toBe(
      new URL("/connexion", page.url()).href,
    );
  }

  const logout = await page.request.post("/api/auth/proconnect/logout", {
    headers: { origin: new URL(page.url()).origin },
    maxRedirects: 0,
  });
  expect(logout.status()).toBe(303);
  expect(logout.headers().location).toBe(
    new URL("/connexion", page.url()).href,
  );

  const projectView = await page.request.post("/api/session/project-view", {
    data: { view: "instructeur" },
    headers: { origin: new URL(page.url()).origin },
  });
  expect(projectView.status()).toBe(401);
  expect(await projectView.json()).toEqual({
    error: "Utilisateur non authentifié",
  });

  const progress = await page.request.post("/api/projets/89880032/progress", {
    data: { status: "En cours de réalisation", expectedRevision: 0 },
  });
  expect(progress.status()).toBe(401);
  expect(await progress.json()).toEqual({
    error: "Utilisateur non authentifié",
  });
});

test("un visiteur qui connaît l’adresse de la démo retrouve son avancement enregistré pendant la pause", async ({
  page,
}) => {
  await deleteStoredDossierProgress(DEMO_POOL_NUMBER);
  try {
    await page.goto("/projets/demo");
    await page
      .getByRole("link", { name: "Rénovation de la piscine Jacques Demy" })
      .click();
    await page.getByRole("button", { name: "Modifier l’avancement" }).click();

    const editor = page.getByRole("dialog", { name: "Modifier l’avancement" });
    await editor
      .getByRole("combobox", { name: "Avancement du projet" })
      .selectOption("En cours de réalisation");
    await editor.getByRole("button", { name: "Enregistrer" }).click();
    await expect(editor).toBeHidden();

    await page.reload();
    await expect(
      page.getByTestId("project-progress-row").getByRole("button", {
        name: "En cours de réalisation",
        exact: true,
      }),
    ).toBeVisible();
    expect(await getStoredDossierProgressRevisions(DEMO_POOL_NUMBER)).toEqual([
      expect.objectContaining({
        status: "En cours de réalisation",
        author_email: null,
      }),
    ]);
  } finally {
    await deleteStoredDossierProgress(DEMO_POOL_NUMBER);
  }
});

test("l’API des corrections réelles reste fermée à une machine autorisée pendant la pause", async ({
  request,
}) => {
  const response = await request.get("/api/v1/corrections", {
    headers: {
      authorization: `Bearer ${process.env.CORRECTIONS_API_KEY}`,
      "x-corrections-ingress": process.env.CORRECTIONS_INGRESS_SECRET!,
      "x-corrections-client-ip": "192.0.2.10",
      "x-corrections-proto": "https",
    },
  });
  expect(response.status()).toBe(503);
  expect(response.headers()["cache-control"]).toBe("no-store");
  expect(await response.json()).toEqual({ error: "unavailable" });
});
