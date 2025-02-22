import "./globals.css";

import { HeaderQuickAccessItem } from "@codegouvfr/react-dsfr/Header";
import { getHtmlAttributes } from "@codegouvfr/react-dsfr/next-appdir/getHtmlAttributes";
import { ReactElement } from "react";

import { defaultColorScheme } from "@/components/dsfr/defaultColorScheme";
import { DsfrHead } from "@/components/dsfr/DsfrHead";
import { StartDsfr } from "@/components/dsfr/StartDsfr";
import { Footer } from "@/components/footer/Footer";
import { Header } from "@/components/header/Header";
import { getSession } from "@/utils/session";

export default async function RootLayout({
  children,
}: {
  children: ReactElement;
}) {
  const lang = "fr";

  const session = await getSession();
  const user = session?.user;

  const quickAccessItems = user
    ? [
        <div key={0} className="sm:flex items-center gap-x-2 mb-4">
          <div className="text-sm font-medium">{user.email}</div>
          <HeaderQuickAccessItem
            quickAccessItem={{
              iconId: "fr-icon-logout-box-r-line",
              text: "Se déconnecter",
              linkProps: {
                className: "mb-0",
                href: "/api/auth/proconnect/logout",
              },
            }}
          />
        </div>,
      ]
    : [
        <HeaderQuickAccessItem
          key={0}
          quickAccessItem={{
            iconId: "ri-account-box-line",
            text: "Espace lauréat",
            linkProps: { href: "/espace-laureat" },
          }}
        />,
      ];

  return (
    <html {...getHtmlAttributes({ defaultColorScheme, lang })}>
      <head>
        <StartDsfr />
        <DsfrHead />
      </head>
      <body>
        <Header quickAccessItems={quickAccessItems} />
        <main className="fr-container my-8 min-h-80">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
