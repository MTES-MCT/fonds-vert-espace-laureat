import { ImpactReview } from "@/app/espace-laureat/_components/dossier-section/details/impact-details/ImpactReview";
import { ImpactSubmission } from "@/app/espace-laureat/_components/dossier-section/details/impact-details/ImpactSubmission";
import { Impact } from "@/services/ds/impact";
import { Metrics } from "@/services/fondsvert/dossier";

export async function ImpactDetails({
  numeroDossier,
  impact,
  metriques,
}: {
  numeroDossier: number;
  impact?: Impact;
  metriques: Metrics;
}) {
  if (!impact?.numero) {
    return (
      <ImpactSubmission numeroDossier={numeroDossier} metriques={metriques} />
    );
  }

  return <ImpactReview impact={impact} />;
}
