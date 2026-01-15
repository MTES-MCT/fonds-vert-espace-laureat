"use client";

import { useRefreshStatus } from "@/app/espace-laureat/_components/RefreshStatusContext";

export function RefreshIndicator() {
  const { isRefreshing } = useRefreshStatus();

  if (!isRefreshing) return null;

  return (
    <div className="absolute top-6 right-6" aria-live="polite">
      <span
        className={`
          inline-block h-4 w-4 animate-spin rounded-full border-2
          border-[var(--border-default-grey)] border-t-[var(--background-action-high-blue-france)]
        `}
        role="status"
      />
      <span className="sr-only">Actualisation en cours...</span>
    </div>
  );
}
