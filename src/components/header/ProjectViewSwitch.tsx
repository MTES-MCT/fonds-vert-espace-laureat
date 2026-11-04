"use client";

import { HeaderQuickAccessItem } from "@codegouvfr/react-dsfr/Header";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore, useTransition } from "react";

import type { ProjectView } from "@/utils/projectView";

const subscribe = () => () => {};

const switchLabels: Record<ProjectView, string> = {
  porteur: "Passer en vue instructeur",
  instructeur: "Passer en vue porteur",
};

export function ProjectViewSwitch({ view }: { view: ProjectView }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, startRefresh] = useTransition();
  const [error, setError] = useState<string>();
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const nextView: ProjectView = view === "porteur" ? "instructeur" : "porteur";

  const changeView = async () => {
    setIsSaving(true);
    setError(undefined);
    try {
      const response = await fetch("/api/session/project-view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ view: nextView }),
      });
      if (!response.ok) throw new Error("La vue n’a pas pu être modifiée.");
      startRefresh(() => router.refresh());
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "La vue n’a pas pu être modifiée.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <HeaderQuickAccessItem
        quickAccessItem={{
          iconId: "ri-arrow-left-right-line",
          text: switchLabels[view],
          buttonProps: {
            type: "button",
            disabled: !hydrated || isSaving || isRefreshing,
            onClick: () => void changeView(),
          },
        }}
      />
      {error && (
        <p className="fr-error-text mb-0" role="alert">
          {error}
        </p>
      )}
    </>
  );
}
