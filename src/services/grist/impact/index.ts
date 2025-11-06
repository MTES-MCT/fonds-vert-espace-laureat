import { Metrics, SocleCommun } from "@/services/fondsvert/dossier";
import { requireEnv } from "@/utils/env";

type GristImpactRecord = {
  fields: {
    action: string[];
    metriques_API_Field_Name: string;
    champ_id_ds: string;
    champ_type: string;
  };
};

type Mapping = {
  champNumeroDossier: string;
  champsMetriques: Record<string, string>;
  champsSocleCommun: Record<string, string>;
};

export async function fetchPrefillMapping(): Promise<Mapping> {
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
      record.fields.action.includes("à préremplir en entrée") &&
      record.fields.metriques_API_Field_Name !== "",
  );

  const champNumeroDossierRecord = data.records.find(
    (record: GristImpactRecord) =>
      record.fields.champ_type === "Lien vers un autre dossier",
  );

  if (!champNumeroDossierRecord) {
    throw new Error(
      "Impossible de trouver le champ numéro de dossier dans le mapping Grist",
    );
  }

  const champNumeroDossier = champNumeroDossierRecord.fields.champ_id_ds;

  const champsMetriques = prefillRecords.reduce(
    (acc: Record<string, string>, record: GristImpactRecord) => {
      acc[record.fields.metriques_API_Field_Name] = record.fields.champ_id_ds;
      return acc;
    },
    {},
  );

  const socleCommunFieldNames = [
    "demarche_title",
    "date_engagement_premiere_depense",
    "date_achevement_depenses_financees",
    "total_des_depenses",
  ];

  const champsSocleCommun = data.records
    .filter(
      (record: GristImpactRecord) =>
        record.fields.action.includes("à préremplir en entrée") &&
        socleCommunFieldNames.includes(record.fields.metriques_API_Field_Name),
    )
    .reduce((acc: Record<string, string>, record: GristImpactRecord) => {
      acc[record.fields.metriques_API_Field_Name] = record.fields.champ_id_ds;
      return acc;
    }, {});

  return {
    champNumeroDossier,
    champsMetriques,
    champsSocleCommun,
  };
}

let _prefillMappingCached: Mapping | undefined;

export async function getPrefillMappingCached() {
  if (!_prefillMappingCached) {
    _prefillMappingCached = await fetchPrefillMapping();
  }
  return _prefillMappingCached;
}

export type ImpactPrefillParams = {
  numeroDossier: number;
  metriques?: Metrics;
  socleCommun?: SocleCommun;
  nocache?: boolean;
};

export async function buildImpactPrefillUrl({
  numeroDossier,
  metriques,
  socleCommun,
  nocache = false,
}: ImpactPrefillParams) {
  const [dsImpactUrl] = requireEnv("DS_IMPACT_URL");

  const prefillMapping = nocache
    ? await fetchPrefillMapping()
    : await getPrefillMappingCached();

  const metricValues = metriques
    ? Object.fromEntries(
        Object.entries(metriques)
          .filter(([, m]) => m.valeur_estimee !== null)
          .map(([key, m]) => [key, m.valeur_estimee]),
      )
    : {};

  const socleValues = socleCommun
    ? {
        demarche_title: socleCommun.demarche_title,
        date_engagement_premiere_depense: socleCommun.date_debut_execution,
        date_achevement_depenses_financees: socleCommun.date_fin_execution,
        total_des_depenses: socleCommun.total_des_depenses,
      }
    : {};

  const allMappings = {
    ...prefillMapping.champsMetriques,
    ...prefillMapping.champsSocleCommun,
  };

  const allValues = { ...metricValues, ...socleValues };

  const prefilledDsImpactUrl = new URL(dsImpactUrl);

  for (const [fieldName, fieldValue] of Object.entries(allValues)) {
    const champId = allMappings[fieldName];
    if (champId && fieldValue !== null) {
      if (Array.isArray(fieldValue)) {
        fieldValue.forEach((value) => {
          prefilledDsImpactUrl.searchParams.append(
            `champ_${champId}[]`,
            String(value),
          );
        });
      } else {
        prefilledDsImpactUrl.searchParams.append(
          `champ_${champId}`,
          String(fieldValue),
        );
      }
    }
  }

  prefilledDsImpactUrl.searchParams.append(
    `champ_${prefillMapping.champNumeroDossier}`,
    String(numeroDossier),
  );

  return prefilledDsImpactUrl.toString();
}
