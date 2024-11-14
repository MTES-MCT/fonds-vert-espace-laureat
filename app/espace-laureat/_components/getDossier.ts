import { Dossier, getChamps } from "@/utils/dossier";
import { createGraphqlClient } from "@/utils/graphql";
import { getDossierQuery } from "@/utils/graphql/getDossierQuery";

const graphqlClient = createGraphqlClient();

export async function getDossier(number: number): Promise<Dossier> {
  const { dossier } = await graphqlClient.request(getDossierQuery, {
    number,
  });

  return {
    numero: dossier.number,
    statut: {
      label: dossier.state,
      date: dossier.dateTraitement,
    },
    champs: getChamps([...dossier.annotations, ...dossier.champs]),
  };
}
