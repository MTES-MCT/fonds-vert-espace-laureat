import { FactRow } from "@/components/fact-list/FactList";
import { formatEuros, slugify } from "@/utils/format";

export function MoneyField({
  label,
  value,
  scope,
}: {
  label: string;
  value?: number;
  scope?: string;
}) {
  const baseId = slugify(label);

  return (
    <FactRow
      id={scope ? `${baseId}-${scope}-label` : `${baseId}-label`}
      label={label}
    >
      {formatEuros(value)}
    </FactRow>
  );
}
