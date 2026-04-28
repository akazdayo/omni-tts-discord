import { getSpeakerPreference } from "./db/speaker-preferences.js";
import type { Interaction, Message, VoiceState } from "discord.js";
import { Client, Events, GatewayIntentBits } from "discord.js";
import { commandList, commands } from "./commands/commands.js";
import { connections, removeConnections } from "./commands/join.js";
import { handleSpeakerSelect } from "./commands/speaker.js";
import { conversionMessage } from "./lib/message-proxy.js";
import { leaveWhenEmpty } from "./lib/leave-when-empty.js";
import { enqueueVoiceMessage, registerVoiceQueuePlayer } from "./lib/voice-queue.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
  ],
});

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

  registerVoiceQueuePlayer(message.guildId);
  const messageText = await conversionMessage(message.content);
  const speaker = await getSpeakerPreference(message.author.id);

  void enqueueVoiceMessage({
    guildId: message.guildId,
    id: message.id,
    speaker,
    text: messageText,
    userId: message.author.id,
  });
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
