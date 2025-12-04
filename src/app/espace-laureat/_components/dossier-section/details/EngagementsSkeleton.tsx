function SkeletonBox({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-gray-100 ${className ?? ""}`}
      aria-hidden="true"
    />
  );
}

export function FinanceFieldsSkeleton({ index }: { index: number }) {
  return (
    <>
      <div
        className="order-first"
        role="status"
        aria-label="Chargement du montant attribué initial"
      >
        <dt id={`montant-attribue-initial-ej-${index}-label`}>
          Montant attribué initial
        </dt>
        <dd aria-labelledby={`montant-attribue-initial-ej-${index}-label`}>
          <SkeletonBox className="h-5 w-24" />
        </dd>
      </div>
      <div
        className="max-w-[225px]"
        role="status"
        aria-label="Chargement du fournisseur"
      >
        <dt id={`fournisseur-ej-${index}-label`}>Fournisseur</dt>
        <dd aria-labelledby={`fournisseur-ej-${index}-label`}>
          <SkeletonBox className="h-5 w-32" />
        </dd>
      </div>
      <div
        className="max-w-[225px]"
        role="status"
        aria-label="Chargement du centre de coût"
      >
        <dt id={`centre-cout-ej-${index}-label`}>Centre de coût</dt>
        <dd aria-labelledby={`centre-cout-ej-${index}-label`}>
          <SkeletonBox className="h-5 w-32" />
        </dd>
      </div>
    </>
  );
}
