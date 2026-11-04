"use client";

import {
  Header as DsfrHeader,
  HeaderQuickAccessItem,
} from "@codegouvfr/react-dsfr/Header";

import { Navigation } from "@/components/header/Navigation";
import { ProjectViewSwitch } from "@/components/header/ProjectViewSwitch";
import type { ProjectView } from "@/utils/projectView";

export const Header = ({
  userEmail,
  adminView,
}: {
  userEmail?: string;
  adminView?: ProjectView;
}) => {
  const quickAccessItems = userEmail
    ? [
        ...(adminView
          ? [<ProjectViewSwitch key="view" view={adminView} />]
          : []),
        <span
          key="email"
          className={`
            fr-btn fr-btn--tertiary-no-outline fr-icon-account-circle-line fr-btn--icon-left
            cursor-default text-[var(--text-default-grey)]
            hover:bg-transparent
          `}
        >
          {userEmail}
        </span>,
        <HeaderQuickAccessItem
          key="logout"
          quickAccessItem={{
            iconId: "fr-icon-logout-box-r-line",
            text: "Se déconnecter",
            buttonProps: {
              type: "submit",
              form: "proconnect-logout-form",
            },
          }}
        />,
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
