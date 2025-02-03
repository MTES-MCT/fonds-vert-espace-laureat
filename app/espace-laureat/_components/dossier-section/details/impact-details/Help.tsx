import { ReactNode } from "react";

export function Help({ children }: { children: ReactNode }) {
  return <p className="text-sm mb-3 text-balance">{children}</p>;
}
