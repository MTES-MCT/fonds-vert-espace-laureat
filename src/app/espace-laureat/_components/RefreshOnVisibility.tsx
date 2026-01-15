"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useTransition } from "react";

import { useRefreshStatus } from "@/app/espace-laureat/_components/RefreshStatusContext";

export function RefreshOnVisibility() {
  const router = useRouter();
  const lastVisibilityState = useRef<DocumentVisibilityState | null>(null);
  const [isPending, startTransition] = useTransition();
  const { setRefreshing } = useRefreshStatus();

  useEffect(() => {
    lastVisibilityState.current = document.visibilityState;

    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "visible" &&
        lastVisibilityState.current !== "visible"
      ) {
        startTransition(() => {
          router.refresh();
        });
      }
      lastVisibilityState.current = document.visibilityState;
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [router, startTransition]);

  useEffect(() => {
    setRefreshing(isPending);

    return () => {
      setRefreshing(false);
    };
  }, [isPending, setRefreshing]);

  return null;
}
