export interface AnomaliesFondsVert {
  est_anomalie: boolean | null;
  est_error: boolean | null;
  anomalie_demarche_list: string[] | null;
  anomalie_indicateur_list: string[] | null;
  error_indicateur_list: string[] | null;
}

export type AnomaliesSection =
  | {
      status: "loaded" | "incomplete" | "invalid";
      data: AnomaliesFondsVert;
      diagnostics: string[];
    }
  | { status: "absent" | "unavailable" };

export type AvertissementsSection =
  | { status: "loaded"; data: string[] }
  | { status: "absent" | "invalid" | "unavailable" };

export interface FondsVertSignals {
  anomalies: AnomaliesSection;
  avertissements: AvertissementsSection;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((entry) => typeof entry === "string")
  );
}

export function readAnomalies(value: unknown): AnomaliesSection {
  if (value === undefined || value === null) {
    return { status: "absent" };
  }

  const data: AnomaliesFondsVert = {
    est_anomalie: null,
    est_error: null,
    anomalie_demarche_list: null,
    anomalie_indicateur_list: null,
    error_indicateur_list: null,
  };
  if (!isRecord(value)) {
    return { status: "invalid", data, diagnostics: ["anomalies:invalid"] };
  }

  const diagnostics: string[] = [];
  let invalid = false;
  for (const key of ["est_anomalie", "est_error"] as const) {
    const entry = value[key];
    if (typeof entry === "boolean") {
      data[key] = entry;
    } else {
      const missing = entry === undefined || entry === null;
      diagnostics.push(`${key}:${missing ? "missing" : "invalid"}`);
      invalid ||= !missing;
    }
  }
  for (const key of [
    "anomalie_demarche_list",
    "anomalie_indicateur_list",
    "error_indicateur_list",
  ] as const) {
    const entry = value[key];
    if (isStringArray(entry)) {
      data[key] = entry;
    } else {
      const missing = entry === undefined || entry === null;
      diagnostics.push(`${key}:${missing ? "missing" : "invalid"}`);
      invalid ||= !missing;
    }
  }

  for (const [flag, labels] of [
    ["est_anomalie", "anomalie_indicateur_list"],
    ["est_error", "error_indicateur_list"],
  ] as const) {
    if (
      data[flag] !== null &&
      data[labels] !== null &&
      data[flag] !== data[labels].length > 0
    ) {
      diagnostics.push(`${flag}:contradictory-labels`);
    }
  }

  return {
    status: invalid
      ? "invalid"
      : diagnostics.length > 0
        ? "incomplete"
        : "loaded",
    data,
    diagnostics,
  };
}

export function readAvertissements(value: unknown): AvertissementsSection {
  if (value === undefined || value === null) {
    return { status: "absent" };
  }
  return isStringArray(value)
    ? { status: "loaded", data: value }
    : { status: "invalid" };
}

export function readFondsVertSignals(
  value: Record<string, unknown>,
): FondsVertSignals {
  return {
    anomalies: readAnomalies(value.anomalies),
    avertissements: readAvertissements(value.avertissements),
  };
}

export function unavailableFondsVertSignals(): FondsVertSignals {
  return {
    anomalies: { status: "unavailable" },
    avertissements: { status: "unavailable" },
  };
}
