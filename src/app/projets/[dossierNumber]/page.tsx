import { DossierPage } from "@/app/projets/_components/DossierPage";

export default async function ProjetPage({
  params,
  searchParams,
}: {
  params: Promise<{ dossierNumber: string }>;
  searchParams: Promise<{ nocache?: string | string[] }>;
}) {
  const { dossierNumber } = await params;

  return (
    <DossierPage dossierNumber={dossierNumber} searchParams={searchParams} />
  );
}
