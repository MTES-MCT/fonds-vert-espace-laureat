"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export function RefreshOnVisibility() {
  const router = useRouter();
  const lastVisibilityState = useRef<DocumentVisibilityState | null>(null);

  useEffect(() => {
    lastVisibilityState.current = document.visibilityState;

    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "visible" &&
        lastVisibilityState.current !== "visible"
      ) {
        router.refresh();
      }
      lastVisibilityState.current = document.visibilityState;
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [router]);

  return null;
}
