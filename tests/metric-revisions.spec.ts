import { expect, test } from "@playwright/test";

import type { DossierMetricRevisionTarget } from "@/db/dossierMetrics";
import { keepNewestMetricRevision } from "@/utils/metrics/revisions";

function target(
  revision: number,
  effectiveValue: number,
): DossierMetricRevisionTarget {
  return {
    metricCode: "surface",
    revision,
    label: "Surface",
    unit: "ha",
    valueType: "number",
    sourceValue: 1,
    effectiveValue,
  };
}

test("keeps the newest client revision when responses arrive out of order", () => {
  const newestResponse = target(3, 30);
  const olderResponse = target(2, 20);

  expect(keepNewestMetricRevision(newestResponse, olderResponse)).toBe(
    newestResponse,
  );
});
