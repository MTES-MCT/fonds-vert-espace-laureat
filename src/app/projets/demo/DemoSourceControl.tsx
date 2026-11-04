"use client";

import Select from "@codegouvfr/react-dsfr/Select";
import { useRouter } from "next/navigation";
import { useSyncExternalStore, useTransition } from "react";

import {
  type DemoSourceState,
  readDemoSourceState,
} from "@/utils/demo/anomalies";

const subscribeToHydration = () => () => {};

export function DemoSourceControl({ state }: { state: DemoSourceState }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );
  return (
    <Select
      className="mb-0"
      label="Réponse Fonds vert simulée"
      disabled={!hydrated || pending}
      nativeSelectProps={{
        className: "box-border",
        value: state,
        onChange: (event) => {
          const sourceState = readDemoSourceState(event.target.value);
          const url = new URL(window.location.href);
          if (sourceState === "initial") url.searchParams.delete("fondsVert");
          else url.searchParams.set("fondsVert", sourceState);
          startTransition(() => router.replace(url.pathname + url.search));
        },
      }}
    >
      <option value="initial">Signalements initiaux</option>
      <option value="recalculated">Réponse recalculée</option>
      <option value="unavailable">Service indisponible</option>
    </Select>
  );
}
