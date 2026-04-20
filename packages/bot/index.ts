import type { Interaction, Message, VoiceState } from "discord.js";
import { Client, Events, GatewayIntentBits } from "discord.js";
import { commandList, commands } from "./commands/commands.js";
import { connections, removeConnections } from "./commands/join.js";
import { handleSpeakerSelect, selectedSpeakers } from "./commands/speaker.js";
import { enqueueSpeech } from "./lib/playback-queue.js";
import { leaveWhenEmpty } from "./lib/leave-when-empty.js";

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

client.on(Events.MessageCreate, (message: Message) => {
  if (message.author.bot) {
    return;
  }
  const voiceChannel = [...connections.values()].find(
    (vc) => vc.targetChannel === message.channelId,
  );
  if (!voiceChannel || !message.guildId) {
    return;
  }

  enqueueSpeech(voiceChannel.player, voiceChannel.queue, {
    content: message.content,
    speaker: selectedSpeakers[message.author.id] ?? "874568803256786945",
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
