import type { SearchParams } from "@/app/projets/_components/getParams";
import { DemoDossierPage } from "@/app/projets/demo/DemoDossierPage";
import { readDemoSourceState } from "@/utils/demo/anomalies";

export default async function DemoPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sourceState = readDemoSourceState((await searchParams).fondsVert);
  return <DemoDossierPage section="summary" sourceState={sourceState} />;
}
