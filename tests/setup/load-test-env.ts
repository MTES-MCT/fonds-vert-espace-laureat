import { loadEnvConfig } from "@next/env";

const silentLog = {
  info() {},
  error(...args: unknown[]) {
    console.error(...args);
  },
};

export function loadTestEnv() {
  const originalNodeEnv = process.env["NODE_ENV"];

  Object.assign(process.env, { NODE_ENV: "test" });
  loadEnvConfig(process.cwd(), false, silentLog, true);

  if (originalNodeEnv === undefined) {
    Reflect.deleteProperty(process.env, "NODE_ENV");
    return;
  }

  Object.assign(process.env, { NODE_ENV: originalNodeEnv });
}
