"use client";

import { createContext, type ReactNode, useContext, useMemo } from "react";

import type { NormalizedMetricAnomaly } from "@/utils/metrics/anomalies";

type MetricAnomalyContextValue = Record<string, NormalizedMetricAnomaly[]>;
const MetricAnomalyContext = createContext<MetricAnomalyContextValue>({});

export function MetricAnomalyProvider({
  anomalies,
  children,
}: {
  anomalies: NormalizedMetricAnomaly[];
  children: ReactNode;
}) {
  const value = useMemo(() => {
    const anomaliesByMetricCode: Record<string, NormalizedMetricAnomaly[]> = {};

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
  NormalizedMetricAnomaly[]
> {
  return useContext(MetricAnomalyContext);
}
