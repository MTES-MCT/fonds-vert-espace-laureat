import { ImpactReview } from "@/app/espace-laureat/_components/dossier-section/details/impact-details/ImpactReview";
import { ImpactSubmission } from "@/app/espace-laureat/_components/dossier-section/details/impact-details/ImpactSubmission";
import { Impact } from "@/services/ds/impact";
import { Metrics } from "@/services/fondsvert/dossier";

export async function ImpactDetails({
  numeroDossier,
  impact,
  metriques,
  nocache,
}: {
  numeroDossier: number;
  impact?: Impact;
  metriques?: Metrics;
  nocache: boolean;
}) {
  if (!impact?.numero) {
    return (
      <ImpactSubmission
        numeroDossier={numeroDossier}
        metriques={metriques}
        nocache={nocache}
      />
    );
  }

  return <ImpactReview impact={impact} />;
}
