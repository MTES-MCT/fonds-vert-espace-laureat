/**
 * Creates a cached token provider with mutex to prevent concurrent fetches.
 */
export function createTokenCache<T>(
  fetchToken: () => Promise<T | undefined>,
  ttlMs: number,
): () => Promise<T | undefined> {
  let cachedToken: T | undefined = undefined;
  let tokenExpiresAt = 0;
  let pendingFetch: Promise<T | undefined> | null = null;

  return async function getToken(): Promise<T | undefined> {
    if (cachedToken !== undefined && Date.now() < tokenExpiresAt) {
      return cachedToken;
    }

    if (pendingFetch) {
      return pendingFetch;
    }

    pendingFetch = fetchToken().then(
      (token) => {
        if (token !== undefined) {
          cachedToken = token;
          tokenExpiresAt = Date.now() + ttlMs;
        } else {
          cachedToken = undefined;
          tokenExpiresAt = 0;
        }
        return token;
      },
      (error) => {
        cachedToken = undefined;
        tokenExpiresAt = 0;
        throw error;
      },
    );

    try {
      return await pendingFetch;
    } finally {
      pendingFetch = null;
    }
  };
}
