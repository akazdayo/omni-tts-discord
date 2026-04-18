import type { ChatInputCommandInteraction, Client, StringSelectMenuInteraction } from "discord.js";
import {
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder,
} from "discord.js";
import { getSpeakers } from "../lib/get-speakers.js";

type SelectedSpeakers = Record<string, string>;

export const data = new SlashCommandBuilder()
  .setName("speaker")
  .setDescription("Speakerを変更できるよ");

export const selectedSpeakers: SelectedSpeakers = {};

const buildButtons = async (speakers: string[], client: Client) => {
  const options = await Promise.all(
    speakers.map(async (userId) => {
      const user = await client.users.fetch(userId);
      return new StringSelectMenuOptionBuilder().setLabel(user.username).setValue(userId);
    }),
  );

  const speakerSelectMenu = new StringSelectMenuBuilder()
    .setCustomId("speakers")
    .setPlaceholder("Select a speaker")
    .addOptions(options);

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(speakerSelectMenu);
  return row;
};

export const execute = async (interaction: ChatInputCommandInteraction): Promise<void> => {
  const speakers = await getSpeakers();
  const buttons = await buildButtons(speakers, interaction.client);
  await interaction.reply({ components: [buttons] });
};

export const handleSpeakerSelect = async (
  interaction: StringSelectMenuInteraction,
): Promise<void> => {
  const [speakerId] = interaction.values;
  if (speakerId) {
    selectedSpeakers[interaction.user.id] = speakerId;
  }

  await interaction.deferUpdate();
};
