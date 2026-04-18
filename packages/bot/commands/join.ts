import { ChatInputCommandInteraction, GuildMember, MessageFlags, SlashCommandBuilder } from 'discord.js';
import { AudioPlayer, createAudioPlayer, joinVoiceChannel, VoiceConnection } from '@discordjs/voice';

export interface VoiceChannels {
  connection: VoiceConnection
  player: AudioPlayer
  targetChannel: string
  voiceChannel: string
}
export const connections: Record<string, VoiceChannels> = {};

export const data = new SlashCommandBuilder()
  .setName('join')
  .setDescription('じょいん');

export async function execute(interaction: ChatInputCommandInteraction) {
  const member = interaction.member as GuildMember;
  const vc = member.voice.channel;
  if (!vc) {
    await interaction.reply({ content: '先にVC入ってわよ', flags: MessageFlags.Ephemeral })
    return;
  } else if (!vc.joinable) {
    await interaction.reply({ content: 'vc入れないかも', flags: MessageFlags.Ephemeral })
    return;
  } else if (!interaction.channel?.isSendable()) {
    await interaction.reply({ content: '私テキストの送信権限なさそうかも', flags: MessageFlags.Ephemeral })
    return;
  } else if (connections[vc.guild.id].voiceChannel === vc.id) {
    await interaction.reply({ content: `もう<#${vc.guild.id}>に参加してるかも？`, flags: MessageFlags.Ephemeral })
    return;
  } else if (connections[vc.guild.id]) {
    await interaction.reply({ content: 'もう別のVCに参加してるかも？', flags: MessageFlags.Ephemeral })
    return;
  }
  const connection = joinVoiceChannel({
    channelId: vc.id,
    guildId: vc.guild.id,
    adapterCreator: vc.guild.voiceAdapterCreator,
  });
  const textChannel = interaction.channel?.id;
  const player = createAudioPlayer();

  if (!connection?.subscribe(player)) {
    await interaction.reply({ content: '発言権限ないかも', flags: MessageFlags.Ephemeral })
    return;
  }
  connections[vc.guild.id] = { connection, player, targetChannel: textChannel, voiceChannel: vc.id }
  await interaction.reply({content: '全部成功したらしい', flags: MessageFlags.Ephemeral})
}
