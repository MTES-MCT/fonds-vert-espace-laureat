"use client";

import { createContext, ReactNode, useContext, useState } from "react";

type RefreshStatusContextValue = {
  isRefreshing: boolean;
  setRefreshing: (value: boolean) => void;
};

const RefreshStatusContext = createContext<RefreshStatusContextValue | null>(
  null,
);

export function RefreshStatusProvider({ children }: { children: ReactNode }) {
  const [isRefreshing, setRefreshing] = useState(false);

  return (
    <RefreshStatusContext.Provider value={{ isRefreshing, setRefreshing }}>
      {children}
    </RefreshStatusContext.Provider>
  );
}

export function useRefreshStatus() {
  const context = useContext(RefreshStatusContext);

  if (!context) {
    return {
      isRefreshing: false,
      setRefreshing: () => {},
    };
  }

  return context;
}
