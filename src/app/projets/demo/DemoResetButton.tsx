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

      if (!response.ok) {
        throw new Error(
          "Les données de démonstration n’ont pas pu être réinitialisées.",
        );
      }

      window.location.reload();
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
        priority="secondary"
        iconId="fr-icon-refresh-line"
        nativeButtonProps={{
          type: "button",
          disabled: isResetting,
          onClick: resetDemo,
        }}
      >
        {isResetting
          ? "Réinitialisation…"
          : "Réinitialiser les données de démonstration"}
      </Button>

      {error && <Alert severity="error" small description={error} />}
    </div>
  );
}
