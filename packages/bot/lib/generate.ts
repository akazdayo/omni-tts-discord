import { Readable } from "node:stream";
import type { ReadableStream } from "node:stream/web";

export const generateVoice = async (text: string, speaker: string): Promise<Readable> => {
  const res = await fetch("http://localhost:8000/generate", {
    body: JSON.stringify({ speaker, text }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });

  if (!res.ok || !res.body) {
    throw new Error(`generate failed: ${res.status} ${res.statusText}`);
  }

  return Readable.fromWeb(res.body as ReadableStream);
};
