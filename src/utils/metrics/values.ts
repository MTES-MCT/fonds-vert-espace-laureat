import type { MetricValue } from "@/services/fondsvert/dossier";
import type { classifyMetricValue } from "@/utils/metrics/guards";

export type MetricValueType = ReturnType<
  typeof classifyMetricValue
>["valueType"];

export type MetricValueValidation =
  | { success: true; value: MetricValue }
  | {
      success: false;
      reason: "invalid-type" | "empty-value" | "duplicate-value";
      invalidIndex?: number;
    };

export function normalizeMetricValue(
  valueType: MetricValueType,
  value: unknown,
): MetricValueValidation {
  switch (valueType) {
    case "number":
      return typeof value === "number" && Number.isFinite(value)
        ? { success: true, value }
        : { success: false, reason: "invalid-type" };
    case "text": {
      if (typeof value !== "string") {
        return { success: false, reason: "invalid-type" };
      }

      const normalizedValue = value.trim();
      return normalizedValue.length > 0
        ? { success: true, value: normalizedValue }
        : { success: false, reason: "empty-value" };
    }
    case "boolean":
      return typeof value === "boolean"
        ? { success: true, value }
        : { success: false, reason: "invalid-type" };
    case "text_array": {
      if (
        !Array.isArray(value) ||
        value.length === 0 ||
        !value.every((item) => typeof item === "string")
      ) {
        return { success: false, reason: "invalid-type" };
      }

      const normalizedValues = value.map((item) => item.trim());
      const emptyIndex = normalizedValues.findIndex(
        (item) => item.length === 0,
      );
      if (emptyIndex !== -1) {
        return {
          success: false,
          reason: "empty-value",
          invalidIndex: emptyIndex,
        };
      }

      const seenValues = new Set<string>();
      const duplicateIndex = normalizedValues.findIndex((item) => {
        const comparableValue = item.toLocaleLowerCase("fr");
        if (seenValues.has(comparableValue)) return true;
        seenValues.add(comparableValue);
        return false;
      });
      if (duplicateIndex !== -1) {
        return {
          success: false,
          reason: "duplicate-value",
          invalidIndex: duplicateIndex,
        };
      }

      return { success: true, value: normalizedValues };
    }
  }
}

export function metricValuesEqual(
  left: MetricValue,
  right: MetricValue,
): boolean {
  if (Array.isArray(left) && Array.isArray(right)) {
    return (
      left.length === right.length &&
      left.every((value, index) => value === right[index])
    );
  }

  return left === right;
}
