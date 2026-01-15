"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useTransition } from "react";

import { useRefreshStatus } from "@/app/espace-laureat/_components/RefreshStatusContext";

export function RefreshOnVisibility() {
  const router = useRouter();
  const lastVisibilityState = useRef<DocumentVisibilityState | null>(null);
  const lastRefreshAt = useRef(0);
  const [isPending, startTransition] = useTransition();
  const { setRefreshing } = useRefreshStatus();

  useEffect(() => {
    lastVisibilityState.current = document.visibilityState;

    const triggerRefresh = () => {
      const now = Date.now();
      if (now - lastRefreshAt.current < 500) {
        return;
      }
      lastRefreshAt.current = now;
      startTransition(() => {
        router.refresh();
      });
    };

    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "visible" &&
        lastVisibilityState.current !== "visible"
      ) {
        triggerRefresh();
      }
      lastVisibilityState.current = document.visibilityState;
    };

    const handleWindowFocus = () => {
      if (document.visibilityState === "visible") {
        triggerRefresh();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleWindowFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleWindowFocus);
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
