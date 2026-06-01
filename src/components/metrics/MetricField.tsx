import {
  MetricValueContent,
  type ScalarMetricValue,
} from "@/components/metrics/MetricValue";
import { slugify } from "@/utils/format";

export function MetricField({
  label,
  value,
  unite,
  className,
  bold,
  scope,
}: {
  label: string;
  value: ScalarMetricValue;
  unite?: string | null;
  className?: string;
  bold?: boolean;
  scope?: string;
}) {
  const baseId = slugify(label);
  const id = scope ? `${baseId}-${scope}-label` : `${baseId}-label`;

  return (
    <div className={className}>
      <dt id={id}>{label}</dt>
      <dd aria-labelledby={id} className={bold ? "font-semibold" : undefined}>
        <MetricValueContent value={value} unite={unite} />
      </dd>
    </div>
  );
}
