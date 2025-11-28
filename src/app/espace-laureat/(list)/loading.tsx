function SkeletonBox({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-gray-200 ${className ?? ""}`}
      aria-hidden="true"
    />
  );
}

export default function Loading() {
  return (
    <div className="fr-container my-8" role="status" aria-label="Chargement">
      <div className="min-h-96 bg-white px-8 py-6 shadow-sm">
        <SkeletonBox className="mb-8 h-9 w-80" />
        <SkeletonBox className="h-48 w-full" />
      </div>
    </div>
  );
}
