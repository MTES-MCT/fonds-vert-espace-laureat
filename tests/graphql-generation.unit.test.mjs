import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { once } from "node:events";
import {
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const generator = fileURLToPath(
  new URL("../scripts/codegen.mjs", import.meta.url),
);
const query = "export const greeting = graphql(`query Greeting { greeting }`);";
const config = `schema:
  - schema.graphql
documents:
  - 'src/**/*.ts'
  - 'src/**/*.tsx'
  - '!src/generated/**'
  - '!src/**/*.d.ts'
generates:
  src/generated/:
    preset: client
    plugins: []
    presetConfig:
      fragmentMasking: false
`;

async function project(t) {
  const root = await mkdtemp(join(tmpdir(), "vert-impact-graphql-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, "src"));
  await writeFile(
    join(root, "schema.graphql"),
    "type Query { greeting: String! }",
  );
  await writeFile(join(root, "graphql.config.yml"), config);
  await writeFile(join(root, "src/greeting.ts"), query);
  return root;
}

function generate(root, args = []) {
  return spawnSync(process.execPath, [generator, ...args], {
    cwd: root,
    encoding: "utf8",
  });
}

async function outputs(root) {
  const directory = join(root, "src/generated");
  const result = {};
  for (const file of await readdir(directory)) {
    result[file] = await readFile(join(directory, file), "utf8");
  }
  return result;
}

async function watch(t, root) {
  const child = spawn(process.execPath, [generator, "--watch"], { cwd: root });
  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (chunk) => {
    stdout += chunk;
  });
  child.stderr.on("data", (chunk) => {
    stderr += chunk;
  });
  t.after(async () => {
    if (child.exitCode === null && child.signalCode === null) {
      const closed = once(child, "close");
      child.kill("SIGTERM");
      await closed;
    }
  });

  async function waitFor(predicate) {
    const deadline = Date.now() + 10_000;
    while (!predicate()) {
      assert.equal(child.exitCode, null, stdout + stderr);
      assert.ok(Date.now() < deadline, stdout + stderr);
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
  }
  const count = () => stdout.split("Generated 3 GraphQL files").length - 1;
  await waitFor(() => stdout.includes("Watching GraphQL sources"));
  return { child, waitFor, count, stderr: () => stderr, stdout: () => stdout };
}

test("GraphQL generation reads source queries and excludes declarations and generated files", async (t) => {
  const root = await project(t);
  await writeFile(
    join(root, "src/ignored.d.ts"),
    "This is not valid TypeScript",
  );
  await mkdir(join(root, "src/generated"));
  await writeFile(
    join(root, "src/generated/graphql.ts"),
    "Previous generated output",
  );

  const result = generate(root);
  assert.equal(result.status, 0, result.stdout + result.stderr);

  const generated = await outputs(root);
  assert.deepEqual(Object.keys(generated).sort(), [
    "gql.ts",
    "graphql.ts",
    "index.ts",
  ]);
  assert.match(generated["graphql.ts"], /GreetingDocument/);
  assert.match(generated["graphql.ts"], /greeting: string/);
  assert.match(generated["gql.ts"], /query Greeting \{ greeting \}/);
});

test("an invalid GraphQL query preserves every previously generated file", async (t) => {
  const root = await project(t);
  assert.equal(generate(root).status, 0);
  const previous = await outputs(root);
  await writeFile(
    join(root, "src/greeting.ts"),
    "graphql(`query Greeting { missing }`);",
  );

  const result = generate(root);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Cannot query field "missing"/);
  assert.deepEqual(await outputs(root), previous);
});

test("a missing GraphQL schema fails explicitly", async (t) => {
  const root = await project(t);
  await rm(join(root, "schema.graphql"));
  const missingSchema = generate(root);
  assert.notEqual(missingSchema.status, 0);
  assert.match(missingSchema.stderr, /No GraphQL schema files/);
});

test("a project without GraphQL queries fails explicitly", async (t) => {
  const root = await project(t);
  await rm(join(root, "src/greeting.ts"));
  const missingQuery = generate(root);
  assert.notEqual(missingQuery.status, 0);
  assert.match(missingQuery.stderr, /No GraphQL documents/);
});

test("an unsupported generation argument fails explicitly", async (t) => {
  const root = await project(t);
  const invalidArgument = generate(root, ["--unsupported"]);
  assert.notEqual(invalidArgument.status, 0);
  assert.match(invalidArgument.stderr, /Usage:/);
});

test("GraphQL watch adds and removes queries and reloads schema and configuration", async (t) => {
  const root = await project(t);
  const watching = await watch(t, root);
  assert.equal(watching.count(), 1);

  await writeFile(
    join(root, "src/another.tsx"),
    "graphql(`query AnotherGreeting { greeting }`);",
  );
  await watching.waitFor(() => watching.count() === 2);
  assert.match((await outputs(root))["graphql.ts"], /AnotherGreetingDocument/);

  await rm(join(root, "src/another.tsx"));
  await watching.waitFor(() => watching.count() === 3);
  assert.doesNotMatch(
    (await outputs(root))["graphql.ts"],
    /AnotherGreetingDocument/,
  );

  await writeFile(
    join(root, "schema.graphql"),
    "type Query { greeting: Int! }",
  );
  await watching.waitFor(() => watching.count() === 4);
  assert.match((await outputs(root))["graphql.ts"], /greeting: number/);

  await writeFile(
    join(root, "graphql.config.yml"),
    config.replace(
      "fragmentMasking: false",
      "fragmentMasking: false\n      gqlTagName: gql",
    ),
  );
  await watching.waitFor(() => watching.count() === 5);
  assert.match((await outputs(root))["gql.ts"], /export function gql\(/);

  const closed = once(watching.child, "close");
  watching.child.kill("SIGTERM");
  const [code, signal] = await closed;
  assert.equal(code, 0);
  assert.equal(signal, null);
  assert.match(watching.stdout(), /Stopped GraphQL watch/);
});

test("GraphQL watch preserves valid files after an error and recovers on the next edit", async (t) => {
  const root = await project(t);
  const watching = await watch(t, root);
  const previous = await outputs(root);

  await writeFile(
    join(root, "src/greeting.ts"),
    "graphql(`query Greeting { missing }`);",
  );
  await watching.waitFor(() =>
    watching.stderr().includes('Cannot query field "missing"'),
  );
  assert.equal(watching.count(), 1);
  assert.deepEqual(await outputs(root), previous);

  await writeFile(join(root, "src/greeting.ts"), query);
  await watching.waitFor(() => watching.count() === 2);
  assert.deepEqual(await outputs(root), previous);
});

test("GraphQL watch preserves valid files after invalid configuration and recovers when fixed", async (t) => {
  const root = await project(t);
  const watching = await watch(t, root);
  const previous = await outputs(root);

  await writeFile(
    join(root, "graphql.config.yml"),
    "schema: null\ndocuments: []\n",
  );
  await watching.waitFor(() =>
    watching.stderr().includes("must be arrays of local file patterns"),
  );
  assert.equal(watching.count(), 1);
  assert.deepEqual(await outputs(root), previous);

  await writeFile(join(root, "graphql.config.yml"), config);
  await watching.waitFor(() => watching.count() === 2);
  assert.deepEqual(await outputs(root), previous);
});
