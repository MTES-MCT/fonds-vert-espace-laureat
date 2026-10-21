import { glob, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, matchesGlob, relative, resolve } from "node:path";

import { preset } from "@graphql-codegen/client-preset";
import { codegen } from "@graphql-codegen/core";
import { gqlPluckFromCodeString } from "@graphql-tools/graphql-tag-pluck";
import {
  buildSchema,
  lexicographicSortSchema,
  parse,
  printSchema,
} from "graphql";
import { parse as parseYaml } from "yaml";

const root = process.cwd();
const configFile = "graphql.config.yml";

async function loadConfig() {
  const config = parseYaml(await readFile(resolve(root, configFile), "utf8"));
  if (
    !Array.isArray(config?.schema) ||
    !Array.isArray(config?.documents) ||
    [...config.schema, ...config.documents].some(
      (entry) => typeof entry !== "string",
    )
  ) {
    throw new Error(
      "GraphQL schema and documents must be arrays of local file patterns.",
    );
  }
  return config;
}

function patterns(entries) {
  return {
    include: entries.filter((entry) => !entry.startsWith("!")),
    exclude: entries
      .filter((entry) => entry.startsWith("!"))
      .map((entry) => entry.slice(1)),
  };
}

async function files(entries) {
  const { include, exclude } = patterns(entries);
  return (await Array.fromAsync(glob(include, { cwd: root, exclude }))).sort();
}

async function generate(config) {
  const schemaFiles = await files(config.schema);
  if (schemaFiles.length === 0)
    throw new Error("No GraphQL schema files found.");
  const schema = lexicographicSortSchema(
    buildSchema(
      (
        await Promise.all(
          schemaFiles.map((file) => readFile(resolve(root, file), "utf8")),
        )
      ).join("\n"),
    ),
  );
  const documents = [];
  for (const file of await files(config.documents)) {
    const location = resolve(root, file);
    const sources = await gqlPluckFromCodeString(
      location,
      await readFile(location, "utf8"),
      { skipIndent: true },
    );
    for (const source of sources) {
      documents.push({
        location,
        document: parse(source),
        rawSDL: source.body,
      });
    }
  }
  if (documents.length === 0) throw new Error("No GraphQL documents found.");

  const outputs = [];
  for (const [baseOutputDir, output] of Object.entries(config.generates)) {
    if (output.preset !== "client" || output.plugins.length !== 0) {
      throw new Error(
        "GraphQL generation supports the client preset without extra plugins.",
      );
    }
    const sections = await preset.buildGeneratesSection({
      baseOutputDir,
      schema: parse(printSchema(schema)),
      schemaAst: schema,
      documents,
      config: output.config ?? {},
      presetConfig: output.presetConfig,
      plugins: [],
      pluginMap: {},
    });
    for (const section of sections) {
      outputs.push({
        filename: resolve(root, section.filename),
        content: await codegen(section),
      });
    }
  }

  // Validate every output before replacing any previously generated file.
  for (const { filename, content } of outputs) {
    const previous = await readFile(filename, "utf8").catch((error) => {
      if (error.code !== "ENOENT") throw error;
      return null;
    });
    if (previous === content) continue;
    await mkdir(dirname(filename), { recursive: true });
    await writeFile(filename, content);
  }
  console.log(
    `Generated ${outputs.length} GraphQL files from ${documents.length} documents.`,
  );
}

async function watch() {
  const { default: watcher } = await import("@parcel/watcher");
  let config = await loadConfig();
  let pending = Promise.resolve();
  let timer;
  let stopped = false;

  function enqueue() {
    pending = pending.then(async () => {
      try {
        config = await loadConfig();
        await generate(config);
      } catch (error) {
        console.error(error);
      }
    });
  }

  function isInput(path) {
    const file = relative(root, path).replaceAll("\\", "/");
    if (file === configFile) return true;
    const { include, exclude } = patterns([
      ...config.schema,
      ...config.documents,
    ]);
    return (
      include.some((pattern) => matchesGlob(file, pattern)) &&
      !exclude.some((pattern) => matchesGlob(file, pattern))
    );
  }

  const subscription = await watcher.subscribe(
    root,
    (error, events) => {
      if (error) {
        console.error(error);
        return;
      }
      if (!stopped && events.some((event) => isInput(event.path))) {
        clearTimeout(timer);
        timer = setTimeout(enqueue, 100);
      }
    },
    { ignore: ["node_modules", ".git", ".next", ".next-test"] },
  );

  async function stop() {
    stopped = true;
    clearTimeout(timer);
    await subscription.unsubscribe();
    await pending;
    console.log("Stopped GraphQL watch.");
  }
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
  enqueue();
  await pending;
  console.log("Watching GraphQL sources and configuration.");
}

try {
  const args = process.argv.slice(2);
  if (args.some((arg) => arg !== "--watch"))
    throw new Error("Usage: node scripts/codegen.mjs [--watch]");
  if (args.includes("--watch")) await watch();
  else await generate(await loadConfig());
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
