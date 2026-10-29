"use client";

import Select from "@codegouvfr/react-dsfr/Select";
import { useRouter } from "next/navigation";
import { useId, useState, useSyncExternalStore } from "react";

import { isProjectView, type ProjectView } from "@/utils/projectView";

const subscribe = () => () => {};

export function ProjectViewSwitch({ view }: { view: ProjectView }) {
  const router = useRouter();
  const id = useId();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>();
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  const changeView = async (value: string) => {
    if (!isProjectView(value)) return;
    setIsSaving(true);
    setError(undefined);
    try {
      const response = await fetch("/api/session/project-view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ view: value }),
      });
      if (!response.ok) throw new Error("La vue n’a pas pu être modifiée.");
      router.refresh();
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
    <div className="min-w-48 text-left">
      <Select
        label="Vue super admin"
        className="mb-0"
        disabled={!hydrated || isSaving}
        nativeSelectProps={{
          id,
          value: view,
          onChange: (event) => void changeView(event.target.value),
        }}
      >
        <option value="porteur">Porteur</option>
        <option value="instructeur">Instructeur</option>
      </Select>
      {error && (
        <p className="fr-error-text mb-0" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
