import { ImpactReview } from "@/app/espace-laureat/_components/dossier-section/details/impact-details/ImpactReview";
import { ImpactSubmission } from "@/app/espace-laureat/_components/dossier-section/details/impact-details/ImpactSubmission";
import { Impact } from "@/services/ds/impact";
import { Metrics } from "@/services/fondsvert/dossier";

export async function ImpactDetails({
  impact,
  metriques,
}: {
  impact?: Impact;
  metriques: Metrics;
}) {
  if (!impact?.numero) {
    return <ImpactSubmission metriques={metriques} />;
  }

  return <ImpactReview impact={impact} />;
}
