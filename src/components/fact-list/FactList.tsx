import type { ComponentProps, ReactNode } from "react";

// Shared presentation of labelled project data: a framed list of rows with
// the label on the left, the value, optional notes and an optional action.

export function FactList({
  framed = true,
  className = "",
  ...props
}: ComponentProps<"div"> & { framed?: boolean }) {
  return (
    <div
      {...props}
      className={`
        divide-y divide-[var(--border-default-grey)]
        ${framed ? "border border-[var(--border-default-grey)] px-4" : ""}
        ${className}
      `}
    />
  );
}

export function FactRow({
  id,
  label,
  children,
  aside,
  action,
  ...props
}: Omit<ComponentProps<"dl">, "children" | "id"> & {
  id: string;
  label: ReactNode;
  children: ReactNode;
  aside?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <dl
      {...props}
      className={`
        m-0 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-6 gap-y-1 py-3
        sm:grid-cols-[15rem_minmax(0,1fr)_auto] sm:items-center
        ${aside ? "min-[72rem]:grid-cols-[15rem_minmax(0,1fr)_minmax(min-content,1fr)_auto]" : ""}
      `}
    >
      <dt
        id={id}
        className={`col-start-1 row-start-1 mb-0 text-sm text-[var(--text-mention-grey)]`}
      >
        {label}
      </dt>
      <dd
        aria-labelledby={id}
        className={`
          col-start-1 row-start-2 mb-0 min-w-0 font-medium
          [overflow-wrap:anywhere]
          sm:col-start-2 sm:row-start-1
          ${action ? "" : "col-span-2 sm:col-span-2"}
          ${aside ? "min-[72rem]:col-span-1" : ""}
        `}
      >
        {children}
      </dd>
      {aside && (
        <dd
          className={`
            col-span-2 col-start-1 row-start-3 mt-2 mb-0
            sm:col-start-2 sm:row-start-2
            min-[72rem]:col-span-1 min-[72rem]:col-start-3 min-[72rem]:row-start-1 min-[72rem]:mt-0
          `}
        >
          {aside}
        </dd>
      )}
      {action && (
        <dd
          className={`
            col-start-2 row-span-2 row-start-1 mb-0
            sm:col-start-3 sm:row-span-1
            ${aside ? "min-[72rem]:col-start-4" : ""}
          `}
        >
          {action}
        </dd>
      )}
    </dl>
  );
}
