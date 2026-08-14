import Badge from "@codegouvfr/react-dsfr/Badge";

import {
  MetricValueContent,
  type ScalarMetricValue,
} from "@/components/metrics/MetricValue";

export type MetricAnomalyProblem = {
  label: string;
  metric?: {
    value: ScalarMetricValue;
    unite?: string | null;
  };
};

export function MetricAnomalyMessage({
  problem,
  helpText,
}: {
  problem: MetricAnomalyProblem;
  helpText: string;
}) {
  return (
    <>
      <Badge small severity="warning">
        {problem.label}
        {problem.metric && (
          <span className="ml-1 normal-case [&_span]:!text-[0.625rem]">
            <MetricValueContent
              value={problem.metric.value}
              unite={problem.metric.unite}
            />
          </span>
        )}
      </Badge>
      <div
        className={`text-xs leading-tight font-normal text-[var(--text-mention-grey)]`}
      >
        {helpText}
      </div>
    </>
  );
}
