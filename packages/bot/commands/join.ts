import type { ChatInputCommandInteraction, GuildMember } from "discord.js";
import { MessageFlags, SlashCommandBuilder } from "discord.js";
import type { AudioPlayer, VoiceConnection } from "@discordjs/voice";
import { createAudioPlayer, joinVoiceChannel } from "@discordjs/voice";

export interface VoiceChannels {
  connection: VoiceConnection;
  player: AudioPlayer;
  targetChannel: string;
  voiceChannel: string;
}
export const connections = new Map<string, VoiceChannels>();

const connectionRemoveListeners = new Set<(guildId: string) => void>();

export const onConnectionRemoved = (listener: (guildId: string) => void): void => {
  connectionRemoveListeners.add(listener);
};

export const removeConnections = (guildId: string): void => {
  const deleted = connections.delete(guildId);
  if (!deleted) {
    return;
  }

  for (const listener of connectionRemoveListeners) {
    listener(guildId);
  }
};

export const data = new SlashCommandBuilder().setName("join").setDescription("じょいん");

export const execute = async (interaction: ChatInputCommandInteraction): Promise<void> => {
  const member = interaction.member as GuildMember;
  const vc = member.voice.channel;
  const currentConnection = connections.get(vc?.guild.id ?? "");

  if (!vc) {
    await interaction.reply({ content: "先にVC入ってわよ", flags: MessageFlags.Ephemeral });
    return;
  } else if (!vc.joinable) {
    await interaction.reply({ content: "vc入れないかも", flags: MessageFlags.Ephemeral });
    return;
  } else if (!interaction.channel?.isSendable()) {
    await interaction.reply({
      content: "私テキストの送信権限なさそうかも",
      flags: MessageFlags.Ephemeral,
    });
    return;
  } else if (currentConnection?.voiceChannel === vc.id) {
    await interaction.reply({
      content: "もうこのVCに参加してるかも",
      flags: MessageFlags.Ephemeral,
    });
    return;
  } else if (currentConnection) {
    await interaction.reply({
      content: `もう<#${currentConnection.voiceChannel}>に参加してるかも`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }
  const connection = joinVoiceChannel({
    adapterCreator: vc.guild.voiceAdapterCreator,
    channelId: vc.id,
    guildId: vc.guild.id,
  });
  const textChannel = interaction.channel?.id;
  const player = createAudioPlayer();

  if (!connection?.subscribe(player)) {
    await interaction.reply({ content: "発言権限ないかも", flags: MessageFlags.Ephemeral });
    return;
  }
  connections.set(vc.guild.id, {
    connection,
    player,
    targetChannel: textChannel,
    voiceChannel: vc.id,
  });
  await interaction.reply({ content: "全部成功したらしい", flags: MessageFlags.Ephemeral });
};
