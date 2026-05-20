function SkeletonBox({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-gray-100 ${className ?? ""}`}
      aria-hidden="true"
    />
  );
}

export function FinanceFieldsSkeleton() {
  return (
    <>
      <div
        className="order-first"
        role="status"
        aria-label="Chargement du montant attribué initial"
      >
        <dt id="montant-attribue-initial-label">Montant attribué initial</dt>
        <dd aria-labelledby="montant-attribue-initial-label">
          <SkeletonBox className="h-5 w-24" />
        </dd>
      </div>
      <div
        className="max-w-[225px]"
        role="status"
        aria-label="Chargement du fournisseur"
      >
        <dt id="fournisseur-label">Fournisseur</dt>
        <dd aria-labelledby="fournisseur-label">
          <SkeletonBox className="h-5 w-32" />
        </dd>
      </div>
      <div
        className="max-w-[225px]"
        role="status"
        aria-label="Chargement du centre de coût"
      >
        <dt id="centre-de-cout-label">Centre de coût</dt>
        <dd aria-labelledby="centre-de-cout-label">
          <SkeletonBox className="h-5 w-32" />
        </dd>
      </div>
    </>
  );
}
