import { Client, Events, GatewayIntentBits, Interaction, Message } from 'discord.js';
import { commands } from './commands/commands.js';
import { connections } from './commands/join.js';
import { createAudioResource } from '@discordjs/voice';
import { generateVoice } from './lib/generate.js';
import { conversionMessage } from './lib/conversionMessage.js';


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
  const messageText = await conversionMessage(message.content);
  if (connections.some(vc => vc.targetChannel !== message.channel.id)) return;
  const { player } = connections.find(vc => vc.targetChannel === message.channel.id)!;
  const voice = await generateVoice(messageText, '874568803256786945');
  if (!voice) return;
  const audioResouce = createAudioResource(voice);
  player.play(audioResouce)
});

client.login(process.env.DISCORD_TOKEN);
