import type { MetricValue } from "@/services/fondsvert/dossier";

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
