import { ClientError } from "graphql-request";

import { DossierState } from "@/generated/graphql";
import { Dossier } from "@/utils/demarches/subvention";
import { getChamps } from "@/utils/demarches/subvention/champs";
import { stateToLongLabel } from "@/utils/demarches/subvention/state";
import { logException } from "@/utils/error";
import { createGraphqlClient } from "@/utils/graphql";
import { getDossierQuery } from "@/utils/graphql/getDossierQuery";
import { isAdmin } from "@/utils/roles";

const graphqlClient = createGraphqlClient();

export async function getDossier({
  dossierNumber,
  userEmail,
}: {
  dossierNumber: number;
  userEmail: string;
}): Promise<
  { success: true; data: Dossier } | { success: false; error: string }
> {
  try {
    const { dossier } = await graphqlClient.request(getDossierQuery, {
      number: dossierNumber,
    });

    if (dossier.demandeur.__typename !== "PersonneMorale") {
      return {
        success: false,
        error: "Seules les personnes morales peuvent accéder à cet espace",
      };
    }

    if (dossier.state !== DossierState.Accepte) {
      return {
        success: false,
        error: stateToLongLabel(dossier.state),
      };
    }

    if (userEmail !== dossier.usager.email && !isAdmin({ userEmail })) {
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
