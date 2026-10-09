import { requireEnv } from "@/utils/env";

const [baseUrl] = requireEnv("NEXT_PUBLIC_BASE_URL");

export const buildUrl = (path: string): URL => {
  return new URL(path, baseUrl);
};

export const welcomeUrl = buildUrl("/");

export const dashboardUrl = buildUrl("/projets");

export function getAuthenticatedReturnUrl(returnTo?: string): URL {
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

export const errorUrl = buildUrl("/connexion/echec");
