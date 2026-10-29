import Breadcrumb from "@codegouvfr/react-dsfr/Breadcrumb";

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-gray-100 ${className ?? ""}`}
      aria-hidden="true"
    />
  );
}

export default function Loading() {
  return (
    <div
      className="fr-container my-8"
      role="status"
      aria-label="Chargement du projet"
    >
      <div className="bg-white p-4 sm:p-8">
        <Breadcrumb
          className="mt-0 mb-4"
          homeLinkProps={{ href: "/" }}
          segments={[{ label: "Projets", linkProps: { href: "/projets" } }]}
          currentPageLabel="Chargement…"
        />
        <Skeleton className="mb-4 h-20 w-full max-w-2xl" />
        <Skeleton className="mb-8 h-6 w-48" />
        <div className="mb-8 flex flex-wrap gap-6 border-b pb-4">
          {[1, 2, 3].map((item) => (
            <Skeleton key={item} className="h-6 w-40" />
          ))}
        </div>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(16rem,1fr)]">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </div>
  );
}
