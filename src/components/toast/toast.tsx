"use client";

import Alert from "@codegouvfr/react-dsfr/Alert";
import type { CSSProperties } from "react";
import { toast, Toaster } from "sonner";

const toastViewportStyle = {
  "--width": "36rem",
  fontFamily: '"Marianne", arial, sans-serif',
} as CSSProperties;

export function ToastViewport() {
  return (
    <Toaster
      className="fr-raw-list"
      position="top-right"
      duration={5000}
      style={toastViewportStyle}
      toastOptions={{ unstyled: true }}
    />
  );
}

export function successToast(message: string) {
  return toast.custom((id) => (
    <Alert
      className="bg-white"
      severity="success"
      small
      closable
      description={message}
      role="status"
      onClose={() => toast.dismiss(id)}
    />
  ));
}
