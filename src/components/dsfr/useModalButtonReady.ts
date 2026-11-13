"use client";

import { type RefObject, useCallback, useSyncExternalStore } from "react";

// Le DSFR pose cet attribut lorsqu’il installe le gestionnaire du clic.
const registrationAttribute = "data-fr-js-modal-button";

export function useModalButtonReady(
  buttonRef: RefObject<HTMLButtonElement | null>,
) {
  const subscribe = useCallback(
    (notify: () => void) => {
      const button = buttonRef.current;
      if (!button) return () => {};

      const observer = new MutationObserver(notify);
      observer.observe(button, {
        attributes: true,
        attributeFilter: [registrationAttribute],
      });
      return () => observer.disconnect();
    },
    [buttonRef],
  );

  return useSyncExternalStore(
    subscribe,
    () => buttonRef.current?.hasAttribute(registrationAttribute) ?? false,
    () => false,
  );
}
