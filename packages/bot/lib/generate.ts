import { Readable } from "node:stream";

export async function generateVoice(text: string, speaker: string): Promise<Readable> {
  const res = await fetch("http://localhost:8000/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, speaker }),
  });

  if (!res.ok || !res.body) {
    throw new Error(`generate failed: ${res.status} ${res.statusText}`);
  }

  return Readable.fromWeb(res.body as import("node:stream/web").ReadableStream);
}
