"use client";

import Alert from "@codegouvfr/react-dsfr/Alert";
import type { CSSProperties } from "react";
import { toast, Toaster } from "sonner";

const toastViewportStyle = { "--width": "36rem" } as CSSProperties;

export function ToastViewport() {
  return (
    <Toaster
      position="top-right"
      duration={5000}
      style={toastViewportStyle}
      toastOptions={{ className: "list-none", unstyled: true }}
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
