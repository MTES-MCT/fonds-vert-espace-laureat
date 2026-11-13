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
      <div className="min-h-[60svh] bg-white p-4 sm:p-8">
        <SkeletonBox className="mb-8 h-9 w-80 max-w-full" />
        <SkeletonBox className="h-48 w-full" />
      </div>
    </div>
  );
}
