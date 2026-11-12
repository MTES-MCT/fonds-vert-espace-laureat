import Tag from "@codegouvfr/react-dsfr/Tag";

import { MetricValue as MetricValueType } from "@/services/fondsvert/dossier";
import { formatMetric } from "@/utils/format";

export type ScalarMetricValue = Exclude<MetricValueType, string[]>;

export const MetricValueContent = ({
  value,
  unite,
}: {
  value: ScalarMetricValue;
  unite?: string | null;
}) => (
  <>
    {formatMetric(value)}
    {unite && <span className="ml-1 text-sm font-normal">{unite}</span>}
  </>
);

export type MetricValueProps = {
  value: MetricValueType;
  accessibleName?: string;
  unite?: string | null;
  testId?: string;
};

export const MetricValue = ({
  value,
  accessibleName,
  unite,
  testId = "value",
}: MetricValueProps) => {
  const isStringValue = typeof value === "string";
  const isArrayValue = Array.isArray(value);

  return (
    <div className="flex flex-col">
      {isArrayValue ? (
        <ul
          aria-label={accessibleName}
          className="fr-tags-group mt-1 -mb-2 max-w-sm"
          data-testid={testId}
        >
          {value.map((item, index) => (
            <li className="leading-tight" key={index}>
              <Tag small>{item}</Tag>
            </li>
          ))}
        </ul>
      ) : (
        <div
          aria-label={accessibleName}
          className={`font-medium ${isStringValue ? "max-w-[32rem] text-base" : "text-base"}`}
          data-testid={testId}
        >
          <MetricValueContent value={value} unite={unite} />
        </div>
      )}
    </div>
  );
};
