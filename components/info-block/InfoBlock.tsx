import { ReactNode } from "react";

export function InfoBlock({ children }: { children: ReactNode }) {
  return <div className="border p-6">{children}</div>;
}
