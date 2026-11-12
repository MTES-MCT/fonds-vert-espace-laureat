import type { ReactNode } from "react";

export function DsfrTable({
  children,
  label,
  className,
}: {
  children: ReactNode;
  label: string;
  className: string;
}) {
  return (
    <div className={`fr-table ${className}`}>
      <div className="fr-table__wrapper">
        {/* oxlint-disable jsx-a11y/no-noninteractive-tabindex -- Permet le défilement du tableau au clavier. */}
        <div
          className="fr-table__container"
          role="region"
          aria-label={label}
          tabIndex={0}
        >
          <div className="fr-table__content">{children}</div>
        </div>
        {/* oxlint-enable jsx-a11y/no-noninteractive-tabindex */}
      </div>
    </div>
  );
}
