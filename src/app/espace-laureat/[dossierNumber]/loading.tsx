import Breadcrumb from "@codegouvfr/react-dsfr/Breadcrumb";

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-gray-100 ${className ?? ""}`}
      aria-hidden="true"
    />
  );
}

export default function Loading() {
  return (
    <div role="status" aria-label="Chargement du dossier">
      {/* Header */}
      <div className="bg-[#efebe8]">
        <div className="fr-container pt-8 pb-40">
          <Breadcrumb
            className="mt-0 mb-4"
            homeLinkProps={{ href: "/" }}
            segments={[
              {
                label: "Tous les dossiers",
                linkProps: { href: "/espace-laureat" },
              },
            ]}
            currentPageLabel="Chargement..."
          />
          <div className="flex h-[116px] flex-col justify-center">
            <Skeleton className="mb-3 h-20 w-full max-w-2xl bg-gray-300" />
            <div className="flex flex-wrap items-center gap-3">
              <Skeleton className="h-6 w-96 rounded-full bg-gray-300" />
              <Skeleton className="h-6 w-28 rounded-full bg-gray-300" />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="fr-container -mt-32 mb-8 flex flex-wrap items-start gap-8">
        {/* Main column */}
        <div className="flex min-w-0 flex-1 flex-col gap-y-8">
          <div className="min-h-[600px] bg-white p-8 shadow-lg">
            <Skeleton className="mb-6 h-7 w-52" />
            <div className="space-y-6">
              <div className="space-y-1">
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-6 w-28" />
              </div>
              <div>
                <Skeleton className="mb-2 h-6 w-36" />
                <Skeleton className="h-24 w-full" />
              </div>
            </div>
          </div>
          <Skeleton className="h-10 w-24" />
        </div>

        {/* Sidebar */}
        <div className="min-h-[600px] w-[22rem] shrink-0 bg-white p-6 shadow-lg">
          <div className="space-y-5">
            <Skeleton className="h-5 w-20" />
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-3 w-40" />
                <Skeleton className="h-3 w-32" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
