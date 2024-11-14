import { GraphQLClient } from "graphql-request";

export function createGraphqlClient() {
  const endpoint = process.env.DS_GRAPHQL_ENDPOINT;
  const token = process.env.DS_TOKEN;

  if (!endpoint) {
    throw new Error(
      "La variable d'environnement DS_GRAPHQL_ENDPOINT n'est pas définie",
    );
  }

  if (!token) {
    throw new Error("La variable d'environnement DS_TOKEN n'est pas définie");
  }

  return new GraphQLClient(endpoint, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
