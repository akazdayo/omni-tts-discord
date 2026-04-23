import { AudioPlayerStatus, createAudioResource } from "@discordjs/voice";
import type { AudioPlayer } from "@discordjs/voice";
import { connections, onConnectionRemoved } from "../commands/join.js";
import { generateVoice } from "./generate.js";
import { BotMessageQueue } from "./message-queue.js";
import type { QueueCommand, QueueItem } from "./message-queue.js";

const queueByGuild = new Map<string, BotMessageQueue>();
const registeredPlayers = new WeakSet<AudioPlayer>();

onConnectionRemoved((guildId) => {
  queueByGuild.delete(guildId);
});

const getQueue = (guildId: string): BotMessageQueue => {
  const existingQueue = queueByGuild.get(guildId);
  if (existingQueue) {
    return existingQueue;
  }

  const queue = new BotMessageQueue();
  queueByGuild.set(guildId, queue);
  return queue;
};

const runQueueCommands = async (
  guildId: string,
  queue: BotMessageQueue,
  commands: readonly QueueCommand[],
): Promise<void> => {
  for (const command of commands) {
    if (queueByGuild.get(guildId) !== queue) {
      return;
    }

    const currentConnection = connections.get(guildId);
    if (!currentConnection) {
      return;
    }

    if (command.type === "start") {
      const { item } = command;

      try {
        const voice = await generateVoice(item.text, item.speaker);
        if (queueByGuild.get(guildId) !== queue || queue.currentItemId() !== item.id) {
          return;
        }
        const latestConnection = connections.get(guildId);
        if (!latestConnection) {
          return;
        }
        latestConnection.player.play(createAudioResource(voice));
      } catch (error) {
        console.error(error);
        if (queueByGuild.get(guildId) !== queue) {
          return;
        }
        await runQueueCommands(guildId, queue, queue.currentFinished(item.id));
      }
      continue;
    }

    currentConnection.player.stop();
  }
};

export const registerVoiceQueuePlayer = (guildId: string): void => {
  const currentConnection = connections.get(guildId);
  if (!currentConnection || registeredPlayers.has(currentConnection.player)) {
    return;
  }

  const queue = getQueue(guildId);
  registeredPlayers.add(currentConnection.player);
  currentConnection.player.on(AudioPlayerStatus.Idle, () => {
    const currentId = queue.currentItemId();
    if (currentId === undefined) {
      return;
    }
    void runQueueCommands(guildId, queue, queue.currentFinished(currentId));
  });
};

export const enqueueVoiceMessage = async (item: QueueItem & { guildId: string }): Promise<void> => {
  const { guildId, ...queueItem } = item;
  const queue = getQueue(guildId);
  await runQueueCommands(guildId, queue, queue.enqueue(queueItem));
};
