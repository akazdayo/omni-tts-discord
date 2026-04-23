import type { Interaction, Message, VoiceState } from "discord.js";
import { Client, Events, GatewayIntentBits } from "discord.js";
import { commandList, commands } from "./commands/commands.js";
import { connections, onConnectionRemoved, removeConnections } from "./commands/join.js";
import { handleSpeakerSelect, selectedSpeakers } from "./commands/speaker.js";
import { AudioPlayerStatus, createAudioResource } from "@discordjs/voice";
import { generateVoice } from "./lib/generate.js";
import { conversionMessage } from "./lib/conversion-message.js";
import { leaveWhenEmpty } from "./lib/leave-when-empty.js";
import * as messageQueue from "../message_queue/build/dev/javascript/message_queue/message_queue.mjs";

interface QueueItem {
  id: string;
  text: string;
  speaker: string;
}

interface QueueState {
  current?: QueueItem;
}

interface QueueCommand {
  item?: QueueItem;
}

const queueStates = new Map<string, QueueState>();
const registeredPlayers = new WeakSet<object>();

onConnectionRemoved((guildId) => {
  queueStates.delete(guildId);
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
  ],
});

const applyQueueTransition = (
  guildId: string,
  transition: (state: QueueState) => [QueueState, Iterable<QueueCommand>],
) => {
  const state = queueStates.get(guildId) ?? messageQueue.new$();
  const [nextState, commandsToRun] = transition(state);
  queueStates.set(guildId, nextState);
  return commandsToRun;
};

const runQueueCommands = async (guildId: string, commandsToRun: Iterable<QueueCommand>) => {
  for (const command of commandsToRun) {
    const currentConnection = connections.get(guildId);
    if (!currentConnection) {
      return;
    }

    if (messageQueue.Command$isStart(command)) {
      const { item } = command;
      if (!item) {
        continue;
      }

      try {
        const voice = await generateVoice(item.text, item.speaker);
        if (queueStates.get(guildId)?.current?.id !== item.id) {
          return;
        }
        currentConnection.player.play(createAudioResource(voice));
      } catch (error) {
        console.error(error);
        const nextCommands = applyQueueTransition(guildId, (state) =>
          messageQueue.current_finished(state, item.id),
        );
        await runQueueCommands(guildId, nextCommands);
      }
      continue;
    }

    if (messageQueue.Command$isStop(command)) {
      currentConnection.player.stop();
    }
  }
};

const runQueueTransition = async (
  guildId: string,
  transition: (state: QueueState) => [QueueState, Iterable<QueueCommand>],
) => {
  const commandsToRun = applyQueueTransition(guildId, transition);
  await runQueueCommands(guildId, commandsToRun);
};

const registerPlayerIdle = (guildId: string) => {
  const currentConnection = connections.get(guildId);
  if (!currentConnection || registeredPlayers.has(currentConnection.player)) {
    return;
  }

  registeredPlayers.add(currentConnection.player);
  currentConnection.player.on(AudioPlayerStatus.Idle, () => {
    const currentId = queueStates.get(guildId)?.current?.id;
    if (!currentId) {
      return;
    }
    void runQueueTransition(guildId, (state) => messageQueue.current_finished(state, currentId));
  });
};

client.once(Events.ClientReady, async (readyClient) => {
  await readyClient.application.commands.set(commandList.map((command) => command.data.toJSON()));
  console.log("Ready!");
});

client.on(Events.InteractionCreate, async (interaction: Interaction) => {
  if (interaction.isStringSelectMenu() && interaction.customId === "speakers") {
    await handleSpeakerSelect(interaction);
    return;
  }

  if (!interaction.isChatInputCommand()) {
    return;
  }
  const command = commands.get(interaction.commandName);
  if (!command) {
    return;
  }
  try {
    await command.execute(interaction);
  } catch {
    await interaction.reply({ content: "Error", ephemeral: true });
  }
});

client.on(Events.MessageCreate, async (message: Message) => {
  if (message.author.bot) {
    return;
  }
  const voiceChannel = [...connections.values()].find(
    (vc) => vc.targetChannel === message.channelId,
  );
  if (!voiceChannel) {
    return;
  }
  if (!message.guildId) {
    return;
  }

  registerPlayerIdle(message.guildId);
  const messageText = await conversionMessage(message.content);
  const speaker = selectedSpeakers[message.author.id] ?? "874568803256786945";
  const item = messageQueue.new_item(message.id, messageText, speaker);

  void runQueueTransition(message.guildId, (state) => messageQueue.enqueue(state, item));
});

client.on(Events.VoiceStateUpdate, (oldState: VoiceState, newState: VoiceState) => {
  if (oldState.channelId === newState.channelId) {
    return;
  }

  const guildId = newState.guild.id;
  const botId = newState.client.user.id;
  const connectionEntry = connections.get(guildId);

  if (newState.id === botId) {
    if (!connectionEntry) {
      return;
    }
    if (newState.channelId) {
      connectionEntry.voiceChannel = newState.channelId;
      return;
    }
    connectionEntry.connection.destroy();
    removeConnections(guildId);
    return;
  }

  leaveWhenEmpty(oldState);
});

client.login(process.env.DISCORD_TOKEN);
