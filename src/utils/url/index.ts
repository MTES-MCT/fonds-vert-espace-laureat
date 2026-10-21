import { requireEnv } from "@/utils/env";

export const buildUrl = (path: string): URL => {
  const [baseUrl] = requireEnv("NEXT_PUBLIC_BASE_URL");
  return new URL(path, baseUrl);
};

export const welcomeUrl = () => buildUrl("/");

export function getAuthenticatedReturnUrl(returnTo?: string): URL {
  const dashboardUrl = buildUrl("/projets");
  if (!returnTo?.startsWith("/") || returnTo.startsWith("//")) {
    return dashboardUrl;
  }

  let destination: URL;
  try {
    destination = buildUrl(returnTo);
  } catch {
    return dashboardUrl;
  }

  return destination.origin === dashboardUrl.origin
    ? destination
    : dashboardUrl;
}

export const errorUrl = () => buildUrl("/connexion/echec");
