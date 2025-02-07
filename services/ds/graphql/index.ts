import { GraphQLClient } from "graphql-request";

import { requireEnv } from "@/utils/env";

export function createGraphqlClient() {
  const [endpoint, token] = requireEnv("DS_GRAPHQL_ENDPOINT", "DS_TOKEN");

  return new GraphQLClient(endpoint, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
