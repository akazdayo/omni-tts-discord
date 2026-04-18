import type { SlashCommandBuilder, ChatInputCommandInteraction} from "discord.js";
import { Collection } from "discord.js";
import * as joinCommand from "./join";
import * as leaveCommand from "./leave";
import * as speakerCommand from "./speaker";

interface Command {
  data: SlashCommandBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

export const commands = new Collection<string, Command>();
export const commandList: Command[] = [joinCommand, speakerCommand, leaveCommand];

for (const cmd of commandList) {
  commands.set(cmd.data.name, cmd);
}
