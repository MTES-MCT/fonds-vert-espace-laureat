import { redirect } from "next/navigation";

import type { SearchParams } from "@/app/projets/_components/getParams";
import { demoUrl, readDemoView } from "@/app/projets/demo/navigation";
import { readDemoSourceState } from "@/utils/demo/anomalies";
import { DEMO_POOL_NUMBER } from "@/utils/demo/reservation";

export default async function LegacyDemoPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const query = await searchParams;
  redirect(
    demoUrl(
      `/projets/demo/${DEMO_POOL_NUMBER}/impact`,
      readDemoView(query.vue),
      readDemoSourceState(query.fondsVert),
    ),
  );
}
