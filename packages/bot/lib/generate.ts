import { Readable } from "node:stream";
import type { ReadableStream } from "node:stream/web";
import { err, ok } from "neverthrow";
import type { Result } from "neverthrow";

export type GenerateError =
  | { reason: "speaker_not_found"; speaker: string }
  | { reason: "generate_failed"; status: number; statusText: string };

export const generateVoice = async (
  text: string,
  speaker: string,
): Promise<Result<Readable, GenerateError>> => {
  try {
    const res = await fetch("http://localhost:8000/generate", {
      body: JSON.stringify({ speaker, text }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    if (res.status === 404) {
      return err({ reason: "speaker_not_found", speaker });
    }

    if (!res.ok || !res.body) {
      return err({
        reason: "generate_failed",
        status: res.status,
        statusText: res.statusText,
      });
    }

    return ok(Readable.fromWeb(res.body as ReadableStream));
  } catch (error) {
    return err({
      reason: "generate_failed",
      status: 0,
      statusText: error instanceof Error ? error.message : String(error),
    });
  }
};
