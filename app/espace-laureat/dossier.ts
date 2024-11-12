import { graphql } from "@/generated";
import { createGraphqlClient } from "@/utils/graphql-client";

const graphqlClient = createGraphqlClient();

const getDossierQuery = graphql(`
  query getDossier($number: Int!) {
    dossier(number: $number) {
      id
      number
      state
      dateTraitement
      usager {
        email
      }
    }
  }
`);

export async function getDossier(number: number) {
  const { dossier } = await graphqlClient.request(getDossierQuery, {
    number,
  });

  return dossier;
}
