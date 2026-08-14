"use client";

import { createContext, type ReactNode, useContext, useMemo } from "react";

import type { MetricAnomalyProblem } from "@/components/metrics/MetricAnomalyMessage";

export type MetricAnomaly = {
  metricCode: string;
  indicator: string;
  problem: MetricAnomalyProblem;
  helpText: string;
};

type MetricAnomalyContextValue = {
  anomalies: MetricAnomaly[];
  anomaliesByMetricCode: Record<string, MetricAnomaly[]>;
};

const EMPTY_ANOMALIES: MetricAnomaly[] = [];
const EMPTY_CONTEXT: MetricAnomalyContextValue = {
  anomalies: EMPTY_ANOMALIES,
  anomaliesByMetricCode: {},
};
const MetricAnomalyContext =
  createContext<MetricAnomalyContextValue>(EMPTY_CONTEXT);

export function MetricAnomalyProvider({
  anomalies,
  children,
}: {
  anomalies: MetricAnomaly[];
  children: ReactNode;
}) {
  const value = useMemo(() => {
    const anomaliesByMetricCode: Record<string, MetricAnomaly[]> = {};

    for (const anomaly of anomalies) {
      (anomaliesByMetricCode[anomaly.metricCode] ??= []).push(anomaly);
    }

    return { anomalies, anomaliesByMetricCode };
  }, [anomalies]);

  return (
    <MetricAnomalyContext.Provider value={value}>
      {children}
    </MetricAnomalyContext.Provider>
  );
}

export function useAllMetricAnomalies(): MetricAnomaly[] {
  return useContext(MetricAnomalyContext).anomalies;
}

export function useMetricAnomaliesByMetricCode(): Record<
  string,
  MetricAnomaly[]
> {
  return useContext(MetricAnomalyContext).anomaliesByMetricCode;
}
