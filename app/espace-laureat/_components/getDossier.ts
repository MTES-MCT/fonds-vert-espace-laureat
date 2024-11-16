import { DossierState } from "@/generated/graphql";
import { Dossier, getChamps } from "@/utils/dossier";
import { stateToLongLabel } from "@/utils/dossier/state";
import { createGraphqlClient } from "@/utils/graphql";
import { getDossierQuery } from "@/utils/graphql/getDossierQuery";

const graphqlClient = createGraphqlClient();

export async function getDossier(
  number: number,
): Promise<
  { success: true; data: Dossier } | { success: false; error: string }
> {
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
}
