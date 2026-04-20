import { AudioPlayerStatus, createAudioResource } from "@discordjs/voice";
import type { AudioPlayer } from "@discordjs/voice";
import { once } from "node:events";
import type { SpeechQueue } from "../commands/join.js";
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

export const drainSpeechQueue = async (player: AudioPlayer, queue: SpeechQueue): Promise<void> => {
  if (queue.running) {
    return;
  }

  queue.running = true;

  try {
    while (queue.items.length > 0) {
      const next = queue.items.shift();
      if (!next) {
        continue;
      }

      try {
        const text = await conversionMessage(next.content);
        const voice = await generateVoice(text, next.speaker);
        const resource = createAudioResource(voice);
        player.play(resource);
        await waitForIdle(player);
      } catch (error) {
        console.error("speech queue item failed", error);
      }
    }
  } finally {
    queue.running = false;
    if (queue.items.length > 0) {
      void drainSpeechQueue(player, queue);
    }
  }
};

export const enqueueSpeech = (player: AudioPlayer, queue: SpeechQueue, job: SpeakJob): void => {
  queue.items.push(job);
  void drainSpeechQueue(player, queue);
};
