type GristImpactRecord = {
  fields: {
    action: string;
    metriques_API_Field_Name: string;
    champ_id_ds: string;
  };
};

export async function fetchPrefillMapping(): Promise<Record<string, string>> {
  const docId = process.env.GRIST_DOC_ID;
  const apiKey = process.env.GRIST_API_KEY;
  const apiEndpoint = process.env.GRIST_API_ENDPOINT;

  if (!docId || !apiKey || !apiEndpoint) {
    throw new Error(
      "Les variables d'environnement RIST_DOC_ID, GRIST_API_KEY et GRIST_API_ENDPOINT doivent être définies.",
    );
  }

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
