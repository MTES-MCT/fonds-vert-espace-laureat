"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import { successToast } from "@/components/toast/toast";
import type { DossierMetricRevisionTarget } from "@/db/dossierMetrics";
import type { MetricValue } from "@/services/fondsvert/dossier";
import { keepNewestMetricRevision } from "@/utils/metrics/revisions";

type MetricRevisionContextValue = {
  targets: Record<string, DossierMetricRevisionTarget>;
  correctMetric: (
    metricCode: string,
    value: MetricValue,
    expectedRevision: number,
  ) => Promise<DossierMetricRevisionTarget>;
};

const MetricRevisionContext = createContext<MetricRevisionContextValue | null>(
  null,
);

type CorrectedTarget = {
  target: DossierMetricRevisionTarget;
  replacedInitialTarget?: DossierMetricRevisionTarget;
};

export class MetricRevisionConflictError extends Error {
  constructor(
    public readonly target: DossierMetricRevisionTarget,
    message: string,
  ) {
    super(message);
    this.name = "MetricRevisionConflictError";
  }
}

export function MetricRevisionProvider({
  dossierNumber,
  initialTargets,
  correctionApiPath,
  children,
}: {
  dossierNumber: number;
  initialTargets: Record<string, DossierMetricRevisionTarget>;
  correctionApiPath?: string;
  children: ReactNode;
}) {
  const [correctedTargets, setCorrectedTargets] = useState<
    Record<string, CorrectedTarget>
  >({});

  const replacedInitialTargets = Object.entries(correctedTargets).filter(
    ([metricCode, correction]) =>
      correction.replacedInitialTarget !== undefined &&
      initialTargets[metricCode] !== correction.replacedInitialTarget,
  );
  if (replacedInitialTargets.length > 0) {
    const next = { ...correctedTargets };
    for (const [metricCode, correction] of replacedInitialTargets) {
      next[metricCode] = { target: correction.target };
    }
    setCorrectedTargets(next);
  }

  const targets = useMemo(() => {
    const mergedTargets = { ...initialTargets };

    for (const [metricCode, correction] of Object.entries(correctedTargets)) {
      mergedTargets[metricCode] =
        correction.replacedInitialTarget !== undefined &&
        initialTargets[metricCode] === correction.replacedInitialTarget
          ? correction.target
          : keepNewestMetricRevision(
              mergedTargets[metricCode],
              correction.target,
            );
    }

    return mergedTargets;
  }, [correctedTargets, initialTargets]);

  const correctMetric = useCallback(
    async (
      metricCode: string,
      value: MetricValue,
      expectedRevision: number,
    ) => {
      const currentTarget = targets[metricCode];

      if (!currentTarget) {
        throw new Error("Métrique inconnue pour ce dossier");
      }

      const apiPath =
        correctionApiPath ?? `/api/projets/${dossierNumber}/metrics`;
      const response = await fetch(
        `${apiPath}/${encodeURIComponent(metricCode)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ value, expectedRevision }),
        },
      );
      const body = (await response.json().catch(() => ({}))) as {
        target?: DossierMetricRevisionTarget;
        error?: string;
      };

      if ((!response.ok && response.status !== 409) || !body.target) {
        throw new Error(
          body.error ?? "La correction n’a pas pu être enregistrée.",
        );
      }

      const updatedTarget = body.target;

      setCorrectedTargets((current) => {
        const currentCorrection = current[metricCode];
        const currentTarget = currentCorrection?.target ?? targets[metricCode];

        return {
          ...current,
          [metricCode]:
            response.status === 409
              ? {
                  target: updatedTarget,
                  replacedInitialTarget: initialTargets[metricCode],
                }
              : {
                  ...currentCorrection,
                  target: keepNewestMetricRevision(
                    currentTarget,
                    updatedTarget,
                  ),
                },
        };
      });

      if (response.status === 409) {
        throw new MetricRevisionConflictError(
          updatedTarget,
          body.error ??
            "Cette valeur a été modifiée. La valeur actuelle a été chargée.",
        );
      }

      if (updatedTarget.revision !== expectedRevision) {
        successToast(`Correction enregistrée pour « ${updatedTarget.label} ».`);
      }

      return updatedTarget;
    },
    [correctionApiPath, dossierNumber, initialTargets, targets],
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
