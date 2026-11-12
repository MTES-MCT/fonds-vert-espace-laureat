import { NextResponse } from "next/server";

import {
  admitDemoWrite,
  DEMO_WRITE_INTERVAL_SECONDS,
} from "@/db/publicDemoWrites";

const MAX_BODY_BYTES = 1_024;

export async function readDemoJson(request: Request): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Corps de requête manquant");
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let text = "";
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES)
        throw new Error("Corps de requête trop volumineux");
      text += decoder.decode(value, { stream: true });
    }
    return JSON.parse(text + decoder.decode());
  } finally {
    void reader.cancel().catch(() => undefined);
  }
}

export async function demoWriteRefusal() {
  if (!(await admitDemoWrite())) {
    return NextResponse.json(
      { error: "Réessayez dans quelques secondes." },
      {
        status: 429,
        headers: { "Retry-After": String(DEMO_WRITE_INTERVAL_SECONDS) },
      },
    );
  }
}
