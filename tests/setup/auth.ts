import { loadEnvConfig } from "@next/env";
import { sealData } from "iron-session";
import { Page } from "next/experimental/testmode/playwright/msw";

import type { ProjectView } from "@/utils/projectView";
import { getSessionOptions, type Session } from "@/utils/session";

const projectDir = process.cwd();
loadEnvConfig(projectDir);

const DEFAULT_EMAIL = "alice.doe@example.com";
const DEFAULT_SIRET = "12345678910111";

async function createAuthCookie({
  email = DEFAULT_EMAIL,
  siret = DEFAULT_SIRET,
  projectView,
}: {
  email?: string;
  siret?: string;
  projectView?: ProjectView;
} = {}): Promise<{
  name: string;
  value: string;
}> {
  const options = getSessionOptions();

  const sessionData: Session = {
    projectView,
    user: {
      id: "test-user-id",
      isProConnectIdentityProvider: true,
      email,
      isSiretVerifiedForEmailDomain: true,
      siret,
    },
  };

  const seal = await sealData(sessionData, {
    password: options.password,
    ttl: options.ttl,
  });

  return {
    name: options.cookieName,
    value: seal,
  };
}

export async function authenticatePage(
  page: Page,
  {
    email,
    siret,
    projectView,
  }: { email?: string; siret?: string; projectView?: ProjectView } = {},
): Promise<void> {
  const cookie = await createAuthCookie({ email, siret, projectView });

  await page.context().addCookies([
    {
      name: cookie.name,
      value: cookie.value,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
    },
  ]);
}
