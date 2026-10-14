"use client";

import {
  Header as DsfrHeader,
  HeaderQuickAccessItem,
} from "@codegouvfr/react-dsfr/Header";

import { Navigation } from "@/components/header/Navigation";

export const Header = ({ userEmail }: { userEmail?: string }) => {
  const quickAccessItems = userEmail
    ? [
        <div key={0} className="mb-4 items-center gap-x-2 sm:flex">
          <div className="text-sm font-medium">{userEmail}</div>
          <HeaderQuickAccessItem
            quickAccessItem={{
              iconId: "fr-icon-logout-box-r-line",
              text: "Se déconnecter",
              buttonProps: {
                className: "mb-0",
                type: "submit",
                form: "proconnect-logout-form",
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
            text: "Vert impact",
            linkProps: { href: "/projets" },
          }}
        />,
      ];

  return (
    <>
      <DsfrHeader
        brandTop={
          <>
            Ministères
            <br />
            transition écologique
            <br />
            aménagement du territoire
            <br />
            transports
            <br />
            ville et logement
          </>
        }
        serviceTitle="Vert impact"
        serviceTagline="Accélérer la transition écologique dans les territoires"
        homeLinkProps={{
          href: "/",
          title:
            "Accueil - Vert impact (Ministère du Partenariat avec les territoires et de la Décentralisation - Ministère de la Transition écologique, de l’Énergie, du Climat et de la Prévention des risques - Ministère du Logement et de la Rénovation urbaine)",
        }}
        quickAccessItems={quickAccessItems}
        navigation={<Navigation />}
      />
      {userEmail && (
        <form
          id="proconnect-logout-form"
          action="/api/auth/proconnect/logout"
          method="post"
        />
      )}
    </>
  );
};
