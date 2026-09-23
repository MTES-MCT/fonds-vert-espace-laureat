import { expect, test } from "@playwright/test";

test("machine API is closed without explicit ingress configuration", async ({
  request,
}) => {
  test.skip(process.env.CORRECTIONS_API_ENABLED === "true");
  const response = await request.get("/api/v1/corrections");
  expect(response.status()).toBe(503);
  expect(response.headers()["cache-control"]).toBe("no-store");
  expect(await response.json()).toEqual({ error: "unavailable" });
});

test("unsupported methods never create an export", async ({ request }) => {
  for (const method of ["HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]) {
    const response = await request.fetch("/api/v1/corrections", { method });
    expect(response.status()).toBe(405);
    expect(response.headers()["cache-control"]).toBe("no-store");
    expect(response.headers().allow).toBe("GET");
  }
});

test("configured ingress creates a real export", async ({ request }) => {
  test.skip(process.env.CORRECTIONS_API_ENABLED !== "true");
  const response = await request.get("/api/v1/corrections?page_size=2", {
    headers: {
      authorization: `Bearer ${process.env.CORRECTIONS_API_KEY}`,
      "x-corrections-ingress": process.env.CORRECTIONS_INGRESS_SECRET!,
      "x-corrections-client-ip": "192.0.2.10",
      "x-corrections-proto": "https",
    },
  });
  expect(response.status()).toBe(200);
  expect(response.headers()["cache-control"]).toBe("no-store");
  expect(await response.json()).toMatchObject({
    total_count: 0,
    corrections: [],
    next_cursor: null,
  });
});
