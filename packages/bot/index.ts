import { Client, Events, GatewayIntentBits, Interaction, Message, REST, Routes, VoiceState } from 'discord.js';
import { commandList, commands } from './commands/commands.js';
import { connections, removeConnections } from './commands/join.js';
import { handleSpeakerSelect, selectedSpeakers } from './commands/speaker.js';
import { createAudioResource } from '@discordjs/voice';
import { generateVoice } from './lib/generate.js';
import { conversionMessage } from './lib/conversionMessage.js';
import { leaveWhenEmpty } from './lib/leaveWhenEmpty.js';

async function registerCommands() {
  const token = process.env.DISCORD_TOKEN;
  const clientId = process.env.DISCORD_CLIENT_ID;

  if (!token || !clientId) {
    throw new Error('DISCORD_TOKEN and DISCORD_CLIENT_ID are required');
  }

  const rest = new REST({ version: '10' }).setToken(token);
  await rest.put(
    Routes.applicationCommands(clientId),
    { body: [...commands.values()].map((command) => command.data.toJSON()) }
  );
  console.log(`Registered ${commands.size} global commands`);
}


const client = new Client({ intents: [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.GuildVoiceStates,
  GatewayIntentBits.MessageContent
]});

client.once(Events.ClientReady, async (readyClient) => {
  await readyClient.application.commands.set(
    commandList.map((command) => command.data.toJSON())
  );
  console.log('Ready!');
});

client.on(Events.InteractionCreate, async (interaction: Interaction) => {
  if (interaction.isStringSelectMenu() && interaction.customId === 'speakers') {
    await handleSpeakerSelect(interaction);
    return;
  }

  if (!interaction.isChatInputCommand()) return;
  const command = commands.get(interaction.commandName);
  if (!command) return;
  try {
    await command.execute(interaction);
  } catch (e) {
    await interaction.reply({ content: 'Error', ephemeral: true });
  }
});

client.on(Events.MessageCreate, async (message: Message) => {
  if (message.author.bot) return;
  const voiceChannel = Object.values(connections).find(
    (vc) => vc.targetChannel === message.channelId
  )
  if (!voiceChannel) return;

  const { player } = voiceChannel
  const messageText = await conversionMessage(message.content);
  const speaker = selectedSpeakers[message.author.id] ?? '874568803256786945';
  const voice = await generateVoice(messageText, speaker);
  if (!voice) return;
  const audioResouce = createAudioResource(voice);
  player.play(audioResouce)
});

client.on(Events.VoiceStateUpdate, async (oldState: VoiceState, newState: VoiceState) => {
  if (oldState.channelId === newState.channelId) return;

  const guildId = newState.guild.id;
  const botId = newState.client.user.id;
  const connectionEntry = connections[guildId];

  if (newState.id === botId) {
    if (!connectionEntry) return;
    if (newState.channelId) {
      connectionEntry.voiceChannel = newState.channelId;
      return;
    }
    connectionEntry.connection.destroy();
    removeConnections(guildId);
    return;
  }

  leaveWhenEmpty(oldState)
});

async function main() {
  await registerCommands();
  await client.login(process.env.DISCORD_TOKEN);
}

void main().catch((error) => {
  console.error('Failed to start bot', error);
  process.exit(1);
});
