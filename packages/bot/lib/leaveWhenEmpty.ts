import type { VoiceState } from "discord.js";
import { getVoiceConnection } from "@discordjs/voice";
import { removeConnections } from "../commands/join.js";

export function leaveWhenEmpty(oldState: VoiceState) {
  const channel = oldState.channel;
  if (!channel) return;

  const connection = getVoiceConnection(channel.guild.id);
  if (!connection) return;

  const botChannelId = channel.guild.members.me?.voice.channelId;
  if (!botChannelId && botChannelId !== channel.id) return;

  const humanCount = channel.members.filter((member) => !member.user.bot).size;
  if (humanCount > 0) return;

  connection.destroy();
  removeConnections(channel.guild.id);
}
