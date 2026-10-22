import { mock } from "node:test";

import { expect, test } from "@playwright/test";

import { buildImpactPrefillUrl } from "@/services/grist/impact";

import { gristChampsDS } from "./fixtures/grist";

test("ordinary prefill recovers after a temporary Grist failure and caches the recovered mapping", async () => {
  const dossierNumber = 89000015;
  const mappingResponses = [
    new Response(null, { status: 503 }),
    Response.json(gristChampsDS),
  ];
  const fetchMapping = mock.method(globalThis, "fetch", async () => {
    const response = mappingResponses.shift();
    if (!response) {
      throw new Error("Unexpected Grist request after the mapping was cached");
    }
    return response;
  });
  const log = mock.method(console, "error", () => {});

  try {
    const degradedUrl = new URL(
      await buildImpactPrefillUrl({ numeroDossier: dossierNumber }),
    );
    expect(degradedUrl.search).toBe("");
    expect(fetchMapping.mock.callCount()).toBe(1);

    const recoveredUrl = new URL(
      await buildImpactPrefillUrl({ numeroDossier: dossierNumber }),
    );
    expect(recoveredUrl.searchParams.get("champ_Q2hhbXAtNDc2OTEyOQ")).toBe(
      String(dossierNumber),
    );
    expect(fetchMapping.mock.callCount()).toBe(2);

    const cachedUrl = await buildImpactPrefillUrl({
      numeroDossier: dossierNumber,
    });
    expect(cachedUrl).toBe(recoveredUrl.toString());
    expect(fetchMapping.mock.callCount()).toBe(2);
  } finally {
    fetchMapping.mock.restore();
    log.mock.restore();
  }
});
