import { ClientError } from "graphql-request";

import { DossierState } from "@/generated/graphql";
import { Dossier } from "@/utils/dossier";
import { getChamps } from "@/utils/dossier/champs";
import { stateToLongLabel } from "@/utils/dossier/state";
import { logException } from "@/utils/error";
import { createGraphqlClient } from "@/utils/graphql";
import { getDossierQuery } from "@/utils/graphql/getDossierQuery";

const graphqlClient = createGraphqlClient();

export async function getDossier(
  number: number,
): Promise<
  { success: true; data: Dossier } | { success: false; error: string }
> {
  try {
    const { dossier } = await graphqlClient.request(getDossierQuery, {
      number,
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

    return {
      success: true,
      data: {
        numero: dossier.number,
        dateTraitement: dossier.dateTraitement,
        demandeur: {
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
