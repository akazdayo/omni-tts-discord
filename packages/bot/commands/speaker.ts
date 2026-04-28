import {
  ActionRowBuilder,
  MessageFlags,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from "discord.js";
import type { ChatInputCommandInteraction, Client, StringSelectMenuInteraction } from "discord.js";
import { setSpeakerPreference } from "../db/speaker-preferences.js";
import { getSpeakers } from "../lib/get-speakers";

export const data = new SlashCommandBuilder()
  .setName("speaker")
  .setDescription("Speakerを変更できるよ");

const resolveSpeakerLabel = async (speakerId: string, client: Client) => {
  try {
    const user = await client.users.fetch(speakerId);
    return user.username;
  } catch {
    return speakerId;
  }
};

const buildButtons = async (speakers: string[], client: Client) => {
  const options = await Promise.all(
    speakers.map(async (speakerId) => {
      const label = await resolveSpeakerLabel(speakerId, client);
      return new StringSelectMenuOptionBuilder().setLabel(label).setValue(speakerId);
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
  await interaction.reply({ components: [buttons], flags: MessageFlags.Ephemeral });
};

export const handleSpeakerSelect = async (
  interaction: StringSelectMenuInteraction,
): Promise<void> => {
  const [speakerId] = interaction.values;
  if (speakerId) {
    await setSpeakerPreference(interaction.user.id, speakerId);
  }

  await interaction.deferUpdate();
};
