export function isRealServiceConfigured(): boolean {
  return [
    "PROCONNECT_DISCOVER_URL",
    "PROCONNECT_CLIENT_ID",
    "PROCONNECT_CLIENT_SECRET",
    "DS_GRAPHQL_ENDPOINT",
    "DS_TOKEN",
    "FONDSVERT_API_ENDPOINT",
    "FONDSVERT_API_USERNAME",
    "FONDSVERT_API_PASSWORD",
    "NEXT_PUBLIC_BASE_URL",
    "IRON_SESSION_PWD",
  ].every((name) => Boolean(process.env[name]?.trim()));
}

export function requireEnv(...vars: string[]): string[] {
  const missing = vars.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(
      missing.length === 1
        ? `La variable d'environnement ${missing[0]} doit être définie.`
        : `Les variables d'environnement ${missing.join(", ")} doivent être définies.`,
    );
  }
  return vars.map((name) => process.env[name]!);
}
