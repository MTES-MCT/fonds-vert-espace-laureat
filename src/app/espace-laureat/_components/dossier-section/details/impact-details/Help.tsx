import { ReactNode } from "react";

export function Help({ children }: { children: ReactNode }) {
  return <p className="text-sm my-4 text-balance">{children}</p>;
}
