import { formatEuros, slugify } from "@/utils/format";

export function MoneyField({
  label,
  value,
  className,
  bold,
  valueClassName,
  scope,
}: {
  label: string;
  value?: number;
  className?: string;
  bold?: boolean;
  valueClassName?: string;
  scope?: string;
}) {
  const baseId = slugify(label);
  const id = scope ? `${baseId}-${scope}-label` : `${baseId}-label`;

  return (
    <div className={className}>
      <dt id={id}>{label}</dt>
      <dd
        aria-labelledby={id}
        className={valueClassName ?? (bold ? "font-semibold" : undefined)}
      >
        {formatEuros(value)}
      </dd>
    </div>
  );
}
