import { ChatInputCommandInteraction, Client, SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuInteraction, StringSelectMenuOptionBuilder, ActionRowBuilder, MessageFlags } from 'discord.js';
import { getSpeakers } from '../lib/getSpeakers';

type SelectedSpeakers = Record<string, string>;

export const data = new SlashCommandBuilder()
  .setName('speaker')
  .setDescription('Speakerを変更できるよ');

export const selectedSpeakers: SelectedSpeakers = {};

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
    speakers.map(async speakerId => {
      const label = await resolveSpeakerLabel(speakerId, client);
      return new StringSelectMenuOptionBuilder()
        .setLabel(label)
        .setValue(speakerId);
    })
  );

  const speakerSelectMenu = new StringSelectMenuBuilder()
    .setCustomId('speakers')
    .setPlaceholder('Select a speaker')
    .addOptions(options);

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(speakerSelectMenu);
  return row;
}

export async function execute(interaction: ChatInputCommandInteraction) {
  const speakers = await getSpeakers();
  const buttons = await buildButtons(speakers, interaction.client);
  await interaction.reply({ components: [buttons], flags: MessageFlags.Ephemeral });
}

export async function handleSpeakerSelect(interaction: StringSelectMenuInteraction) {
  const [speakerId] = interaction.values;
  if (speakerId) {
    selectedSpeakers[interaction.user.id] = speakerId;
  }

  await interaction.deferUpdate();
}
