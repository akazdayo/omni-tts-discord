import { Client, Events, GatewayIntentBits, Interaction, Message, VoiceState } from 'discord.js';
import { commands } from './commands/commands.js';
import { connections, removeConnections } from './commands/join.js';
import { createAudioResource } from '@discordjs/voice';
import { generateVoice } from './lib/generate.js';
import { conversionMessage } from './lib/conversionMessage.js';
import { leaveWhenEmpty } from './lib/leaveWhenEmpty.js';


const client = new Client({ intents: [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.GuildVoiceStates,
  GatewayIntentBits.MessageContent
]});

client.once(Events.ClientReady, () => console.log('Ready!'));

client.on(Events.InteractionCreate, async (interaction: Interaction) => {
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
  const voice = await generateVoice(messageText, '874568803256786945');
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

client.login(process.env.DISCORD_TOKEN);
