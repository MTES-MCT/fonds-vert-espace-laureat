import { formatEuros } from "@/utils/format";

export function MoneyField({
  id,
  label,
  value,
  className,
  bold,
}: {
  id: string;
  label: string;
  value?: number;
  className?: string;
  bold?: boolean;
}) {
  return (
    <div className={className}>
      <dt id={`${id}-label`}>{label}</dt>
      <dd
        aria-labelledby={`${id}-label`}
        className={bold ? "font-semibold" : undefined}
      >
        {formatEuros(value)}
      </dd>
    </div>
  );
}
