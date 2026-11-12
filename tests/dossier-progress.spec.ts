import {
  expect,
  graphql,
  HttpResponse,
  type Page,
  test,
} from "next/experimental/testmode/playwright/msw";

import { closeDb } from "@/db";
import {
  appendDossierProgressRevision,
  DossierProgressConflict,
  getDossierProgress,
} from "@/db/dossierProgress";

import { getDossierData } from "./fixtures/ds";
import { authenticatePage } from "./setup/auth";
import {
  createTestDatabaseClient,
  deleteStoredDossierProgress,
  getStoredDossierProgressRevisions,
} from "./setup/db";

const ds = graphql.link("https://demarche.numerique.gouv.fr/api/v2/graphql");
const BASE_DOSSIER_NUMBER = 89998032;
const PORTEUR_EMAIL = "porteur.avancement@example.com";
const INSTRUCTEUR_EMAIL = "instructeur.avancement@example.com";
const ADMIN_EMAIL = "alice.doe@example.com";

async function postProgress({
  page,
  dossierNumber,
  status,
  expectedRevision,
  confirmed,
  authorEmail,
}: {
  page: Page;
  dossierNumber: number;
  status: unknown;
  expectedRevision?: unknown;
  confirmed?: unknown;
  authorEmail?: string;
}) {
  return page.evaluate(
    async ({
      dossierNumber,
      status,
      expectedRevision,
      confirmed,
      authorEmail,
    }) => {
      const response = await fetch(`/api/projets/${dossierNumber}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          expectedRevision,
          confirmed,
          authorEmail,
        }),
      });
      return {
        status: response.status,
        body: await response.json().catch(() => null),
      };
    },
    { dossierNumber, status, expectedRevision, confirmed, authorEmail },
  );
}

test.beforeEach(async ({}, testInfo) => {
  await deleteStoredDossierProgress(
    BASE_DOSSIER_NUMBER + testInfo.parallelIndex,
  );
});

test.afterEach(async ({}, testInfo) => {
  await deleteStoredDossierProgress(
    BASE_DOSSIER_NUMBER + testInfo.parallelIndex,
  );
});

test.afterAll(async () => {
  await closeDb();
});

test.describe("dossier progress storage", () => {
  test("reads an unreported dossier without inventing a status or a revision", async ({}, testInfo) => {
    const dossierNumber = BASE_DOSSIER_NUMBER + testInfo.parallelIndex;

    expect(await getDossierProgress({ numeroDossier: dossierNumber })).toEqual({
      revision: 0,
      status: null,
      updatedAt: null,
    });
    expect(await getStoredDossierProgressRevisions(dossierNumber)).toEqual([]);
  });

  test("keeps all five statuses and backward changes with successive authors and server dates", async ({}, testInfo) => {
    const dossierNumber = BASE_DOSSIER_NUMBER + testInfo.parallelIndex;
    const sql = createTestDatabaseClient();
    const changes = [
      { status: "Non-commencé", authorEmail: PORTEUR_EMAIL, confirmed: false },
      {
        status: "En cours de réalisation",
        authorEmail: INSTRUCTEUR_EMAIL,
        confirmed: false,
      },
      { status: "Bloqué", authorEmail: PORTEUR_EMAIL, confirmed: false },
      { status: "Abandonné", authorEmail: INSTRUCTEUR_EMAIL, confirmed: true },
      {
        status: "En cours de réalisation",
        authorEmail: PORTEUR_EMAIL,
        confirmed: false,
      },
      { status: "Terminé", authorEmail: INSTRUCTEUR_EMAIL, confirmed: true },
      { status: "Non-commencé", authorEmail: PORTEUR_EMAIL, confirmed: false },
    ] as const;

    try {
      const [before] = await sql<
        { now: Date }[]
      >`select clock_timestamp() as now`;
      for (const [index, change] of changes.entries()) {
        const target = await appendDossierProgressRevision({
          numeroDossier: dossierNumber,
          expectedRevision: index,
          ...change,
        });

        expect(target).toEqual({
          revision: index + 1,
          status: change.status,
          updatedAt: expect.any(String),
        });
        expect(
          await getDossierProgress({ numeroDossier: dossierNumber }),
        ).toEqual(target);
        const stored = await getStoredDossierProgressRevisions(dossierNumber);
        expect(stored[index].created_at.toISOString()).toBe(target.updatedAt);
      }
      const [after] = await sql<
        { now: Date }[]
      >`select clock_timestamp() as now`;

      const revisions = await getStoredDossierProgressRevisions(dossierNumber);
      expect(revisions).toEqual(
        changes.map((change, index) => ({
          revision: index + 1,
          status: change.status,
          author_email: change.authorEmail,
          created_at: expect.any(Date),
        })),
      );
      for (const [index, revision] of revisions.entries()) {
        expect(revision.created_at.getTime()).toBeGreaterThanOrEqual(
          before.now.getTime(),
        );
        expect(revision.created_at.getTime()).toBeLessThanOrEqual(
          after.now.getTime(),
        );
        if (index > 0) {
          expect(revision.created_at.getTime()).toBeGreaterThanOrEqual(
            revisions[index - 1].created_at.getTime(),
          );
        }
      }
    } finally {
      await sql.end();
    }
  });

  for (const status of ["Terminé", "Abandonné"] as const) {
    test(`keeps the author and date when another actor resaves ${status} without reconfirming`, async ({}, testInfo) => {
      const dossierNumber = BASE_DOSSIER_NUMBER + testInfo.parallelIndex;
      const original = await appendDossierProgressRevision({
        numeroDossier: dossierNumber,
        status,
        expectedRevision: 0,
        authorEmail: PORTEUR_EMAIL,
        confirmed: true,
      });
      const before = await getStoredDossierProgressRevisions(dossierNumber);

      const unchanged = await appendDossierProgressRevision({
        numeroDossier: dossierNumber,
        status,
        expectedRevision: 1,
        authorEmail: INSTRUCTEUR_EMAIL,
        confirmed: false,
      });

      expect(unchanged).toEqual(original);
      expect(await getStoredDossierProgressRevisions(dossierNumber)).toEqual(
        before,
      );
    });
  }

  test("rejects invalid statuses and unconfirmed terminal changes without recording a modification", async ({}, testInfo) => {
    const dossierNumber = BASE_DOSSIER_NUMBER + testInfo.parallelIndex;

    for (const status of [
      undefined,
      null,
      42,
      "En cours",
      "Non commencé",
      "",
    ]) {
      await expect(
        appendDossierProgressRevision({
          numeroDossier: dossierNumber,
          status,
          expectedRevision: 0,
          authorEmail: PORTEUR_EMAIL,
          confirmed: true,
        }),
      ).rejects.toMatchObject({
        name: "DossierProgressError",
        code: "invalid-status",
      });
    }

    for (const status of ["Terminé", "Abandonné"] as const) {
      await expect(
        appendDossierProgressRevision({
          numeroDossier: dossierNumber,
          status,
          expectedRevision: 0,
          authorEmail: PORTEUR_EMAIL,
          confirmed: false,
        }),
      ).rejects.toMatchObject({
        name: "DossierProgressError",
        code: "confirmation-required",
      });
    }

    expect(await getStoredDossierProgressRevisions(dossierNumber)).toEqual([]);
    expect(await getDossierProgress({ numeroDossier: dossierNumber })).toEqual({
      revision: 0,
      status: null,
      updatedAt: null,
    });
  });

  for (const { situation, initialStatus, proposals } of [
    {
      situation: "two different first statuses",
      initialStatus: null,
      proposals: ["Non-commencé", "Bloqué"],
    },
    {
      situation: "two identical first statuses",
      initialStatus: null,
      proposals: ["Bloqué", "Bloqué"],
    },
    {
      situation: "two different changes from the same saved revision",
      initialStatus: "Non-commencé",
      proposals: ["En cours de réalisation", "Bloqué"],
    },
    {
      situation: "two identical changes from the same saved revision",
      initialStatus: "Non-commencé",
      proposals: ["Bloqué", "Bloqué"],
    },
  ] as const) {
    test(`accepts only one writer for ${situation}`, async ({}, testInfo) => {
      const dossierNumber = BASE_DOSSIER_NUMBER + testInfo.parallelIndex;
      if (initialStatus) {
        await appendDossierProgressRevision({
          numeroDossier: dossierNumber,
          status: initialStatus,
          expectedRevision: 0,
          authorEmail: null,
          confirmed: false,
        });
      }
      const opened = await getDossierProgress({ numeroDossier: dossierNumber });
      const actors = [PORTEUR_EMAIL, INSTRUCTEUR_EMAIL];

      const results = await Promise.allSettled(
        proposals.map((status, index) =>
          appendDossierProgressRevision({
            numeroDossier: dossierNumber,
            status,
            expectedRevision: opened.revision,
            authorEmail: actors[index],
            confirmed: false,
          }),
        ),
      );

      const winnerIndex = results.findIndex(
        (result) => result.status === "fulfilled",
      );
      expect(
        results.filter((result) => result.status === "fulfilled"),
      ).toHaveLength(1);
      const rejected = results.find((result) => result.status === "rejected");
      expect(rejected?.reason).toBeInstanceOf(DossierProgressConflict);
      const current = await getDossierProgress({
        numeroDossier: dossierNumber,
      });
      expect(rejected?.reason.target).toEqual(current);
      expect(current).toEqual({
        revision: opened.revision + 1,
        status: proposals[winnerIndex],
        updatedAt: expect.any(String),
      });

      const revisions = await getStoredDossierProgressRevisions(dossierNumber);
      expect(revisions).toHaveLength(opened.revision + 1);
      expect(revisions.at(-1)).toMatchObject({
        revision: current.revision,
        status: current.status,
        author_email: actors[winnerIndex],
      });
      if (initialStatus) expect(revisions[0].author_email).toBeNull();
    });
  }

  test("preserves the previous revision and author when PostgreSQL rejects the next insert", async ({}, testInfo) => {
    const dossierNumber = BASE_DOSSIER_NUMBER + testInfo.parallelIndex;
    const original = await appendDossierProgressRevision({
      numeroDossier: dossierNumber,
      status: "Non-commencé",
      expectedRevision: 0,
      authorEmail: null,
      confirmed: false,
    });
    const before = await getStoredDossierProgressRevisions(dossierNumber);

    await expect(
      appendDossierProgressRevision({
        numeroDossier: dossierNumber,
        status: "Bloqué",
        expectedRevision: 1,
        authorEmail: "invalid\u0000@example.com",
        confirmed: false,
      }),
    ).rejects.toMatchObject({ cause: { code: "22021" } });

    expect(await getStoredDossierProgressRevisions(dossierNumber)).toEqual(
      before,
    );
    expect(await getDossierProgress({ numeroDossier: dossierNumber })).toEqual(
      original,
    );

    const retry = await appendDossierProgressRevision({
      numeroDossier: dossierNumber,
      status: "Bloqué",
      expectedRevision: 1,
      authorEmail: INSTRUCTEUR_EMAIL,
      confirmed: false,
    });
    expect(retry.revision).toBe(2);
    expect(await getStoredDossierProgressRevisions(dossierNumber)).toEqual([
      ...before,
      {
        revision: 2,
        status: "Bloqué",
        author_email: INSTRUCTEUR_EMAIL,
        created_at: expect.any(Date),
      },
    ]);
  });

  test("measures thirty sequential writes and thirty reads against PostgreSQL", async ({}, testInfo) => {
    const dossierNumber = BASE_DOSSIER_NUMBER + testInfo.parallelIndex;
    const durations = { writes: [] as number[], reads: [] as number[] };

    for (let revision = 1; revision <= 30; revision += 1) {
      const status = revision % 2 === 0 ? "Bloqué" : "Non-commencé";
      const writeStartedAt = performance.now();
      const saved = await appendDossierProgressRevision({
        numeroDossier: dossierNumber,
        status,
        expectedRevision: revision - 1,
        authorEmail: PORTEUR_EMAIL,
        confirmed: false,
      });
      durations.writes.push(performance.now() - writeStartedAt);
      expect(saved.revision).toBe(revision);

      const readStartedAt = performance.now();
      const read = await getDossierProgress({ numeroDossier: dossierNumber });
      durations.reads.push(performance.now() - readStartedAt);
      expect(read).toEqual(saved);
    }

    expect(await getStoredDossierProgressRevisions(dossierNumber)).toHaveLength(
      30,
    );
    const summary = Object.fromEntries(
      Object.entries(durations).map(([operation, samples]) => {
        const ordered = [...samples].sort((left, right) => left - right);
        return [
          operation,
          {
            samples: ordered.length,
            medianMs: (ordered[14] + ordered[15]) / 2,
            p95Ms: ordered[28],
          },
        ];
      }),
    );
    const measurement = {
      scenario: "dossier-progress",
      database: "local PostgreSQL",
      summary,
      durationsMs: durations,
    };
    console.log(JSON.stringify(measurement));
    await testInfo.attach("dossier-progress-performance.json", {
      body: JSON.stringify(measurement),
      contentType: "application/json",
    });
  });
});

test.describe("dossier progress HTTP access", () => {
  test.use({
    mswHandlers: [
      [
        ds.query("getDossierAccess", () => {
          const { demandeur } = getDossierData.data.dossier;
          return HttpResponse.json({
            data: {
              dossier: {
                demandeur,
                usager: { email: PORTEUR_EMAIL },
                groupeInstructeur: {
                  instructeurs: [{ email: INSTRUCTEUR_EMAIL }],
                },
              },
            },
          });
        }),
      ],
      { scope: "test" },
    ],
  });

  test.beforeEach(async ({ page }) => {
    await authenticatePage(page, { email: PORTEUR_EMAIL });
    await page.goto("/projets/demo");
  });

  test("attributes successive changes to the porteur, instructeur and administrator sessions despite a forged author", async ({
    page,
  }, testInfo) => {
    const dossierNumber = BASE_DOSSIER_NUMBER + testInfo.parallelIndex;
    const changes = [
      {
        email: PORTEUR_EMAIL,
        status: "En cours de réalisation",
        confirmed: false,
      },
      { email: INSTRUCTEUR_EMAIL, status: "Bloqué", confirmed: false },
      { email: ADMIN_EMAIL, status: "Terminé", confirmed: true },
    ] as const;

    for (const [index, change] of changes.entries()) {
      await page.context().clearCookies();
      await authenticatePage(page, { email: change.email });

      const response = await postProgress({
        page,
        dossierNumber,
        status: change.status,
        expectedRevision: index,
        confirmed: change.confirmed,
        authorEmail: "forged@example.com",
      });

      expect(response).toEqual({
        status: 200,
        body: {
          target: {
            revision: index + 1,
            status: change.status,
            updatedAt: expect.any(String),
          },
        },
      });
    }

    expect(await getStoredDossierProgressRevisions(dossierNumber)).toEqual(
      changes.map((change, index) => ({
        revision: index + 1,
        status: change.status,
        author_email: change.email,
        created_at: expect.any(Date),
      })),
    );
  });

  for (const { actor, email, status, error } of [
    {
      actor: "an unauthenticated visitor",
      email: null,
      status: 401,
      error: "Utilisateur non authentifié",
    },
    {
      actor: "an unrelated authenticated user",
      email: "mallory@example.com",
      status: 403,
      error: "Accès refusé à ce dossier",
    },
  ]) {
    test(`refuses ${actor} without exposing or modifying progress that the porteur can update`, async ({
      page,
    }, testInfo) => {
      const dossierNumber = BASE_DOSSIER_NUMBER + testInfo.parallelIndex;
      await appendDossierProgressRevision({
        numeroDossier: dossierNumber,
        status: "Bloqué",
        expectedRevision: 0,
        authorEmail: PORTEUR_EMAIL,
        confirmed: false,
      });
      const before = await getStoredDossierProgressRevisions(dossierNumber);
      await page.context().clearCookies();
      if (email) await authenticatePage(page, { email });

      const refused = await postProgress({
        page,
        dossierNumber,
        status: "En cours de réalisation",
        expectedRevision: 1,
      });

      expect(refused).toEqual({ status, body: { error } });
      expect(await getStoredDossierProgressRevisions(dossierNumber)).toEqual(
        before,
      );

      await page.context().clearCookies();
      await authenticatePage(page, { email: PORTEUR_EMAIL });
      const authorized = await postProgress({
        page,
        dossierNumber,
        status: "En cours de réalisation",
        expectedRevision: 1,
      });

      expect(authorized.status).toBe(200);
      expect(await getStoredDossierProgressRevisions(dossierNumber)).toEqual([
        ...before,
        {
          revision: 2,
          status: "En cours de réalisation",
          author_email: PORTEUR_EMAIL,
          created_at: expect.any(Date),
        },
      ]);
    });
  }

  test("requires an integer opened revision while accepting zero for a first change", async ({
    page,
  }, testInfo) => {
    const dossierNumber = BASE_DOSSIER_NUMBER + testInfo.parallelIndex;

    for (const expectedRevision of [undefined, null, "0", -1, 0.5]) {
      const response = await postProgress({
        page,
        dossierNumber,
        status: "Bloqué",
        expectedRevision,
      });
      expect(response).toEqual({
        status: 400,
        body: { error: "Révision lue invalide ou manquante" },
      });
    }
    expect(await getStoredDossierProgressRevisions(dossierNumber)).toEqual([]);

    const valid = await postProgress({
      page,
      dossierNumber,
      status: "Bloqué",
      expectedRevision: 0,
    });
    expect(valid.status).toBe(200);
    expect(valid.body.target.revision).toBe(1);
  });

  test("rejects an invalid status without storing an author or revision", async ({
    page,
  }, testInfo) => {
    const dossierNumber = BASE_DOSSIER_NUMBER + testInfo.parallelIndex;

    const response = await postProgress({
      page,
      dossierNumber,
      status: "En cours",
      expectedRevision: 0,
    });

    expect(response).toEqual({
      status: 400,
      body: { error: "Avancement invalide" },
    });
    expect(await getStoredDossierProgressRevisions(dossierNumber)).toEqual([]);
  });

  test("keeps the previous status and author when an authorized HTTP save fails in PostgreSQL", async ({
    page,
  }, testInfo) => {
    const dossierNumber = BASE_DOSSIER_NUMBER + testInfo.parallelIndex;
    const original = await postProgress({
      page,
      dossierNumber,
      status: "Non-commencé",
      expectedRevision: 0,
    });
    expect(original.status).toBe(200);
    const before = await getStoredDossierProgressRevisions(dossierNumber);
    const sql = createTestDatabaseClient();
    const constraint = `progress_test_insert_failure_${dossierNumber}`;

    try {
      await sql.unsafe(
        `alter table dossier_progress_revisions add constraint ${constraint} check (dossier_number <> ${dossierNumber} or revision < 2)`,
      );
      const failed = await postProgress({
        page,
        dossierNumber,
        status: "Bloqué",
        expectedRevision: 1,
      });
      expect(failed.status).toBe(500);
      expect(await getStoredDossierProgressRevisions(dossierNumber)).toEqual(
        before,
      );
      expect(
        await getDossierProgress({ numeroDossier: dossierNumber }),
      ).toEqual(original.body.target);
    } finally {
      await sql.unsafe(
        `alter table dossier_progress_revisions drop constraint if exists ${constraint}`,
      );
      await sql.end();
    }

    const retry = await postProgress({
      page,
      dossierNumber,
      status: "Bloqué",
      expectedRevision: 1,
    });
    expect(retry.status).toBe(200);
    expect(
      (await getStoredDossierProgressRevisions(dossierNumber)).at(-1),
    ).toMatchObject({
      revision: 2,
      status: "Bloqué",
      author_email: PORTEUR_EMAIL,
    });
  });

  for (const status of ["Terminé", "Abandonné"] as const) {
    test(`requires explicit confirmation before saving ${status}`, async ({
      page,
    }, testInfo) => {
      const dossierNumber = BASE_DOSSIER_NUMBER + testInfo.parallelIndex;

      for (const confirmed of [undefined, false, "true"]) {
        const refused = await postProgress({
          page,
          dossierNumber,
          status,
          expectedRevision: 0,
          confirmed,
        });
        expect(refused).toEqual({
          status: 400,
          body: { error: "Confirmez le passage à cet avancement" },
        });
      }
      expect(await getStoredDossierProgressRevisions(dossierNumber)).toEqual(
        [],
      );

      const confirmed = await postProgress({
        page,
        dossierNumber,
        status,
        expectedRevision: 0,
        confirmed: true,
      });
      expect(confirmed.status).toBe(200);
      expect(await getStoredDossierProgressRevisions(dossierNumber)).toEqual([
        {
          revision: 1,
          status,
          author_email: PORTEUR_EMAIL,
          created_at: expect.any(Date),
        },
      ]);
    });
  }

  test("returns the current status without its author for obsolete changes, including an identical status", async ({
    page,
  }, testInfo) => {
    const dossierNumber = BASE_DOSSIER_NUMBER + testInfo.parallelIndex;
    const original = await postProgress({
      page,
      dossierNumber,
      status: "Bloqué",
      expectedRevision: 0,
    });
    expect(original.status).toBe(200);
    const before = await getStoredDossierProgressRevisions(dossierNumber);
    await page.context().clearCookies();
    await authenticatePage(page, { email: INSTRUCTEUR_EMAIL });

    for (const status of ["En cours de réalisation", "Bloqué"]) {
      const obsolete = await postProgress({
        page,
        dossierNumber,
        status,
        expectedRevision: 0,
      });

      expect(obsolete).toEqual({
        status: 409,
        body: {
          error: expect.stringContaining("L’avancement actuel a été chargé"),
          target: original.body.target,
        },
      });
      expect(await getStoredDossierProgressRevisions(dossierNumber)).toEqual(
        before,
      );
    }

    const unchanged = await postProgress({
      page,
      dossierNumber,
      status: "Bloqué",
      expectedRevision: 1,
    });
    expect(unchanged).toEqual(original);
    expect(await getStoredDossierProgressRevisions(dossierNumber)).toEqual(
      before,
    );
  });
});
