import { MetricValue as MetricValueType } from "@/services/fondsvert/dossier";

import { MetricValue } from "./MetricValue";

export type ArrowedValuesProps = {
  values: MetricValueType[];
  labels: string[];
  unite: string | null;
};

export const ArrowedValues = ({
  values,
  labels,
  unite,
}: ArrowedValuesProps) => {
  return (
    <div className="flex min-w-0 items-center">
      {values.map((value, index) => (
        <div key={index} className="flex min-w-0 items-center">
          {index > 0 && (
            <div className="mx-1 shrink-0 text-gray-400/65 sm:mx-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
          )}
          <MetricValue
            value={value}
            accessibleName={labels[index]}
            label={labels[index]}
            unite={unite}
            testId={`valeur-${index}`}
            compact
          />
        </div>
      ))}
    </div>
  );
};
