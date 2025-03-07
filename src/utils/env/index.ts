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
