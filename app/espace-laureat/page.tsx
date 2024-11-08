import { GraphQLClient } from "graphql-request";
import { redirect } from "next/navigation";

import { graphql } from "@/generated";
import { getSession } from "@/utils/session";

export default async function EspaceLaureat() {
  const session = await getSession();
  const user = session?.user;

  // Todo: verify if user can access the demarche
  if (!user || !user.email || !user.email_verified) {
    return redirect("/connexion");
  }

  const endpoint = process.env.DS_GRAPHQL_ENDPOINT;
  const token = process.env.DS_TOKEN;

  if (!token || !endpoint) {
    return <div>Configuration invalide.</div>;
  }

  const graphqlClient = new GraphQLClient(endpoint, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const getDemarche = graphql(`
    query getDemarche($number: Int!) {
      demarche(number: $number) {
        id
      }
    }
  `);

  try {
    const { demarche } = await graphqlClient.request(getDemarche, {
      number: 1234,
    });

    return (
      <div className="max-w-2xl pb-24">
        <h1>Espace lauréat</h1>
        <p>{user.email}</p>
        <p>{demarche.id}</p>
        <p className="fr-text--lead">
          Suivez vos subventions et réalisez une demande de versement.
        </p>
      </div>
    );
  } catch {
    return <div>Erreur lors de la récupération des données.</div>;
  }
}
