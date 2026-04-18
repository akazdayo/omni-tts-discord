import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags, EmbedBuilder } from "discord.js";
import { connections } from "./join";

export const data = new SlashCommandBuilder()
  .setName('leave')
  .setDescription('りーぶ');

export async function execute(interaction: ChatInputCommandInteraction) {
  const guildId = interaction.guildId
  if (!guildId) {
    await interaction.reply({ content: 'サーバー内で実行して欲しいかも', flags: MessageFlags.Ephemeral })
    return;
  }

  const current = connections[guildId]
  if (!current) {
    await interaction.reply({ content: '今はVCに参加していないかも', flags: MessageFlags.Ephemeral })
    return;
  }

  current.connection.destroy()
  delete connections[guildId];

  const leaveEmbed = new EmbedBuilder()
    .setColor(0x66ffd4)
    .setTitle('りーぶ、できたよ！')
    .setDescription('VCから抜けたよ、また呼んでね♡')

  await interaction.reply({ embeds: [leaveEmbed] })
}
