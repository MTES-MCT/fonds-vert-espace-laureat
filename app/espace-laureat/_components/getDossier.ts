import { Dossier, getChamps } from "@/utils/dossier";
import { createGraphqlClient } from "@/utils/graphql";
import { getDossierQuery } from "@/utils/graphql/getDossierQuery";

const graphqlClient = createGraphqlClient();

export async function getDossier(number: number): Promise<Dossier> {
  const { dossier } = await graphqlClient.request(getDossierQuery, {
    number,
  });

  if (dossier.demandeur.__typename !== "PersonneMorale") {
    throw new Error(
      "Seules les personnes morales peuvent accéder à cet espace",
    );
  }

  return {
    numero: dossier.number,
    statut: {
      label: dossier.state,
      date: dossier.dateTraitement,
    },
    demandeur: {
      siret: dossier.demandeur.siret,
      libelleNaf: dossier.demandeur?.libelleNaf,
    },
    demarche: {
      title: dossier.demarche.title,
    },
    champs: getChamps([...dossier.annotations, ...dossier.champs]),
  };
}
