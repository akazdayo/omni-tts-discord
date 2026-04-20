import { AudioPlayerStatus, createAudioResource } from "@discordjs/voice";
import type { AudioPlayer } from "@discordjs/voice";
import { once } from "node:events";
import { connections } from "../commands/join.js";
import { conversionMessage } from "./conversion-message.js";
import { generateVoice } from "./generate.js";

interface SpeakJob {
  content: string;
  speaker: string;
}

const waitForIdle = async (player: AudioPlayer): Promise<void> => {
  while (true) {
    const result = await Promise.race([
      once(player, "stateChange").then(([, newState]) => ({
        newState: newState as { status: AudioPlayerStatus },
        type: "state" as const,
      })),
      once(player, "error").then(([error]) => ({
        error,
        type: "error" as const,
      })),
    ]);

    if (result.type === "error") {
      throw result.error instanceof Error ? result.error : new Error(String(result.error));
    }

    if (result.newState.status === AudioPlayerStatus.Idle) {
      return;
    }
  }
};

const processQueue = async (guildId: string): Promise<void> => {
  const connection = connections.get(guildId);
  if (!connection || connection.processing) {
    return;
  }

  connection.processing = true;

  try {
    while (true) {
      const next = connection.queue.shift();
      if (!next) {
        break;
      }

      try {
        const text = await conversionMessage(next.content);
        const voice = await generateVoice(text, next.speaker);
        const resource = createAudioResource(voice);
        connection.player.play(resource);
        await waitForIdle(connection.player);
      } catch (error) {
        console.error("speech queue item failed", error);
      }

      if (!connections.has(guildId)) {
        break;
      }
    }
  } finally {
    const current = connections.get(guildId);
    if (current) {
      current.processing = false;
    }
  }
};

export const enqueueSpeech = (guildId: string, job: SpeakJob): void => {
  const connection = connections.get(guildId);
  if (!connection) {
    return;
  }

  connection.queue.push(job);
  void processQueue(guildId);
};
