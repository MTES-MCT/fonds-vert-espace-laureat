import { MetricValue as MetricValueType } from "@/services/fondsvert/dossier";
import { formatMetric } from "@/utils/format";

export type MetricValueProps = {
  value: MetricValueType;
  label?: string;
  unite?: string | null;
  testId?: string;
};

export const MetricValue = ({
  value,
  label,
  unite,
  testId = "value",
}: MetricValueProps) => {
  if (value === null) return null;

  return (
    <div className="flex flex-col">
      {label && <div className="text-xs text-gray-500">{label}</div>}
      <div
        className={`font-semibold ${typeof value === "string" ? "text-base" : "text-lg"}`}
        data-testid={testId}
      >
        {formatMetric(value)}
        {unite && <span className="text-sm font-normal ml-1">{unite}</span>}
      </div>
    </div>
  );
};
