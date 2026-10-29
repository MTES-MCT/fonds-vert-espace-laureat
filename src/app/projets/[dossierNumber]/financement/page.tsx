import { DossierPage } from "@/app/projets/_components/DossierPage";

export default async function ProjectFinancePage({
  params,
}: {
  params: Promise<{ dossierNumber: string }>;
}) {
  const { dossierNumber } = await params;
  return <DossierPage dossierNumber={dossierNumber} section="finance" />;
}
