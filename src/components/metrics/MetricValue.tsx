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

  const isStringValue = typeof value === "string";

  return (
    <div className="flex flex-col">
      {label && !isStringValue && (
        <div className="text-xs text-gray-500">{label}</div>
      )}
      <div
        className={`font-semibold ${isStringValue ? "text-sm max-w-[18rem]" : "text-lg"}`}
        data-testid={testId}
      >
        {formatMetric(value)}
        {unite && <span className="text-sm font-normal ml-1">{unite}</span>}
      </div>
    </div>
  );
};
