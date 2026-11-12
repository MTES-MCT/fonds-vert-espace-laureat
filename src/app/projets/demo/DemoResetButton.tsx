"use client";

import Alert from "@codegouvfr/react-dsfr/Alert";
import Button from "@codegouvfr/react-dsfr/Button";
import { useState } from "react";

export function DemoResetButton() {
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState<string>();

  const resetDemo = async () => {
    setIsResetting(true);
    setError(undefined);

    try {
      const response = await fetch("/api/projets/demo/reset", {
        method: "POST",
      });

      if (response.status === 429) {
        throw new Error("Réessayez dans quelques secondes.");
      }

      if (!response.ok) {
        throw new Error(
          "Les données de démonstration n’ont pas pu être réinitialisées.",
        );
      }

      const url = new URL(window.location.href);
      url.searchParams.delete("fondsVert");
      window.location.assign(url.pathname + url.search);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Les données de démonstration n’ont pas pu être réinitialisées.",
      );
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        className="bg-white shadow-sm"
        priority="tertiary no outline"
        size="small"
        iconId="fr-icon-refresh-line"
        nativeButtonProps={{
          type: "button",
          disabled: isResetting,
          onClick: resetDemo,
        }}
      >
        {isResetting ? "Réinitialisation…" : "Réinitialiser la démo"}
      </Button>

      {error && <Alert severity="error" small description={error} />}
    </div>
  );
}
