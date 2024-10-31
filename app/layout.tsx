import "./globals.css";

import { DsfrProvider } from "@codegouvfr/react-dsfr/next-appdir/DsfrProvider";
import { getHtmlAttributes } from "@codegouvfr/react-dsfr/next-appdir/getHtmlAttributes";
import { ReactElement } from "react";

import { defaultColorScheme } from "@/components/dsfr/defaultColorScheme";
import { DsfrHead } from "@/components/dsfr/DsfrHead";
import { StartDsfr } from "@/components/dsfr/StartDsfr";
import { Footer } from "@/components/footer/Footer";
import { Header } from "@/components/header/Header";

export default function RootLayout({ children }: { children: ReactElement }) {
  const lang = "fr";
  return (
    <html {...getHtmlAttributes({ defaultColorScheme, lang })}>
      <head>
        <StartDsfr />
        <DsfrHead />
      </head>
      <body>
        <DsfrProvider lang={lang}>
          <Header />
          <main className="fr-container my-8 min-h-80">{children}</main>
          <Footer />
        </DsfrProvider>
      </body>
    </html>
  );
}
