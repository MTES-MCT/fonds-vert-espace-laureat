import { URLSearchParams } from "url";

import { fetchFondsVert } from "@/services/fondsvert/helpers";

const defaultDossierSearchParams = {
  state: "Accepté",
  include_metrics: "false",
  type_export: "JSON",
  page: "1",
  per_page: "100",
};

type DossierNumbersResult =
  | { success: true; data: number[] }
  | { success: false; error: string };

export async function getDossierNumbers({
  siret,
}: {
  siret: string;
}): Promise<DossierNumbersResult> {
  const params = new URLSearchParams({
    ...defaultDossierSearchParams,
    siret,
  });

  const dossiersResult = await fetchFondsVert<{
    data: { socle_commun: { dossier_number: number } }[];
  }>(`dossiers?${params.toString()}`);

  if (!dossiersResult.success && dossiersResult.status === 404) {
    return {
      success: true,
      data: [],
    };
  }

  if (!dossiersResult.success) {
    console.error(
      `Impossible récupérer les dossiers à partir de l'API Fonds Vert (${dossiersResult.statusText}).`,
    );
    return {
      success: false,
      error: `La liste de vos dossiers est temporairement indisponible. Cependant, vous pouvez accéder directement à l’un de vos dossiers via un email de Démarches Simplifiées.`,
    };
  }

  return {
    success: true,
    data: dossiersResult.data.data.map(
      (dossier) => dossier.socle_commun.dossier_number,
    ),
  };
}

export async function getDossierNumbersForInstructeur({
  email,
}: {
  email: string;
}): Promise<DossierNumbersResult> {
  const params = new URLSearchParams({
    ...defaultDossierSearchParams,
    instructeur__instructeur_email: email,
  });

  const dossiersResult = await fetchFondsVert<{
    data: { socle_commun: { dossier_number: number } }[];
  }>(`dossiers?${params.toString()}`);

  if (!dossiersResult.success && dossiersResult.status === 404) {
    return {
      success: true,
      data: [],
    };
  }

  if (!dossiersResult.success) {
    console.error(
      `Impossible récupérer les dossiers instructeur à partir de l'API Fonds Vert (${dossiersResult.statusText}).`,
    );
    return {
      success: false,
      error: `La liste des dossiers que vous instruisez est temporairement indisponible.`,
    };
  }

  return {
    success: true,
    data: dossiersResult.data.data.map(
      (dossier) => dossier.socle_commun.dossier_number,
    ),
  };
}

export async function getAllDossierNumbers({
  siret,
  email,
}: {
  siret: string;
  email: string;
}): Promise<DossierNumbersResult> {
  const [bySiretResult, byInstructeurResult] = await Promise.all([
    getDossierNumbers({ siret }),
    getDossierNumbersForInstructeur({ email }),
  ]);

  if (!bySiretResult.success && !byInstructeurResult.success) {
    return {
      success: false,
      error: bySiretResult.error,
    };
  }

  const allNumbers = new Set([
    ...(bySiretResult.success ? bySiretResult.data : []),
    ...(byInstructeurResult.success ? byInstructeurResult.data : []),
  ]);

  return {
    success: true,
    data: Array.from(allNumbers),
  };
}
