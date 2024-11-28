"use client";

import { Header as DsfrHeader } from "@codegouvfr/react-dsfr/Header";
import { ReactElement } from "react";

import { Navigation } from "@/components/header/Navigation";

export const Header = ({
  quickAccessItems,
}: {
  quickAccessItems: ReactElement[];
}) => (
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
    quickAccessItems={quickAccessItems}
    navigation={<Navigation />}
  />
);
