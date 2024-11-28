import { URLSearchParams } from "url";

import { logException } from "@/utils/error";

function error(message: string) {
  console.error(message);
  return [];
}

function defaultHeaders({ token }: { token?: string } = {}) {
  return {
    Accept: "application/json",
    Authorization: token ? `Bearer ${token}` : "Bearer",
  };
}

const defaultDossierSearchParams = {
  statut: "Accepté",
  include_metrics: "false",
  type_export: "JSON",
  page: "1",
  per_page: "100",
};

export async function getDossierNumbers({
  siret,
}: {
  siret: string;
}): Promise<number[]> {
  const endpoint = process.env.FONDSVERT_API_ENDPOINT;
  const username = process.env.FONDSVERT_API_USERNAME;
  const password = process.env.FONDSVERT_API_PASSWORD;

  if (!endpoint || !username || !password) {
    return error(
      "Les variables d'environnement FONDSVERT_API_ENDPOINT, FONDSVERT_API_USERNAME et FONDSVERT_API_PASSWORD doivent être définies.",
    );
  }

  try {
    const loginResponse = await fetch(new URL("/fonds_vert/login", endpoint), {
      method: "POST",
      headers: {
        ...defaultHeaders(),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        username,
        password,
      }),
    });

    if (!loginResponse.ok) {
      return error(`Erreur d'authentification : ${loginResponse.statusText}`);
    }

    const loginData = await loginResponse.json();
    const token = loginData.access_token;

    if (!token) {
      return error("Aucun jeton d'accès n'a été reçu");
    }

    const params = new URLSearchParams({
      ...defaultDossierSearchParams,
      siret,
    });

    const dossiersResponse = await fetch(
      new URL(`/fonds_vert/dossiers?${params.toString()}`, endpoint),
      {
        method: "GET",
        headers: {
          ...defaultHeaders({ token }),
        },
      },
    );

    if (dossiersResponse.status === 404) {
      return error(`Aucun dossier n'a été trouvé pour le siret ${siret}`);
    }

    if (!dossiersResponse.ok) {
      return error(
        `Une erreur est survenue lors de la récupération des dossiers : ${dossiersResponse.statusText}`,
      );
    }

    const dossiersData = await dossiersResponse.json();
    
    return dossiersData.data.map(
      (dossier: { socle_commun: { dossier_number: number } }) =>
        dossier.socle_commun.dossier_number,
    );
  } catch (e) {
    logException(e);
    return error("Une erreur imprévue est survenue");
  }
}
