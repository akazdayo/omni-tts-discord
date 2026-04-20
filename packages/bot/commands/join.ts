import type { ChatInputCommandInteraction, GuildMember } from "discord.js";
import { MessageFlags, SlashCommandBuilder } from "discord.js";
import type { AudioPlayer, VoiceConnection } from "@discordjs/voice";
import { createAudioPlayer, joinVoiceChannel } from "@discordjs/voice";
import { enqueueSpeech } from "../lib/playback-queue.js";

export interface SpeechQueue {
  items: { content: string; speaker: string }[];
  running: boolean;
}

export interface VoiceChannels {
  connection: VoiceConnection;
  player: AudioPlayer;
  queue: SpeechQueue;
  randomTimer: ReturnType<typeof setTimeout> | null;
  targetChannel: string;
  voiceChannel: string;
}
export const connections = new Map<string, VoiceChannels>();

const randomThings = [
  "ふわっ",
  "ぴこっ",
  "なんか いる",
  "空気が きらきらしてる",
  "いまのうちに おやつ",
  "ぽん",
  "たまに こういうの ある",
  "ねむみ が きた",
  "すこしだけ しゃべる",
  "どこかで こんにちは",
];

const defaultRandomDelayMs = 10 * 60 * 1000;
const randomDelayRangeMs = 20 * 60 * 1000;

const getRandomDelayMs = (): number => {
  const minRaw = Number(process.env.RANDOM_SPEECH_MIN_MS ?? defaultRandomDelayMs);
  const maxRaw = Number(
    process.env.RANDOM_SPEECH_MAX_MS ?? defaultRandomDelayMs + randomDelayRangeMs,
  );
  const min = Number.isFinite(minRaw) ? minRaw : defaultRandomDelayMs;
  const max = Number.isFinite(maxRaw) ? maxRaw : defaultRandomDelayMs + randomDelayRangeMs;
  const low = Math.min(min, max);
  const high = Math.max(min, max);
  return low + Math.floor(Math.random() * (high - low + 1));
};

const pickRandomThing = (): string =>
  randomThings[Math.floor(Math.random() * randomThings.length)] ?? "ふわっ";

export const clearRandomSpeechTimer = (guildId: string): void => {
  const current = connections.get(guildId);
  if (!current?.randomTimer) {
    return;
  }

  clearTimeout(current.randomTimer);
  current.randomTimer = null;
};

export const scheduleRandomSpeechTimer = (guildId: string): void => {
  const current = connections.get(guildId);
  if (!current) {
    return;
  }

  clearRandomSpeechTimer(guildId);
  current.randomTimer = setTimeout(async () => {
    const connection = connections.get(guildId);
    if (!connection) {
      return;
    }

    try {
      await enqueueSpeech(connection.player, connection.queue, {
        content: pickRandomThing(),
        speaker: "874568803256786945",
      });
    } finally {
      if (connections.has(guildId)) {
        scheduleRandomSpeechTimer(guildId);
      }
    }
  }, getRandomDelayMs());
};

export const removeConnections = (guildId: string): void => {
  clearRandomSpeechTimer(guildId);
  connections.delete(guildId);
};

export const data = new SlashCommandBuilder().setName("join").setDescription("じょいん");

export const execute = async (interaction: ChatInputCommandInteraction): Promise<void> => {
  const member = interaction.member as GuildMember;
  const vc = member.voice.channel;
  const currentConnection = connections.get(vc?.guild.id ?? "");

  if (!vc) {
    await interaction.reply({ content: "先にVC入ってわよ", flags: MessageFlags.Ephemeral });
    return;
  } else if (!vc.joinable) {
    await interaction.reply({ content: "vc入れないかも", flags: MessageFlags.Ephemeral });
    return;
  } else if (!interaction.channel?.isSendable()) {
    await interaction.reply({
      content: "私テキストの送信権限なさそうかも",
      flags: MessageFlags.Ephemeral,
    });
    return;
  } else if (currentConnection?.voiceChannel === vc.id) {
    await interaction.reply({
      content: "もうこのVCに参加してるかも",
      flags: MessageFlags.Ephemeral,
    });
    return;
  } else if (currentConnection) {
    await interaction.reply({
      content: `もう<#${currentConnection.voiceChannel}>に参加してるかも`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }
  const connection = joinVoiceChannel({
    adapterCreator: vc.guild.voiceAdapterCreator,
    channelId: vc.id,
    guildId: vc.guild.id,
  });
  const textChannel = interaction.channel?.id;
  const player = createAudioPlayer();

  if (!connection?.subscribe(player)) {
    await interaction.reply({ content: "発言権限ないかも", flags: MessageFlags.Ephemeral });
    return;
  }
  connections.set(vc.guild.id, {
    connection,
    player,
    queue: {
      items: [],
      running: false,
    },
    randomTimer: null,
    targetChannel: textChannel,
    voiceChannel: vc.id,
  });
  scheduleRandomSpeechTimer(vc.guild.id);
  await interaction.reply({ content: "全部成功したらしい", flags: MessageFlags.Ephemeral });
};
