import { URLSearchParams } from "url";

import { fetchFondsVert } from "@/services/fondsvert/helpers";

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
}): Promise<
  { success: true; data: number[] } | { success: false; error: string }
> {
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
