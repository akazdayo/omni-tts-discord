import { SlashCommandBuilder, ChatInputCommandInteraction, Collection } from 'discord.js';
import * as joinCommand from './join';

interface Command {
  data: SlashCommandBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

export const commands = new Collection<string, Command>();

commands.set(joinCommand.data.name, joinCommand);
