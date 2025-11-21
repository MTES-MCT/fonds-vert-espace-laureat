import { ReactNode } from "react";

export function Help({ children }: { children: ReactNode }) {
  return <p className="my-4 text-xs">{children}</p>;
}
