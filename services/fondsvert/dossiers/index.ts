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
}): Promise<number[]> {
  const params = new URLSearchParams({
    ...defaultDossierSearchParams,
    siret,
  });

  const dossiersResult = await fetchFondsVert<{
    data: { socle_commun: { dossier_number: number } }[];
  }>(`dossiers?${params.toString()}`);

  if (!dossiersResult.success) {
    return [];
  }

  return dossiersResult.data.data.map(
    (dossier) => dossier.socle_commun.dossier_number,
  );
}
