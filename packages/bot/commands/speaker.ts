import { ChatInputCommandInteraction, SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuInteraction, StringSelectMenuOptionBuilder, ActionRowBuilder } from 'discord.js';
import { getSpeakers } from '../lib/getSpeakers';

type SelectedSpeakers = Record<string, string>;

export const data = new SlashCommandBuilder()
  .setName('speaker')
  .setDescription('Speakerを変更できるよ');

export const selectedSpeakers: SelectedSpeakers = {};

const buildButtons = (speakers: string[]) => {
  const speakerSelectMenu = new StringSelectMenuBuilder()
  .setCustomId('speakers')
  .setPlaceholder('Select a speaker')
  .addOptions(
    speakers.map(userId =>
      new StringSelectMenuOptionBuilder()
        .setLabel(`<@${userId}>`)
        .setValue(userId)
    )
  );

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(speakerSelectMenu);
  return row;
}

export async function execute(interaction: ChatInputCommandInteraction) {
  const speakers = await getSpeakers();
  const buttons = buildButtons(speakers);
  await interaction.reply({ components: [buttons] });
}

export async function handleSpeakerSelect(interaction: StringSelectMenuInteraction) {
  const [speakerId] = interaction.values;
  if (speakerId) {
    selectedSpeakers[interaction.user.id] = speakerId;
  }

  await interaction.deferUpdate();
}
