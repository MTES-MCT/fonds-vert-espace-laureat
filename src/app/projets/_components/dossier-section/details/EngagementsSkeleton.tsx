import { FactRow } from "@/components/fact-list/FactList";

import type { FinanceFieldsPart } from "./engagement-juridique/FinanceFieldsSection";

function SkeletonBox({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-gray-100 ${className ?? ""}`}
      aria-hidden="true"
    />
  );
}

export function FinanceFieldsSkeleton({ part }: { part: FinanceFieldsPart }) {
  if (part === "initialAmount") {
    return (
      <FactRow
        id="montant-attribue-initial-label"
        label="Montant attribué initial"
        role="status"
        aria-label="Chargement du montant attribué initial"
      >
        <SkeletonBox className="h-5 w-24" />
      </FactRow>
    );
  }

  return (
    <>
      <FactRow
        id="fournisseur-label"
        label="Fournisseur"
        role="status"
        aria-label="Chargement du fournisseur"
      >
        <SkeletonBox className="h-5 w-32" />
      </FactRow>
      <FactRow
        id="centre-de-cout-label"
        label="Centre de coût"
        role="status"
        aria-label="Chargement du centre de coût"
      >
        <SkeletonBox className="h-5 w-32" />
      </FactRow>
    </>
  );
}
