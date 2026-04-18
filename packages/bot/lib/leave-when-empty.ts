import type { VoiceState } from "discord.js";
import { getVoiceConnection } from "@discordjs/voice";
import { removeConnections } from "../commands/join.js";

export const leaveWhenEmpty = (oldState: VoiceState): void => {
  const { channel } = oldState;
  if (!channel) {
    return;
  }

  const connection = getVoiceConnection(channel.guild.id);
  if (!connection) {
    return;
  }

  const botChannelId = channel.guild.members.me?.voice.channelId;
  if (botChannelId !== channel.id) {
    return;
  }

  const humanCount = channel.members.filter((member) => !member.user.bot).size;
  if (humanCount > 0) {
    return;
  }

  connection.destroy();
  removeConnections(channel.guild.id);
};
