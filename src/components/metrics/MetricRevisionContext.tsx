"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import type { DossierMetricRevisionTarget } from "@/db/dossierMetrics";
import type { MetricValue } from "@/services/fondsvert/dossier";
import { keepNewestMetricRevision } from "@/utils/metrics/revisions";
import { metricValuesEqual } from "@/utils/metrics/values";

type MetricRevisionContextValue = {
  targets: Record<string, DossierMetricRevisionTarget>;
  correctMetric: (
    metricCode: string,
    value: MetricValue,
  ) => Promise<DossierMetricRevisionTarget>;
};

const MetricRevisionContext = createContext<MetricRevisionContextValue | null>(
  null,
);

export function MetricRevisionProvider({
  dossierNumber,
  initialTargets,
  demo,
  children,
}: {
  dossierNumber: number;
  initialTargets: Record<string, DossierMetricRevisionTarget>;
  demo?: boolean;
  children: ReactNode;
}) {
  const [correctedTargets, setCorrectedTargets] = useState<
    Record<string, DossierMetricRevisionTarget>
  >({});
  const targets = useMemo(() => {
    const mergedTargets = { ...initialTargets };

    for (const [metricCode, target] of Object.entries(correctedTargets)) {
      mergedTargets[metricCode] = keepNewestMetricRevision(
        mergedTargets[metricCode],
        target,
      );
    }

    return mergedTargets;
  }, [correctedTargets, initialTargets]);

  const correctMetric = useCallback(
    async (metricCode: string, value: MetricValue) => {
      const currentTarget = targets[metricCode];

      if (!currentTarget) {
        throw new Error("Métrique inconnue pour ce dossier");
      }

      let updatedTarget: DossierMetricRevisionTarget;

      if (demo) {
        const unchanged = metricValuesEqual(
          currentTarget.effectiveValue,
          value,
        );
        updatedTarget = {
          ...currentTarget,
          revision: unchanged
            ? currentTarget.revision
            : currentTarget.revision + 1,
          effectiveValue: value,
        };
      } else {
        const response = await fetch(
          `/api/projets/${dossierNumber}/metrics/${encodeURIComponent(metricCode)}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ value }),
          },
        );
        const body = (await response.json().catch(() => ({}))) as {
          target?: DossierMetricRevisionTarget;
          error?: string;
        };

        if (!response.ok || !body.target) {
          throw new Error(
            body.error ?? "La correction n’a pas pu être enregistrée.",
          );
        }

        updatedTarget = body.target;
      }

      setCorrectedTargets((current) => {
        const currentTarget = current[metricCode] ?? targets[metricCode];

        return {
          ...current,
          [metricCode]: keepNewestMetricRevision(currentTarget, updatedTarget),
        };
      });

      return updatedTarget;
    },
    [demo, dossierNumber, targets],
  );

  const value = useMemo(
    () => ({ targets, correctMetric }),
    [correctMetric, targets],
  );

  return (
    <MetricRevisionContext.Provider value={value}>
      {children}
    </MetricRevisionContext.Provider>
  );
}

export function useMetricRevisions(): MetricRevisionContextValue {
  const context = useContext(MetricRevisionContext);

  if (!context) {
    throw new Error(
      "useMetricRevisions doit être utilisé dans MetricRevisionProvider",
    );
  }

  return context;
}
