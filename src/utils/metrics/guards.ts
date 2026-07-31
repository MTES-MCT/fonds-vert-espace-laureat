import type { MetricFields, MetricValue } from "@/services/fondsvert/dossier";

export function classifyMetricValue(
  value: MetricValue,
):
  | { valueType: "number"; value: number }
  | { valueType: "text"; value: string }
  | { valueType: "boolean"; value: boolean }
  | { valueType: "text_array"; value: string[] } {
  if (typeof value === "number") return { valueType: "number", value };
  if (typeof value === "string") return { valueType: "text", value };
  if (typeof value === "boolean") return { valueType: "boolean", value };
  return { valueType: "text_array", value };
}

function isMetricValue(value: unknown): value is MetricValue {
  return (
    (typeof value === "number" && Number.isFinite(value)) ||
    typeof value === "string" ||
    typeof value === "boolean" ||
    (Array.isArray(value) && value.every((item) => typeof item === "string"))
  );
}

export function isMetricFields(value: unknown): value is MetricFields {
  return (
    typeof value === "object" &&
    value !== null &&
    "label" in value &&
    "unite" in value &&
    "valeur_estimee" in value &&
    typeof value.label === "string" &&
    value.label.length > 0 &&
    (value.unite === null || typeof value.unite === "string") &&
    isMetricValue(value.valeur_estimee)
  );
}

export function isDisplayableMetricFields(
  value: unknown,
): value is MetricFields {
  return (
    isMetricFields(value) && !value.label.includes("Donnée non disponible")
  );
}
