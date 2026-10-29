"use client";

import { createContext, type ReactNode, useContext, useMemo } from "react";

import type { NormalizedMetricAnomaly } from "@/utils/metrics/anomalies";

export type MetricAnomaly = NormalizedMetricAnomaly;

type MetricAnomalyContextValue = Record<string, MetricAnomaly[]>;
const MetricAnomalyContext = createContext<MetricAnomalyContextValue>({});

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
      for (const metricCode of anomaly.metricCodes) {
        (anomaliesByMetricCode[metricCode] ??= []).push(anomaly);
      }
    }

    return anomaliesByMetricCode;
  }, [anomalies]);

  return (
    <MetricAnomalyContext.Provider value={value}>
      {children}
    </MetricAnomalyContext.Provider>
  );
}

export function useMetricAnomaliesByMetricCode(): Record<
  string,
  MetricAnomaly[]
> {
  return useContext(MetricAnomalyContext);
}
