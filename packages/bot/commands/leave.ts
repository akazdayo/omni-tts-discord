import type { ChatInputCommandInteraction } from "discord.js";
import { SlashCommandBuilder, MessageFlags, EmbedBuilder } from "discord.js";
import { connections, removeConnections } from "./join";

export const data = new SlashCommandBuilder().setName("leave").setDescription("りーぶ");

export const execute = async (interaction: ChatInputCommandInteraction): Promise<void> => {
  const { guildId } = interaction;
  if (!guildId) {
    await interaction.reply({
      content: "サーバー内で実行して欲しいかも",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const current = connections.get(guildId);
  if (!current) {
    await interaction.reply({
      content: "今はVCに参加していないかも",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  current.connection.destroy();
  removeConnections(guildId);

  const leaveEmbed = new EmbedBuilder()
    .setColor(0x66ffd4)
    .setTitle("りーぶ、できたよ！")
    .setDescription("VCから抜けたよ、また呼んでね♡");

  await interaction.reply({ embeds: [leaveEmbed] });
};
