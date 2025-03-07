export type SearchParams = Promise<{
  [key: string]: string | string[] | undefined;
}>;

export async function getSearchParams({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { commune: codeCommune } = await searchParams;

  return {
    codeCommune: getCommuneValue(codeCommune),
  };
}

function getCommuneValue(commune: string | string[] | undefined) {
  if (typeof commune === "string") {
    return commune;
  }

  if (Array.isArray(commune)) {
    return commune[0];
  }

  return undefined;
}
