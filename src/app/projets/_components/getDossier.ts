import { ClientError } from "graphql-request";

import { createGraphqlClient } from "@/services/ds/graphql";
import { getDossierAccessQuery } from "@/services/ds/graphql/getDossierAccessQuery";
import { getDossierQuery } from "@/services/ds/graphql/getDossierQuery";
import { Dossier } from "@/services/ds/subvention";
import { getChamps } from "@/services/ds/subvention/champs";
import { logException } from "@/utils/error";
import { isAdmin } from "@/utils/roles";

const graphqlClient = createGraphqlClient();

type DossierAccessFields = {
  demandeur: { __typename?: string };
  usager: { email: string };
  groupeInstructeur: { instructeurs: { email: string }[] };
};

function canAccessDossier({
  dossier,
  userEmail,
}: {
  dossier: DossierAccessFields;
  userEmail: string;
}) {
  if (dossier.demandeur.__typename !== "PersonneMorale") {
    return false;
  }

  return (
    dossier.usager.email === userEmail ||
    dossier.groupeInstructeur.instructeurs.some(
      (instructeur) => instructeur.email === userEmail,
    ) ||
    isAdmin({ userEmail })
  );
}

export async function getDossierAccess({
  numeroDossier,
  userEmail,
}: {
  numeroDossier: number;
  userEmail: string;
}): Promise<boolean> {
  try {
    const { dossier } = await graphqlClient.request(getDossierAccessQuery, {
      number: numeroDossier,
    });

    return canAccessDossier({ dossier, userEmail });
  } catch (error: unknown) {
    logException(error);
    return false;
  }
}

export async function getDossier({
  numeroDossier,
  userEmail,
}: {
  numeroDossier: number;
  userEmail: string;
}): Promise<
  { success: true; data: Dossier } | { success: false; error: string }
> {
  try {
    const { dossier } = await graphqlClient.request(getDossierQuery, {
      number: numeroDossier,
    });

    if (dossier.demandeur.__typename !== "PersonneMorale") {
      return {
        success: false,
        error: "Seules les personnes morales peuvent accéder à cet espace",
      };
    }

    if (!canAccessDossier({ dossier, userEmail })) {
      return {
        success: false,
        error: "Vous n'êtes pas autorisé à accéder à ce dossier",
      };
    }

    return {
      success: true,
      data: {
        numero: dossier.number,
        dateTraitement: dossier.dateTraitement,
        demandeur: {
          email: dossier.usager.email,
          siret: dossier.demandeur.siret,
          libelleNaf: dossier.demandeur?.libelleNaf,
        },
        demarche: {
          title: dossier.demarche.title,
        },
        champs: getChamps([...dossier.annotations, ...dossier.champs]),
      },
    };
  } catch (error: unknown) {
    logException(error);
    if (
      error instanceof ClientError &&
      error.response &&
      error.response.status === 403
    ) {
      return {
        success: false,
        error:
          "Nous ne parvenons pas à nous connecter aux démarches Fonds vert pour le moment. Veuillez nous contacter si le problème persiste.",
      };
    } else {
      return {
        success: false,
        error:
          "Une erreur est survenue. Veuillez nous contacter si le problème persiste.",
      };
    }
  }
}
