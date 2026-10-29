import "./globals.css";

import { createGetHtmlAttributes } from "@codegouvfr/react-dsfr/next-app-router/getHtmlAttributes";

import { DsfrProvider } from "@/components/dsfr";
import { defaultColorScheme } from "@/components/dsfr/defaultColorScheme";
import { DsfrHead } from "@/components/dsfr/DsfrHead";
import { Footer } from "@/components/footer/Footer";
import { Header } from "@/components/header/Header";
import { isAdmin } from "@/utils/roles";
import { getSession } from "@/utils/session";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const lang = "fr";
  const { getHtmlAttributes } = createGetHtmlAttributes({
    defaultColorScheme,
  });
  const session = await getSession();
  const user = session?.user;

  return (
    <html {...getHtmlAttributes({ lang })}>
      <head>
        <DsfrHead />
      </head>
      <body>
        <DsfrProvider lang={lang}>
          <Header
            userEmail={user?.email}
            adminView={
              user && isAdmin({ userEmail: user.email })
                ? (session.projectView ?? "porteur")
                : undefined
            }
          />
          <main className="min-h-80">{children}</main>
          <Footer />
        </DsfrProvider>
      </body>
    </html>
  );
}
