import { getDossier } from "@/app/projets/_components/getDossier";

const MAX_CONCURRENT_DOSSIERS = 8;

export async function loadAuthorizedDossiers({
  dossierNumbers,
  userEmail,
}: {
  dossierNumbers: number[];
  userEmail: string;
}) {
  const numbers = [...new Set(dossierNumbers)];
  const results: Awaited<ReturnType<typeof getDossier>>[] = [];
  let nextIndex = 0;
  await Promise.all(
    Array.from(
      { length: Math.min(MAX_CONCURRENT_DOSSIERS, numbers.length) },
      async () => {
        while (nextIndex < numbers.length) {
          const index = nextIndex++;
          results[index] = await getDossier({
            numeroDossier: numbers[index],
            userEmail,
          });
        }
      },
    ),
  );
  return {
    dossiers: results
      .filter((result) => result.success)
      .map((result) => result.data),
    unavailableCount: results.filter(
      (result) => !result.success && result.reason === "unavailable",
    ).length,
    deniedCount: results.filter(
      (result) => !result.success && result.reason === "denied",
    ).length,
  };
}
