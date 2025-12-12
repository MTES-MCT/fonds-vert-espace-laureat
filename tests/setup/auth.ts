import { loadEnvConfig } from "@next/env";
import { sealData } from "iron-session";
import { SessionOptions } from "iron-session";
import { Page } from "next/experimental/testmode/playwright/msw";

const projectDir = process.cwd();
loadEnvConfig(projectDir);

const DEFAULT_EMAIL = "alice.doe@example.com";
const DEFAULT_SIRET = "12345678910111";

interface MockUser {
  id: string;
  isProConnectIdentityProvider: boolean;
  email: string;
  isSiretVerifiedForEmailDomain: boolean;
  siret: string;
}

interface SessionData {
  user: MockUser;
  returnTo?: string;
}

const getSessionOptions = (): SessionOptions => {
  const password = process.env.IRON_SESSION_PWD || "";

  return {
    password,
    cookieName: "fonds-vert-espace-laureat",
    cookieOptions: {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
    },
    ttl: 12 * 60 * 60,
  };
};

async function createAuthCookie({
  email = DEFAULT_EMAIL,
  siret = DEFAULT_SIRET,
}: {
  email?: string;
  siret?: string;
} = {}): Promise<{
  name: string;
  value: string;
}> {
  const options = getSessionOptions();

  const sessionData: SessionData = {
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
  { email, siret }: { email?: string; siret?: string } = {},
): Promise<void> {
  const cookie = await createAuthCookie({ email, siret });

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
