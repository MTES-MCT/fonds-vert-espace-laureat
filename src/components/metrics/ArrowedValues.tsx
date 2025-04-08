import { MetricValue } from "./MetricValue";

export type ArrowedValuesProps = {
  values: (string | number | null)[];
  labels: string[];
  unite: string | null;
};

export const ArrowedValues = ({
  values,
  labels,
  unite,
}: ArrowedValuesProps) => {
  const nonNullValues = values.filter((v) => v !== null);
  const nonNullLabels = labels.filter((_, i) => values[i] !== null);

  if (nonNullValues.length === 0) return null;

  return (
    <div className="flex items-center">
      {nonNullValues.map((value, index) => (
        <div key={index} className="flex items-center">
          {index > 0 && (
            <div className="mx-2 text-gray-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
          )}
          <MetricValue
            value={value}
            label={nonNullLabels[index]}
            unite={unite}
            testId={`valeur-${index}`}
          />
        </div>
      ))}
    </div>
  );
};
