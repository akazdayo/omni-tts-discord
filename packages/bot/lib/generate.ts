import { Readable } from "node:stream";

export async function generateVoice(text: string, speaker: string): Promise<Readable> {
  const res = await fetch("http://localhost:8000/generate", {
    body: JSON.stringify({ speaker, text }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });

  if (!res.ok || !res.body) {
    throw new Error(`generate failed: ${res.status} ${res.statusText}`);
  }

  return Readable.fromWeb(res.body as import("node:stream/web").ReadableStream);
}
