import { URLSearchParams } from "url";

import {
  type FondsVertSignals,
  isRecord,
  readFondsVertSignals,
} from "@/services/fondsvert/anomalies";
import type { SocleCommun } from "@/services/fondsvert/dossier";
import { fetchFondsVert } from "@/services/fondsvert/helpers";

const defaultDossierSearchParams = {
  include_metrics: "false",
  include_finances: "false",
  include_anomalies: "true",
  type_export: "JSON",
  per_page: "100",
};

export interface DossierFondsVertSummary {
  numeroDossier: number;
  socleCommun:
    | {
        [Key in
          | "entreprise_raison_sociale"
          | "nom_commune"
          | "annee_millesime"]?: SocleCommun[Key] | null;
      }
    | null;
  signals: FondsVertSignals;
}

type DossierNumbersResult =
  | {
      success: true;
      data: number[];
      summaries: Record<number, DossierFondsVertSummary>;
      completeness: "complete" | "partial";
    }
  | { success: false; error: string };

const unavailableMessage =
  "La liste de vos projets est temporairement indisponible. Vous pouvez ouvrir un projet depuis le lien reçu par courriel de Démarche numérique.";

function readSummary(value: unknown): DossierFondsVertSummary | null {
  if (!isRecord(value) || !isRecord(value.socle_commun)) return null;
  const socle = value.socle_commun;
  const number = socle.dossier_number;
  if (
    typeof number !== "number" ||
    !Number.isSafeInteger(number) ||
    number <= 0
  )
    return null;
  const socleCommun: NonNullable<DossierFondsVertSummary["socleCommun"]> = {};
  for (const key of ["entreprise_raison_sociale", "nom_commune"] as const) {
    if (key in socle)
      socleCommun[key] = typeof socle[key] === "string" ? socle[key] : null;
  }
  if ("annee_millesime" in socle) {
    socleCommun.annee_millesime =
      typeof socle.annee_millesime === "number" &&
      Number.isFinite(socle.annee_millesime)
        ? socle.annee_millesime
        : null;
  }
  return {
    numeroDossier: number,
    socleCommun,
    signals: readFondsVertSignals(value),
  };
}

function nextPage(value: string): number | null {
  try {
    const page = new URL(value, "https://pagination.invalid").searchParams.get(
      "page",
    );
    if (!page || !/^[1-9]\d*$/.test(page)) return null;
    const number = Number(page);
    return Number.isSafeInteger(number) ? number : null;
  } catch {
    return null;
  }
}

async function getDossiers(
  filters: Record<string, string>,
): Promise<DossierNumbersResult> {
  const summaries: Record<number, DossierFondsVertSummary> = {};
  const pages = new Set<number>();
  let page = 1;
  let expectedCount: number | undefined;
  let receivedCount = 0;
  let complete = true;
  let receivedPage = false;

  while (true) {
    if (pages.has(page)) {
      complete = false;
      break;
    }
    pages.add(page);
    const params = new URLSearchParams({
      ...defaultDossierSearchParams,
      ...filters,
      page: String(page),
    });
    const response = await fetchFondsVert<unknown>(
      `v2/dossiers?${params.toString()}`,
    );
    if (!response.success || !isRecord(response.data)) {
      complete = false;
      break;
    }
    const envelope = response.data;
    const values = Array.isArray(envelope.data)
      ? envelope.data
      : isRecord(envelope.data)
        ? envelope.count === 0 && Object.keys(envelope.data).length === 0
          ? []
          : [envelope.data]
        : null;
    if (!values) {
      complete = false;
      break;
    }
    receivedPage = true;
    receivedCount += values.length;
    for (const value of values) {
      const summary = readSummary(value);
      if (summary)
        summaries[summary.numeroDossier] = mergeSummary(
          summaries[summary.numeroDossier],
          summary,
        );
      else complete = false;
    }
    const count = envelope.count;
    if (
      typeof count !== "number" ||
      !Number.isSafeInteger(count) ||
      count < 0 ||
      (expectedCount !== undefined && expectedCount !== count)
    ) {
      complete = false;
      break;
    }
    expectedCount = count;
    if (
      (envelope.previous_page !== null &&
        typeof envelope.previous_page !== "string") ||
      (envelope.next_page !== null && typeof envelope.next_page !== "string")
    ) {
      complete = false;
      break;
    }
    if (envelope.next_page === null) {
      if (receivedCount !== count || Object.keys(summaries).length !== count)
        complete = false;
      break;
    }
    if (values.length === 0 || receivedCount >= count) {
      complete = false;
      break;
    }
    const next = nextPage(envelope.next_page as string);
    if (next === null) {
      complete = false;
      break;
    }
    page = next;
  }

  if (!receivedPage) return { success: false, error: unavailableMessage };
  return {
    success: true,
    data: Object.values(summaries).map((summary) => summary.numeroDossier),
    summaries,
    completeness: complete ? "complete" : "partial",
  };
}

export function getDossierNumbers({
  siret,
}: {
  siret: string;
}): Promise<DossierNumbersResult> {
  return getDossiers({ siret });
}

export function getDossierNumbersForInstructeur({
  email,
}: {
  email: string;
}): Promise<DossierNumbersResult> {
  return getDossiers({ instructeur__instructeur_email: email });
}

function mergeSignals(
  first: FondsVertSignals,
  second: FondsVertSignals,
): FondsVertSignals {
  const a = first.anomalies;
  const b = second.anomalies;
  let anomalies: FondsVertSignals["anomalies"];
  if (!("data" in a)) anomalies = "data" in b || a.status === "absent" ? b : a;
  else if (!("data" in b)) anomalies = a;
  else {
    const boolean = (left: boolean | null, right: boolean | null) =>
      left === null ? right : right === null ? left : left || right;
    const labels = (left: string[] | null, right: string[] | null) =>
      left === null
        ? right
        : right === null
          ? left
          : [...new Set([...left, ...right])];
    const diagnostics = [...new Set([...a.diagnostics, ...b.diagnostics])];
    if (JSON.stringify(a.data) !== JSON.stringify(b.data))
      diagnostics.push("sources:conflicting-anomalies");
    anomalies = {
      status:
        a.status === "invalid" || b.status === "invalid"
          ? "invalid"
          : diagnostics.length > 0
            ? "incomplete"
            : "loaded",
      data: {
        est_anomalie: boolean(a.data.est_anomalie, b.data.est_anomalie),
        est_error: boolean(a.data.est_error, b.data.est_error),
        anomalie_demarche_list: labels(
          a.data.anomalie_demarche_list,
          b.data.anomalie_demarche_list,
        ),
        anomalie_indicateur_list: labels(
          a.data.anomalie_indicateur_list,
          b.data.anomalie_indicateur_list,
        ),
        error_indicateur_list: labels(
          a.data.error_indicateur_list,
          b.data.error_indicateur_list,
        ),
      },
      diagnostics,
    };
  }
  const firstWarnings = first.avertissements;
  const secondWarnings = second.avertissements;
  let avertissements: FondsVertSignals["avertissements"];
  if ("data" in firstWarnings || "data" in secondWarnings) {
    const incomplete = [firstWarnings, secondWarnings].some(
      (section) => section.status !== "loaded" && section.status !== "absent",
    );
    avertissements = {
      status: incomplete ? "incomplete" : "loaded",
      data: [
        ...new Set([
          ...("data" in firstWarnings ? firstWarnings.data : []),
          ...("data" in secondWarnings ? secondWarnings.data : []),
        ]),
      ],
    };
  } else {
    avertissements =
      firstWarnings.status === "absent" ? secondWarnings : firstWarnings;
  }
  return { anomalies, avertissements };
}

function mergeSummary(
  existing: DossierFondsVertSummary | undefined,
  summary: DossierFondsVertSummary,
): DossierFondsVertSummary {
  return existing
    ? {
        ...summary,
        socleCommun: { ...existing.socleCommun, ...summary.socleCommun },
        signals: mergeSignals(existing.signals, summary.signals),
      }
    : summary;
}

export async function getAllDossierNumbers({
  siret,
  email,
  global = false,
}: {
  siret: string;
  email: string;
  global?: boolean;
}): Promise<DossierNumbersResult> {
  if (global) return getDossiers({});
  const results = await Promise.all([
    getDossierNumbers({ siret }),
    getDossierNumbersForInstructeur({ email }),
  ]);
  const successful = results.filter((result) => result.success);
  if (successful.length === 0)
    return { success: false, error: unavailableMessage };
  const summaries: Record<number, DossierFondsVertSummary> = {};
  for (const source of successful) {
    for (const summary of Object.values(source.summaries)) {
      summaries[summary.numeroDossier] = mergeSummary(
        summaries[summary.numeroDossier],
        summary,
      );
    }
  }
  const complete =
    successful.length === results.length &&
    successful.every((source) => source.completeness === "complete");
  return {
    success: true,
    data: Object.values(summaries).map((summary) => summary.numeroDossier),
    summaries,
    completeness: complete ? "complete" : "partial",
  };
}
