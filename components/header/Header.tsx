"use client";

import { headerFooterDisplayItem } from "@codegouvfr/react-dsfr/Display";
import { Header as DsfrHeader } from "@codegouvfr/react-dsfr/Header";
import { HeaderQuickAccessItem } from "@codegouvfr/react-dsfr/Header";

import { Navigation } from "@/components/header/Navigation";

export const Header = () => (
  <DsfrHeader
    brandTop={
      <>
        MINISTÈRES
        <br />
        TERRITOIRES
        <br />
        ÉCOLOGIE
        <br />
        LOGEMENT <span className="sr-only">Liberté, Égalité, Fraternité</span>
      </>
    }
    serviceTitle="Fonds vert"
    serviceTagline="Accélérer la transition écologique dans les territoires"
    homeLinkProps={{
      href: "/",
      title:
        "Accueil - Fonds vert (Ministère du Partenariat avec les territoires et de la Décentralisation - Ministère de la Transition écologique, de l’Énergie, du Climat et de la Prévention des risques - Ministère du Logement et de la Rénovation urbaine)",
    }}
    quickAccessItems={[
      <HeaderQuickAccessItem
        key={0}
        quickAccessItem={{
          iconId: "ri-account-box-line",
          text: "Espace lauréat",
          linkProps: { href: "/connexion" },
        }}
      />,
    ]}
    navigation={<Navigation />}
  />
);
