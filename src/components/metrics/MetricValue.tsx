import Tag from "@codegouvfr/react-dsfr/Tag";

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

  const isNumberValue = typeof value === "number";
  const isStringValue = typeof value === "string";
  const isArrayValue = Array.isArray(value);

  return (
    <div className="flex flex-col">
      {label && isNumberValue && (
        <div className="text-xs text-gray-500">{label}</div>
      )}
      {isArrayValue ? (
        <ul className="fr-tags-group mt-1 -mb-2 max-w-sm" data-testid={testId}>
          {value.map((item, index) => (
            <li className="leading-tight" key={index}>
              <Tag small>{item}</Tag>
            </li>
          ))}
        </ul>
      ) : (
        <div
          className={`font-semibold ${isStringValue ? "text-sm max-w-[18rem]" : "text-lg"}`}
          data-testid={testId}
        >
          {formatMetric(value)}
          {unite && <span className="text-sm font-normal ml-1">{unite}</span>}
        </div>
      )}
    </div>
  );
};
