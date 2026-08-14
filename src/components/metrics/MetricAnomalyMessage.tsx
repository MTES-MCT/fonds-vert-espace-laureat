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
      <div className="flex items-center gap-1 text-base font-semibold">
        <span
          aria-hidden="true"
          className={`fr-icon-warning-fill fr-icon--sm text-[var(--text-default-warning)]`}
        />
        <span>{problem.label}</span>
        {problem.metric && (
          <span>
            <MetricValueContent
              value={problem.metric.value}
              unite={problem.metric.unite}
            />
          </span>
        )}
      </div>
      <div
        className={`text-xs leading-tight font-normal text-[var(--text-mention-grey)]`}
      >
        {helpText}
      </div>
    </>
  );
}
