import { ChatInputCommandInteraction, GuildMember, MessageFlags, SlashCommandBuilder } from 'discord.js';
import { AudioPlayer, createAudioPlayer, joinVoiceChannel, VoiceConnection } from '@discordjs/voice';

export interface VoiceChannels {
  connection: VoiceConnection
  player: AudioPlayer
  targetChannel: string
}
export const connections: VoiceChannels[] = [];

export const data = new SlashCommandBuilder()
  .setName('join')
  .setDescription('じょいん');

export async function execute(interaction: ChatInputCommandInteraction) {
  const member = interaction.member as GuildMember;
  const vc = member.voice.channel;
  if (!vc){
    await interaction.reply({content: '先にVC入ってわよ', flags: MessageFlags.Ephemeral})
    return;
  } else if (!vc.joinable) {
    await interaction.reply({content: 'vc入れないかも', flags: MessageFlags.Ephemeral})
    return;
  } else if (!interaction.channel?.isSendable){
    await interaction.reply({content: '私テキストの送信権限なさそうかも', flags: MessageFlags.Ephemeral})
    return;
  }
  const connection = joinVoiceChannel({
    channelId: vc.id,
    guildId: vc.guild.id,
    adapterCreator: vc.guild.voiceAdapterCreator,
  });
  const textChannel = interaction.channel?.id;
  const player = createAudioPlayer();

  if (!connection?.subscribe(player)){
    await interaction.reply({content: '発言権限ないかも', flags: MessageFlags.Ephemeral})
    return;
  }

  connections.push({connection: connection, player: player, targetChannel: textChannel});
  await interaction.reply({content: '全部成功したらしい', flags: MessageFlags.Ephemeral})
}
