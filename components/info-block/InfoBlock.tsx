import { ReactNode } from "react";

export function InfoBlock({ children }: { children: ReactNode }) {
  return (
    <div className="border-r-2 border-gray-100 last:border-none px-6">
      {children}
    </div>
  );
}
