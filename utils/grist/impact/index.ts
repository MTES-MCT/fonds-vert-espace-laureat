import { requireEnv } from "@/utils/env";

type GristImpactRecord = {
  fields: {
    action: string;
    metriques_API_Field_Name: string;
    champ_id_ds: string;
  };
};

export async function fetchPrefillMapping(): Promise<Record<string, string>> {
  const [docId, apiKey, apiEndpoint] = requireEnv(
    "GRIST_DOC_ID",
    "GRIST_API_KEY",
    "GRIST_API_ENDPOINT",
  );

  const url = `${apiEndpoint}/docs/${docId}/tables/Champs_DS/records`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Impossible de récupérer le mapping de pré-remplissage du formulaire d'impact (${response.status})`,
    );
  }

  const data = await response.json();

  const prefillRecords = data.records.filter(
    (record: GristImpactRecord) =>
      record.fields.action === "à préremplir en entrée" &&
      record.fields.metriques_API_Field_Name !== "",
  );

  return prefillRecords.reduce(
    (acc: Record<string, string>, record: GristImpactRecord) => {
      acc[record.fields.metriques_API_Field_Name] = record.fields.champ_id_ds;
      return acc;
    },
    {},
  );
}
